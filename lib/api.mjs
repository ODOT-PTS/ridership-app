import { getDb, getStops, getRoutes, getTrips } from 'gtfs'
import toposort from 'toposort'
import { groupBy, last, sortBy, uniq, uniqBy } from 'lodash-es'
import { DateTime } from 'luxon'

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

export const getRouteStops = async ({ start_date, end_date }) => {
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


    const tripCounts = await db.all(`SELECT trips.trip_id, COUNT(stoptimes.stop_id) AS stop_count FROM trips LEFT JOIN stoptimes USING(trip_id) GROUPBY trips.trip_id WHERE trips.trip_id IN (${tripIds.map(t => '?')})`, tripIds)
    
    // const longestTripStoptimes = getLongestTripStoptimes(timetable.orderedTrips, config);
    // const stopIds = longestTripStoptimes.map(stoptime => stoptime.stop_id);

    // return duplicateStopsForDifferentArrivalDeparture(stopIds, timetable, config);
  }

  const stops = await getStops({ stop_id: routeStopOrder }, ['stop_id', 'stop_name'])


  return {
    routeStopOrder,
    stops
  }
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

export const queryRidershipData = async ({ route_id, direction_id, start_date, end_date, grouping }) => {
  const db = getDb()
  const values = []
  const whereClauses = []

  if (route_id !== 'all') {
    whereClauses.push('route_id = ?')
    values.push(route_id)
  }

  if (direction_id !== 'all') {
    whereClauses.push('direction_id = ?')
    values.push(Number.parseInt(direction_id, 10))
  }

  if (start_date !== undefined) {
    whereClauses.push('service_date >= ?')
    values.push(DateTime.fromISO(start_date).toISODate({ format: 'basic' }))
  }

  if (end_date !== undefined) {
    whereClauses.push('service_date <= ?')
    values.push(DateTime.fromISO(end_date).toISODate({ format: 'basic' }))
  }

  const whereClause = whereClauses.length === 0 ? '' : `WHERE ${whereClauses.join(' AND ')}`
  let boardAlights
  
  if (grouping === 'time-of-day') {
    // Get stoptime departure_time for grouping
    boardAlights = await db.all(`SELECT board_alight.trip_id, route_id, board_alight.stop_id, boardings, alightings, load_count, service_date, departure_time FROM board_alight LEFT JOIN trips ON board_alight.trip_id = trips.trip_id LEFT JOIN stop_times ON board_alight.trip_id = stop_times.trip_id AND board_alight.stop_id = stop_times.stop_id ${whereClause} ORDER BY board_alight.stop_sequence ASC`, values)
  } else {
    boardAlights = await db.all(`SELECT board_alight.trip_id, route_id, stop_id, boardings, alightings, load_count, service_date FROM board_alight LEFT JOIN trips ON board_alight.trip_id = trips.trip_id ${whereClause} ORDER BY stop_sequence ASC`, values)
  }

  if (boardAlights.length === 0) {
    return []
  }

  if (grouping === 'day') {
    const dataPoints = [];

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
      let dataPoint = dataPoints.find(item => item.service_date === boardAlight.service_date);
  
      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings;
      }
  
      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings;
      }
  
      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count;
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
      label: dayOfWeek,
      service_day_of_week: dayOfWeek,
      boardings: 0,
      alightings: 0,
      load_count: 0
    }))
  
    for (const boardAlight of boardAlights) {
      const dayOfWeek = DateTime.fromFormat(boardAlight.service_date.toString(), 'yyyyMMdd').toFormat('cccc')
      let dataPoint = dataPoints.find(item => item.service_day_of_week === dayOfWeek);
  
      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings;
      }
  
      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings;
      }
  
      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count;
      }
    }

    return dataPoints
  } else if (grouping === 'day-of-week-type') {
    const dataPoints = [
      'Weekday',
      'Saturday',
      'Sunday'
    ].map(dayOfWeekType => ({
      label: dayOfWeekType,
      service_day_of_week_type: dayOfWeekType,
      boardings: 0,
      alightings: 0,
      load_count: 0
    }))

    for (const boardAlight of boardAlights) {
      const dayOfWeekType = classifyDayOfWeek(DateTime.fromFormat(boardAlight.service_date.toString(), 'yyyyMMdd').toFormat('cccc'))
      let dataPoint = dataPoints.find(item => item.service_day_of_week_type === dayOfWeekType);

      if (!dataPoint) {
        dataPoint = {
          label: dayOfWeekType,
          service_day_of_week_type: dayOfWeekType,
          boardings: 0,
          alightings: 0,
          load_count: 0
        };
        dataPoints.push(dataPoint);
      }

      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings;
      }

      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings;
      }

      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count;
      }
    }

    return dataPoints
  } else if (grouping === 'time-of-day') {
    const dataPoints = []
  
    for (const boardAlight of boardAlights) {
      const timeGroup = classifyTimeOfDay(boardAlight.departure_time)
      let dataPoint = dataPoints.find(item => item.time_group === timeGroup);

      if (!dataPoint) {
        dataPoint = {
          label: `${DateTime.fromFormat(timeGroup, 'H').toFormat('H:00')} - ${DateTime.fromFormat(timeGroup, 'H').plus({ hours: 1 }).toFormat('H:00')}`,
          time_group: timeGroup,
          boardings: 0,
          alightings: 0,
          load_count: 0
        };
        dataPoints.push(dataPoint);
      }

      if (boardAlight.boardings !== null) {
        dataPoint.boardings += boardAlight.boardings;
      }

      if (boardAlight.alightings !== null) {
        dataPoint.alightings += boardAlight.alightings;
      }

      if (boardAlight.load_count !== null) {
        dataPoint.load_count += boardAlight.load_count;
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
  }

  throw new Error('Invalid grouping')
}