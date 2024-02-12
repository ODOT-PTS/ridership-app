import {
  getStops,
  getRoutes,
  getTrips,
  getStoptimes,
  getAgencies,
  openDb,
} from 'gtfs'
import toposort from 'toposort'
import {
  compact,
  groupBy,
  last,
  maxBy,
  orderBy,
  sortBy,
  uniq,
  uniqBy,
} from 'lodash-es'
import { DateTime, Duration } from 'luxon'
import pluralize from 'pluralize'
import untildify from 'untildify'

export const formatRouteName = (route) => {
  const nameParts = []

  if (route.route_short_name !== '' && route.route_short_name !== null) {
    nameParts.push(route.route_short_name)
  }

  if (route.route_long_name !== '' && route.route_long_name !== null) {
    nameParts.push(route.route_long_name)
  }

  return nameParts.join(' - ')
}

const classifyDayOfWeek = (dayOfWeek) => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  if (weekdays.includes(dayOfWeek)) {
    return 'Weekday'
  }

  return dayOfWeek
}

const classifyTimeOfDay = (time, timeBucketSize = 60) => {
  const [hours, minutes] = time.split(':')
  const minutesAfterMidnight = parseInt(hours, 10) * 60 + parseInt(minutes, 10)

  return Math.floor(minutesAfterMidnight / timeBucketSize) * timeBucketSize
}

export const queryAgencies = () => {
  const db = openDb({ sqlitePath: untildify(process.env.SQLITE_PATH) })
  return getAgencies({}, ['agency_name'])
}

