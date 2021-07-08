import { getDb, getStops, getRoutes, getTrips, getStoptimes, getDirections } from 'gtfs'
import toposort from 'toposort'
import { groupBy, last, maxBy, sortBy, uniq, uniqBy } from 'lodash-es'
import { DateTime } from 'luxon'
import pluralize from 'pluralize'

const classifyDayOfWeek = dayOfWeek => {
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ]

  if (weekdays.includes(dayOfWeek)) {
    return 'Weekday'
  }

  return dayOfWeek
}

const classifyTimeOfDay = time => {
  return DateTime.fromFormat(time, 'hh:mm:ss').toFormat('H')
}

export const queryStops = async ({ route_id, direction_id }) => {
  if (!route_id) {
    throw new Error('route_id required')
  }

  if (!direction_id) {
    throw new Error('direction_id required')
  }

  const db = getDb()
  const values = [route_id]

  let directionQuery = ''
  if (direction_id === 'null') {
    directionQuery = 'AND direction_id IS NULL'
  } else if (direction_id !== undefined) {
    directionQuery = 'AND direction_id = ?'
    values.push(Number.parseInt(direction_id, 10))
  }

  const boardAlights = await db.all(`SELECT board_alight.trip_id, route_id, stop_id, boardings, alightings, load_count, service_date FROM board_alight LEFT JOIN trips ON board_alight.trip_id = trips.trip_id WHERE route_id = ? ${directionQuery} ORDER BY stop_sequence ASC`, values)

  let routeStopOrder
  // Use a directed graph to determine stop order.
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
    const tripIds = uniq(boardAlights.map(boardAlight => boardAlight.trip_id))
    const tripsWithStopCounts = await db.all(`SELECT trips.trip_id, COUNT(stop_times.stop_id) AS stop_count FROM trips LEFT JOIN stop_times USING(trip_id) WHERE trips.trip_id IN (${tripIds.map(t => '?')}) GROUP BY trips.trip_id`, tripIds)
    const { trip_id: tripId } = maxBy(tripsWithStopCounts, tripsWithStopCount => tripsWithStopCount.stop_count)
    const stops = await getStoptimes({ trip_id: tripId }, ['stop_id', 'stop_sequence'], [['stop_sequence', 'ASC']])
    routeStopOrder = stops.map(stop => stop.stop_id)
  }

  const stops = await getStops({ stop_id: routeStopOrder }, ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'])

  return routeStopOrder.map(stopId => stops.find(stop => stop.stop_id === stopId))
}

export const queryRoutesAndDirections = async () => {
  const routes = await getRoutes({}, ['route_id', 'route_short_name', 'route_long_name'], [['route_short_name', 'ASC']])

  const routesWithDirections = await Promise.all(routes.map(async route => {
    const trips = await getTrips({
      route_id: route.route_id
    }, [
      'trip_headsign',
      'direction_id'
    ], [
      ['direction_id', 'ASC']
    ])
    route.directions = uniqBy(trips, trip => trip.direction_id)

    return route
  }))

  return sortBy(routesWithDirections, route => parseInt(route.route_short_name, 10))
}

