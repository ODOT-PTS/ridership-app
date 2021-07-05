import DatePicker from 'react-datepicker'
import { useState, useEffect } from 'react'

import 'react-datepicker/dist/react-datepicker.css'

import { formatRouteName } from '../lib/formatters.js'

const Filters = ({ routes, visualize }) => {
  const [stops, setStops] = useState()
  const [filters, setFilters] = useState({
    dateRange: [null, null],
    routeId: 'all',
    directionId: 'all',
    stopId: 'all',
    grouping: 'day'
  })

  useEffect(async () => {
    if (filters.routeId !== 'all' && filters.directionId !== 'all') {
      try {
        const response = await fetch(`/stops?route_id=${filters.routeId}&direction_id=${filters.directionId}`)
    
        if (response.ok) {
          const data = await response.json()
          setStops(data)
        } else {
          throw new Error('Bad request')
        }
      } catch (error) {
        console.warn(error)
      }
    }
  }, [filters])

  return (
    <>
      <label className="block">
        <span className="text-gray-700">Date Range</span>

        <div className="mt-1 block">
          <DatePicker
            selectsRange={true}
            startDate={filters.dateRange[0]}
            endDate={filters.dateRange[1]}
            onChange={(update) => {
              setFilters({ ...filters, dateRange: update });
            }}
            isClearable={true}
          />
        </div>
      </label>

      <label className="block">
        <span className="text-gray-700">Group By</span>
        <select
          className="mt-1 block w-full"
          onChange={event => setFilters({ ...filters, grouping: event.target.value })}
        >
          <option value="day">Day</option>
          <option value="day-of-week">Day of week</option>
          <option value="day-of-week-type">Weekday vs Sat vs Sun</option>
          <option value="time-of-day">Time of day</option>
        </select>
      </label>

      <label className="block">
        <span className="text-gray-700">Route</span>
        <select
          className="mt-1 block w-full"
          onChange={event => setFilters({
            ...filters,
            routeId: event.target.value,
            directionId: 'all',
            stopId: 'all'
          })}
        >
          <option value="all">All</option>
          {routes && routes.map(route => <option key={route.route_id} value={route.route_id}>{formatRouteName(route)}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-gray-700">Direction</span>
        <select
          className="mt-1 block w-full"
          onChange={event => setFilters({
            ...filters,
            directionId: event.target.value,
            stopId: 'all'
          })}
          value={filters.directionId}
        >
          <option value="all">Both</option>
          <option value="0">0</option>
          <option value="1">1</option>
        </select>
      </label>

      {filters.directionId !== 'all' && <label className="block">
        <span className="text-gray-700">Stop</span>
        <select
          className="mt-1 block w-full"
          onChange={event => setFilters({ ...filters, stopId: event.target.value })}
          value={filters.stopId}
        >
          <option value="all">All</option>
          {stops && stops.map(stop => <option key={stop.stop_id} value={stop.stop_id}>{stop.stop_name}</option>)}
        </select>
      </label>}

      <button
        className="bg-blue-700 px-5 py-3 text-sm shadow-sm font-medium tracking-wider border text-blue-100 rounded-full hover:shadow-lg hover:bg-blue-800"
        onClick={() => visualize(filters)}
      >Visualize</button>
    </>
  )
}

export default Filters