export const queryStops = ({ route_id, direction_id }) => {
  const db = openDb({ sqlitePath: untildify(process.env.SQLITE_PATH) })
  const values = []
  const whereClauses = []

  if (route_id && route_id !== 'all') {
    whereClauses.push('trips.route_id = ?')
    values.push(route_id)
  }

  if (direction_id === 'null') {
    whereClauses.push('direction_id IS NULL')
  } else if (direction_id !== 'all') {
    whereClauses.push('direction_id = ?')
    values.push(Number.parseInt(direction_id, 10))
  }

  const whereClause =
    whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join(' AND ')}`
  const boardAlights = db
    .prepare(
      `
    SELECT board_alight.trip_id, stop_id
    FROM board_alight
    LEFT JOIN trips ON board_alight.trip_id = trips.trip_id
    ${whereClause}
    ORDER BY board_alight.stop_sequence
  `,
    )
    .all(values)

  if (
    route_id !== undefined &&
    route_id !== 'all' &&
    direction_id !== undefined &&
    direction_id !== 'all'
  ) {
    // Use a directed graph to determine stop order.
    let routeStopOrder

    try {
      const tripGroups = groupBy(boardAlights, 'trip_id')
      const stopGraph = []

      for (const tripGroup of Object.values(tripGroups)) {
        const sortedStopIds = []

        for (const boardAlight of tripGroup) {
          if (last(sortedStopIds) !== boardAlight.stop_id) {
            sortedStopIds.push(boardAlight.stop_id)
          }
        }

        for (const [index, stopId] of sortedStopIds.entries()) {
          if (index === sortedStopIds.length - 1) {
            continue
          }

          stopGraph.push([stopId, sortedStopIds[index + 1]])
        }
      }

      routeStopOrder = toposort(stopGraph)
    } catch {
      // Fall back to using the stop order from the trip with the most stoptimes.
      const tripIds = uniq(
        boardAlights.map((boardAlight) => boardAlight.trip_id),
      )
      const tripsWithStopCounts = db
        .prepare(
          `SELECT trips.trip_id, COUNT(stop_times.stop_id) AS stop_count FROM trips LEFT JOIN stop_times USING(trip_id) WHERE trips.trip_id IN (${tripIds.map(
            (t) => '?',
          )}) GROUP BY trips.trip_id`,
        )
        .all(tripIds)
      const { trip_id: tripId } = maxBy(
        tripsWithStopCounts,
        (tripsWithStopCount) => tripsWithStopCount.stop_count,
      )
      const stops = getStoptimes(
        { trip_id: tripId },
        ['stop_id', 'stop_sequence'],
        [['stop_sequence', 'ASC']],
      )
      routeStopOrder = stops.map((stop) => stop.stop_id)
    }

    const stops = getStops({ stop_id: routeStopOrder }, [
      'stop_id',
      'stop_name',
      'stop_lat',
      'stop_lon',
    ])
    return routeStopOrder.map((stopId) =>
      stops.find((stop) => stop.stop_id === stopId),
    )
  }

  // Else order stops by name
  const stopIds = boardAlights.map((boardAlight) => boardAlight.stop_id)
  return getStops(
    { stop_id: stopIds },
    ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
    [['stop_name', 'ASC']],
  )
}

export const queryRoutesAndDirections = () => {
  const db = openDb({ sqlitePath: untildify(process.env.SQLITE_PATH) })
  const routes = getRoutes(
    {},
    ['route_id', 'route_short_name', 'route_long_name'],
    [['route_short_name', 'ASC']],
  )

  const routesWithDirections = compact(
    routes.map((route) => {
      const trips = getTrips(
        {
          route_id: route.route_id,
        },
        ['trip_headsign', 'direction_id'],
        [['direction_id', 'ASC']],
      )

      if (trips.length === 0) {
        return null
      }

      route.directions = uniqBy(trips, (trip) => trip.direction_id)

      return route
    }),
  )

  return sortBy(routesWithDirections, (route) =>
    parseInt(route.route_short_name, 10),
  )
}

const sumRidershipData = (dataPoint, boardAlight) => {
  const fields = [
    'boardings',
    'alightings',
    'bike_boardings',
    'load_count',
    'bike_alightings',
    'ramp_boardings',
    'ramp_alightings',
  ]

  for (const field of fields) {
    if (boardAlight[field] !== null) {
      if (dataPoint[field] === null || dataPoint[field] === undefined) {
        dataPoint[field] = boardAlight[field]
      } else {
        dataPoint[field] += boardAlight[field]
      }
    }
  }

  dataPoint.record_count += 1
}

const createEmptyDataPoint = (fields) => {
  return {
    load_type: null,
    ...fields,
    boardings: 0,
    alightings: 0,
    bike_boardings: 0,
    load_count: 0,
    bike_alightings: 0,
    ramp_boardings: 0,
    ramp_alightings: 0,
    record_count: 0,
  }
}

const groupRidershipData = (boardAlights, filters) => {
  const { start_date, end_date, grouping, time_bucket_size } = filters

  if (boardAlights.length === 0) {
    return []
  }

  const timeBucketSize = parseInt(time_bucket_size, 10)

  if (grouping === 'none') {
    return boardAlights
  } else if (grouping === 'route') {
    const routes = queryRoutesAndDirections()

    const dataPoints = routes.map((route) => {
      return createEmptyDataPoint({
        label: formatRouteName(route),
        route_id: route.route_id,
        load_type: boardAlights.length > 0 ? boardAlights[0].load_type : null,
      })
    })

    for (const boardAlight of boardAlights) {
      let dataPoint = dataPoints.find(
        (item) => item.route_id === boardAlight.route_id,
      )

      if (!dataPoint) {
        console.warn(`Unable to find route_id ${boardAlight.route_id}`)
        continue
      }

      sumRidershipData(dataPoint, boardAlight)
    }

    return dataPoints
  } else if (grouping === 'day') {
    const dataPoints = []

    let cursor = DateTime.fromISO(start_date).toFormat('yyyyMMdd')
    while (cursor <= DateTime.fromISO(end_date).toFormat('yyyyMMdd')) {
      dataPoints.push(
        createEmptyDataPoint({
          label: DateTime.fromFormat(cursor, 'yyyyMMdd').toISODate(),
          service_date: parseInt(cursor, 10),
          load_type: boardAlights.length > 0 ? boardAlights[0].load_type : null,
        }),
      )
      cursor = DateTime.fromFormat(cursor, 'yyyyMMdd')
        .plus({ days: 1 })
        .toFormat('yyyyMMdd')
    }

    for (const boardAlight of boardAlights) {
      let dataPoint = dataPoints.find(
        (item) => item.service_date === boardAlight.service_date,
      )

      sumRidershipData(dataPoint, boardAlight)
    }

    return dataPoints
  } else if (grouping === 'day-of-week') {
    const dataPoints = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ].map((dayOfWeek) =>
      createEmptyDataPoint({
        label: pluralize(dayOfWeek),
        service_day_of_week: dayOfWeek,
        load_type: boardAlights.length > 0 ? boardAlights[0].load_type : null,
      }),
    )

    for (const boardAlight of boardAlights) {
      const dayOfWeek = DateTime.fromFormat(
        boardAlight.service_date.toString(),
        'yyyyMMdd',
      ).toFormat('cccc')
      let dataPoint = dataPoints.find(
        (item) => item.service_day_of_week === dayOfWeek,
      )

      if (!dataPoint) {
        continue
      }

      sumRidershipData(dataPoint, boardAlight)
    }

    // Calculate number of each day of week in date range
    const dayCounts = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ].map((dayOfWeek) => {
      return {
        dayOfWeek,
        count: 0,
      }
    })
    let cursor = DateTime.fromISO(start_date).toFormat('yyyyMMdd')
    while (cursor <= DateTime.fromISO(end_date).toFormat('yyyyMMdd')) {
      dayCounts.find(
        (item) =>
          item.dayOfWeek ===
          DateTime.fromFormat(cursor, 'yyyyMMdd').toFormat('cccc'),
      ).count++
      cursor = DateTime.fromFormat(cursor, 'yyyyMMdd')
        .plus({ days: 1 })
        .toFormat('yyyyMMdd')
    }

    // Use average daily ridership for each day of week
    for (const dataPoint of dataPoints) {
      const dayCount = dayCounts.find(
        (item) => item.dayOfWeek === dataPoint.service_day_of_week,
      ).count
      dataPoint.label = `Average ${dataPoint.label}`
      dataPoint.boardings = Math.round(dataPoint.boardings / dayCount)
      dataPoint.alightings = Math.round(dataPoint.alightings / dayCount)
      dataPoint.bike_boardings = Math.round(dataPoint.bike_boardings / dayCount)
      dataPoint.bike_alightings = Math.round(
        dataPoint.bike_alightings / dayCount,
      )
      dataPoint.ramp_boardings = Math.round(dataPoint.ramp_boardings / dayCount)
      dataPoint.ramp_alightings = Math.round(
        dataPoint.ramp_alightings / dayCount,
      )
    }

    return dataPoints
  } else if (grouping === 'day-of-week-type') {
    const dataPoints = ['Weekday', 'Saturday', 'Sunday'].map((dayOfWeekType) =>
      createEmptyDataPoint({
        label: pluralize(dayOfWeekType),
        service_day_of_week_type: dayOfWeekType,
        load_type: boardAlights.length > 0 ? boardAlights[0].load_type : null,
      }),
    )

    for (const boardAlight of boardAlights) {
      const dayOfWeekType = classifyDayOfWeek(
        DateTime.fromFormat(
          boardAlight.service_date.toString(),
          'yyyyMMdd',
        ).toFormat('cccc'),
      )
      let dataPoint = dataPoints.find(
        (item) => item.service_day_of_week_type === dayOfWeekType,
      )

      if (!dataPoint) {
        continue
      }

      sumRidershipData(dataPoint, boardAlight)
    }

    // Calculate number of each day of week type in date range
    const dayOfWeekTypeCounts = ['Weekday', 'Saturday', 'Sunday'].map(
      (dayOfWeekType) => {
        return {
          dayOfWeekType,
          count: 0,
        }
      },
    )
    let cursor = DateTime.fromISO(start_date).toFormat('yyyyMMdd')
    while (cursor <= DateTime.fromISO(end_date).toFormat('yyyyMMdd')) {
      const dayOfWeekType = classifyDayOfWeek(
        DateTime.fromFormat(cursor, 'yyyyMMdd').toFormat('cccc'),
      )

      dayOfWeekTypeCounts.find((item) => item.dayOfWeekType === dayOfWeekType)
        .count++
      cursor = DateTime.fromFormat(cursor, 'yyyyMMdd')
        .plus({ days: 1 })
        .toFormat('yyyyMMdd')
    }

    // Use average daily ridership for each day of week type
    for (const dataPoint of dataPoints) {
      const dayOfWeekTypeCount = dayOfWeekTypeCounts.find(
        (item) => item.dayOfWeekType === dataPoint.service_day_of_week_type,
      ).count
      dataPoint.label = `Average ${dataPoint.label}`
      dataPoint.boardings = Math.round(dataPoint.boardings / dayOfWeekTypeCount)
      dataPoint.alightings = Math.round(
        dataPoint.alightings / dayOfWeekTypeCount,
      )
      dataPoint.bike_boardings = Math.round(
        dataPoint.bike_boardings / dayOfWeekTypeCount,
      )
      dataPoint.bike_alightings = Math.round(
        dataPoint.bike_alightings / dayOfWeekTypeCount,
      )
      dataPoint.ramp_boardings = Math.round(
        dataPoint.ramp_boardings / dayOfWeekTypeCount,
      )
      dataPoint.ramp_alightings = Math.round(
        dataPoint.ramp_alightings / dayOfWeekTypeCount,
      )
    }

    return dataPoints
  } else if (grouping === 'time-of-day') {
    const dataPoints = []

    for (const boardAlight of boardAlights) {
      // Ignore boardAlights with no stoptime
      if (boardAlight.departure_time === null) {
        continue
      }

      const timeGroup = classifyTimeOfDay(
        boardAlight.departure_time,
        timeBucketSize,
      )
      let dataPoint = dataPoints.find((item) => item.time_group === timeGroup)

      if (!dataPoint) {
        dataPoint = createEmptyDataPoint({
          label: `${Duration.fromObject({ minutes: timeGroup }).toFormat(
            'h:mm',
          )} - ${Duration.fromObject({
            minutes: timeGroup + timeBucketSize,
          }).toFormat('h:mm')}`,
          time_group: timeGroup,
          load_type: boardAlights.length > 0 ? boardAlights[0].load_type : null,
        })
        dataPoints.push(dataPoint)
      }

      sumRidershipData(dataPoint, boardAlight)
    }

    const sortedDataPoints = sortBy(dataPoints, 'time_group')
    const filledDataPoints = []

    let cursor = sortedDataPoints[0].time_group
    while (cursor <= sortedDataPoints[sortedDataPoints.length - 1].time_group) {
      let dataPoint = sortedDataPoints.find(
        (dataPoint) => dataPoint.time_group === cursor,
      )

      if (!dataPoint) {
        dataPoint = createEmptyDataPoint({
          label: `${Duration.fromObject({ minutes: cursor }).toFormat(
            'h:mm',
          )} - ${Duration.fromObject({
            minutes: cursor + timeBucketSize,
          }).toFormat('h:mm')}`,
          time_group: cursor,
          load_type: boardAlights.length > 0 ? boardAlights[0].load_type : null,
        })
      }

      filledDataPoints.push(dataPoint)

      cursor += timeBucketSize
    }

    return filledDataPoints
  } else if (grouping === 'trip') {
    const dataPoints = []

    for (const boardAlight of boardAlights) {
      // Ignore boardAlights with no stoptime
      if (boardAlight.departure_time === null) {
        continue
      }

      let dataPoint = dataPoints.find(
        (item) => item.trip_id === boardAlight.trip_id,
      )

      if (!dataPoint) {
        dataPoint = {
          trip_id: boardAlight.trip_id,
          departure_time: boardAlight.departure_time,
          load_type: boardAlight.load_type,
          record_count: 1,
        }
        dataPoints.push(dataPoint)
      }

      if (
        DateTime.fromFormat(boardAlight.departure_time, 'H:mm:ss') <
        DateTime.fromFormat(dataPoint.departure_time, 'H:mm:ss')
      ) {
        dataPoint.departure_time = boardAlight.departure_time
      }

      sumRidershipData(dataPoint, boardAlight)
    }

    // Add label based on earliest departure time on trip
    for (const dataPoint of dataPoints) {
      dataPoint.label = `${dataPoint.departure_time} - ${dataPoint.trip_id}`
    }

    return orderBy(
      dataPoints,
      (dataPoint) =>
        DateTime.fromFormat(dataPoint.departure_time, 'H:mm:s').toJSDate(),
      ['asc'],
    )
  } else if (grouping === 'stop') {
    const dataPoints = []

    for (const boardAlight of boardAlights) {
      let dataPoint = dataPoints.find(
        (item) => item.stop_id === boardAlight.stop_id,
      )

      if (!dataPoint) {
        dataPoint = {
          stop_id: boardAlight.stop_id,
          load_type: boardAlight.load_type,
          record_count: 1,
        }
        dataPoints.push(dataPoint)
      }

      sumRidershipData(dataPoint, boardAlight)
    }

    // Get stops in order if route_id and direction_id
    const stops = queryStops(filters)

    return stops.map((stop) => {
      const dataPoint = dataPoints.find((item) => item.stop_id === stop.stop_id)

      if (!dataPoint) {
        return createEmptyDataPoint({
          label: stop.stop_name,
          stop_id: stop.stop_id,
          stop_lat: stop.stop_lat,
          stop_lon: stop.stop_lon,
        })
      }

      return {
        label: stop.stop_name,
        stop_id: stop.stop_id,
        stop_lat: stop.stop_lat,
        stop_lon: stop.stop_lon,
        ...dataPoint,
      }
    })
  }

  throw new Error('Invalid grouping')
}

const processRidershipData = (ridershipData) => {
  for (const item of ridershipData) {
    item.average_load_count = item.load_count / item.record_count
  }

  return ridershipData
}

export const queryRidershipData = (filters) => {
  const db = openDb({ sqlitePath: untildify(process.env.SQLITE_PATH) })
  const {
    route_id,
    direction_id,
    stop_id,
    start_date,
    end_date,
    grouping,
    day_of_week_type,
  } = filters
  const values = []
  const whereClauses = []

  if (route_id && route_id !== 'all') {
    whereClauses.push('trips.route_id = ?')
    values.push(route_id)
  }

  if (direction_id && direction_id !== 'all') {
    whereClauses.push('trips.direction_id = ?')
    values.push(Number.parseInt(direction_id, 10))
  }

  if (stop_id && stop_id !== 'all') {
    whereClauses.push('board_alight.stop_id = ?')
    values.push(stop_id)
  }

  if (start_date !== undefined) {
    whereClauses.push('board_alight.service_date >= ?')
    values.push(DateTime.fromISO(start_date).toISODate({ format: 'basic' }))
  }

  if (end_date !== undefined) {
    whereClauses.push('board_alight.service_date <= ?')
    values.push(DateTime.fromISO(end_date).toISODate({ format: 'basic' }))
  }

  const whereClause =
    whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join(' AND ')}`
  const fields = [
    'board_alight.trip_id',
    'trips.route_id',
    'board_alight.stop_id',
    'board_alight.boardings',
    'board_alight.alightings',
    'board_alight.load_count',
    'board_alight.load_type',
    'board_alight.bike_boardings',
    'board_alight.bike_alightings',
    'board_alight.ramp_boardings',
    'board_alight.ramp_alightings',
    'board_alight.service_date',
  ]
  let boardAlights

  if (grouping === 'none') {
    boardAlights = db
      .prepare(
        `
      SELECT *
      FROM board_alight
      LEFT JOIN trips
      ON board_alight.trip_id = trips.trip_id 
      ${whereClause}
      ORDER BY stop_sequence ASC
    `,
      )
      .all(values)
  } else if (grouping === 'time-of-day' || grouping === 'trip') {
    // Get stoptime departure_time for grouping
    fields.push('stop_times.departure_time')
    boardAlights = db
      .prepare(
        `
      SELECT ${fields.join(', ')} 
      FROM board_alight 
      LEFT JOIN trips 
      ON board_alight.trip_id = trips.trip_id 
      LEFT JOIN stop_times 
      ON board_alight.trip_id = stop_times.trip_id AND board_alight.stop_id = stop_times.stop_id 
      ${whereClause}
      ORDER BY board_alight.stop_sequence ASC
    `,
      )
      .all(values)
  } else {
    boardAlights = db
      .prepare(
        `
      SELECT ${fields.join(', ')}
      FROM board_alight
      LEFT JOIN trips
      ON board_alight.trip_id = trips.trip_id 
      ${whereClause}
      ORDER BY stop_sequence ASC
    `,
      )
      .all(values)
  }

  if (day_of_week_type !== 'all') {
    boardAlights = boardAlights.filter(
      (boardAlight) =>
        classifyDayOfWeek(
          DateTime.fromFormat(
            boardAlight.service_date.toString(),
            'yyyyMMdd',
          ).toFormat('cccc'),
        ) === day_of_week_type,
    )
  }

  return processRidershipData(groupRidershipData(boardAlights, filters))
}

export const queryRidershipDateRange = () => {
  const db = openDb({ sqlitePath: untildify(process.env.SQLITE_PATH) })
  const firstBoardAlight = db
    .prepare(
      `
    SELECT service_date
    FROM board_alight
    ORDER BY service_date ASC
    LIMIT 1
  `,
    )
    .get()

  const lastBoardAlight = db
    .prepare(
      `
    SELECT service_date
    FROM board_alight
    ORDER BY service_date DESC
    LIMIT 1
  `,
    )
    .get()

  if (!firstBoardAlight || !lastBoardAlight) {
    return null
  }

  return [firstBoardAlight.service_date, lastBoardAlight.service_date]
}