const groupRidershipData = async (boardAlights, filters) => {
  const { start_date, end_date, grouping } = filters

  if (boardAlights.length === 0) {
    return []
  }

  if (grouping === 'none') {
    return boardAlights
  } else if (grouping === 'day') {
    const dataPoints = []

    let cursor = DateTime.fromISO(start_date).toFormat('yyyyMMdd')
    while (cursor <= DateTime.fromISO(end_date).toFormat('yyyyMMdd')) {
      dataPoints.push({
        label: DateTime.fromFormat(cursor, 'yyyyMMdd').toISODate(),
        service_date: parseInt(cursor, 10),
        boardings: 0,
        alightings: 0,
        load_count: 0
      })
      cursor = DateTime.fromFormat(cursor, 'yyyyMMdd').plus({ days: 1 }).toFormat('yyyyMMdd')
    }
  
    for (const boardAlight of boardAlights) {
      let dataPoint = dataPoints.find(item => item.service_date === boardAlight.service_date)
  
      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings
      }
  
      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings
      }
  
      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count
      }
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
      'Sunday'
    ].map(dayOfWeek => ({
      label: pluralize(dayOfWeek),
      service_day_of_week: dayOfWeek,
      boardings: 0,
      alightings: 0,
      load_count: 0
    }))
  
    for (const boardAlight of boardAlights) {
      const dayOfWeek = DateTime.fromFormat(boardAlight.service_date.toString(), 'yyyyMMdd').toFormat('cccc')
      let dataPoint = dataPoints.find(item => item.service_day_of_week === dayOfWeek)

      if (!dataPoint) {
        continue
      }
  
      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings
      }
  
      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings
      }
  
      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count
      }
    }

    return dataPoints
  } else if (grouping === 'day-of-week-type') {
    const dataPoints = [
      'Weekday',
      'Saturday',
      'Sunday'
    ].map(dayOfWeekType => ({
      label: pluralize(dayOfWeekType),
      service_day_of_week_type: dayOfWeekType,
      boardings: 0,
      alightings: 0,
      load_count: 0
    }))

    for (const boardAlight of boardAlights) {
      const dayOfWeekType = classifyDayOfWeek(DateTime.fromFormat(boardAlight.service_date.toString(), 'yyyyMMdd').toFormat('cccc'))
      let dataPoint = dataPoints.find(item => item.service_day_of_week_type === dayOfWeekType)

      if (!dataPoint) {
        continue
      }

      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings
      }

      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings
      }

      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count
      }
    }

    return dataPoints
  } else if (grouping === 'time-of-day') {
    const dataPoints = []
  
    for (const boardAlight of boardAlights) {
      const timeGroup = classifyTimeOfDay(boardAlight.departure_time)
      let dataPoint = dataPoints.find(item => item.time_group === timeGroup)

      if (!dataPoint) {
        dataPoint = {
          label: `${DateTime.fromFormat(timeGroup, 'H').toFormat('H:00')} - ${DateTime.fromFormat(timeGroup, 'H').plus({ hours: 1 }).toFormat('H:00')}`,
          time_group: timeGroup,
          boardings: 0,
          alightings: 0,
          load_count: 0
        }
        dataPoints.push(dataPoint)
      }

      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings
      }

      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings
      }

      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count
      }
    }

    const sortedDataPoints = sortBy(dataPoints, dataPoint => parseInt(dataPoint.time_group, 10))
    const filledDataPoints = []

    let cursor = parseInt(sortedDataPoints[0].time_group, 10)
    while (cursor <= parseInt(sortedDataPoints[sortedDataPoints.length - 1].time_group, 10)) {
      let dataPoint = sortedDataPoints.find(dataPoint => parseInt(dataPoint.time_group, 10) === cursor)

      if (!dataPoint) {
        const timeGroup = cursor.toString()
        dataPoint = {
          label: `${DateTime.fromFormat(timeGroup, 'H').toFormat('H:00')} - ${DateTime.fromFormat(timeGroup, 'H').plus({ hours: 1 }).toFormat('H:00')}`,
          time_group: timeGroup,
          boardings: 0,
          alightings: 0,
          load_count: 0
        }
      }

      filledDataPoints.push(dataPoint)

      cursor += 1
    }
    
    return filledDataPoints
  } else if (grouping === 'stop') {
    const stops = await queryStops(filters)

    const dataPoints = stops.map(stop => {
      return {
        label: stop.stop_name,
        stop_id: stop.stop_id,
        stop_lat: stop.stop_lat,
        stop_lon: stop.stop_lon,
        boardings: 0,
        alightings: 0,
        load_count: 0
      }
    })
  
    for (const boardAlight of boardAlights) {
      let dataPoint = dataPoints.find(item => item.stop_id === boardAlight.stop_id)

      if (!dataPoint) {
        console.warn(`Unable to find stop_id ${boardAlight.stop_id}`)
        continue
      }
  
      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings
      }
  
      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings
      }
  
      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count
      }
    }

    return dataPoints
  }

  throw new Error('Invalid grouping')
}

export const queryRidershipData = async filters => {
  const { route_id, direction_id, stop_id, start_date, end_date, grouping } = filters
  const db = getDb()
  const values = []
  const whereClauses = []

  if (route_id !== 'all') {
    whereClauses.push('trips.route_id = ?')
    values.push(route_id)
  }

  if (direction_id !== 'all') {
    whereClauses.push('trips.direction_id = ?')
    values.push(Number.parseInt(direction_id, 10))
  }

  if (stop_id !== 'all') {
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

  const whereClause = whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join(' AND ')}`
  const fields = [
    'board_alight.trip_id',
    'trips.route_id',
    'board_alight.stop_id',
    'board_alight.boardings',
    'board_alight.alightings',
    'board_alight.load_count',
    'board_alight.service_date'
  ]
  let boardAlights
  
  if (grouping === 'time-of-day') {
    boardAlights = await db.all(`
      SELECT *
      FROM board_alight
      LEFT JOIN trips
      ON board_alight.trip_id = trips.trip_id 
      ${whereClause}
      ORDER BY stop_sequence ASC
    `, values)
  } else if (grouping === 'time-of-day') {
    // Get stoptime departure_time for grouping
    fields.push('stop_times.departure_time')
    boardAlights = await db.all(`
      SELECT ${fields.join(', ')} 
      FROM board_alight 
      LEFT JOIN trips 
      ON board_alight.trip_id = trips.trip_id 
      LEFT JOIN stop_times 
      ON board_alight.trip_id = stop_times.trip_id AND board_alight.stop_id = stop_times.stop_id 
      ${whereClause}
      ORDER BY board_alight.stop_sequence ASC
    `, values)
  } else {
    boardAlights = await db.all(`
      SELECT ${fields.join(', ')}
      FROM board_alight
      LEFT JOIN trips
      ON board_alight.trip_id = trips.trip_id 
      ${whereClause}
      ORDER BY stop_sequence ASC
    `, values)
  }

  return groupRidershipData(boardAlights, filters)
}