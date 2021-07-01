import { getDb, getStops, getRoutes, getTrips } from 'gtfs'
import toposort from 'toposort'
import { groupBy, last, sortBy, uniq, uniqBy } from 'lodash-es'
import { DateTime } from 'luxon'

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

export const queryRidershipData = async ({ route_id, direction_id, start_date, end_date }) => {
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
    const boardAlights = await db.all(`SELECT board_alight.trip_id, route_id, stop_id, boardings, alightings, load_count, service_date FROM board_alight LEFT JOIN trips ON board_alight.trip_id = trips.trip_id ${whereClause} ORDER BY stop_sequence ASC`, values)

    return boardAlights
}