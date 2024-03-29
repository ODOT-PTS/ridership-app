import DatePicker from 'react-date-picker'
import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'

import config from '../config.json'

import 'react-date-picker/dist/DatePicker.css'
import 'react-calendar/dist/Calendar.css'

import { formatDirectionName, formatRouteName } from '@/lib/formatters.js'
import Loading from './loading'

const Filters = ({ visualize, clearVisualization }) => {
  const [loading, setLoading] = useState(false)
  const [dataset, setDataset] = useState('')
  const [stops, setStops] = useState()
  const [routes, setRoutes] = useState()
  const [ridershipDateRange, setRidershipDateRange] = useState([])
  const initialFilters = {
    routeId: 'all',
    directionId: 'all',
    stopId: 'all',
    grouping: 'route',
    timeBucketSize: '60',
    dayOfWeekType: 'all',
  }
  const [filters, setFilters] = useState(initialFilters)

  useEffect(() => {
    // Fetch routes and daterange from dataset
    const fetchDatasetInfo = async () => {
      try {
        const response = await fetch(
          `/api/dataset-info/?dataset=${encodeURIComponent(dataset)}`,
        )

        if (response.ok) {
          const { routes, ridershipDateRange } = await response.json()
          setRoutes(routes)
          setRidershipDateRange(ridershipDateRange)

          const datasetDateRange =
            ridershipDateRange.length > 0
              ? [
                  DateTime.fromFormat(
                    ridershipDateRange[0].toString(),
                    'yyyyMMdd',
                  ).toJSDate(),
                  DateTime.fromFormat(
                    ridershipDateRange[1].toString(),
                    'yyyyMMdd',
                  ).toJSDate(),
                ]
              : [
                  DateTime.now().minus({ months: 3 }).toJSDate(),
                  DateTime.now().minus({ days: 1 }).toJSDate(),
                ]
          setFilters({ ...initialFilters, dateRange: datasetDateRange })
          clearVisualization()
        } else {
          throw new Error('Bad request')
        }
        setLoading(false)
      } catch (error) {
        console.warn(error)
        setLoading(false)
      }
    }

    if (dataset !== '') {
      setLoading(true)
      fetchDatasetInfo()
    }
  }, [dataset])

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await fetch(
          `/api/stops?route_id=${filters.routeId}&direction_id=${filters.directionId}&dataset=${encodeURIComponent(dataset)}`,
        )

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

    if (filters.routeId !== 'all' && filters.directionId !== 'all') {
      fetchStops()
    }
  }, [filters])

  const getDirectionOptions = () => {
    const route = routes.find((route) => route.route_id === filters.routeId)

    if (!route) {
      return null
    }

    const directionOptions = []

    if (route.directions.length > 1) {
      directionOptions.push(
        <option value="all" key="all">
          Both
        </option>,
      )
    }

    for (const direction of route.directions) {
      directionOptions.push(
        <option
          value={direction.direction_id.toString()}
          key={direction.direction_id}
        >
          {formatDirectionName(direction)}
        </option>,
      )
    }

    return directionOptions
  }

  return (
    <>
      <label className="block">
        <span className="text-gray-700">Dataset</span>
        <select
          value={dataset}
          onChange={(event) => setDataset(event.target.value)}
        >
          <option>Select a dataset</option>
          {config.databases.map((database, index) => (
            <option value={database.sqlitePath} key={index}>
              {database.startDate} - {database.endDate}
            </option>
          ))}
        </select>
      </label>
      {loading && <Loading loading={loading} />}
      {dataset !== '' && filters.dateRange && (
        <>
          <div className="flex">
            <label className="block">
              <span className="text-gray-700">Start Date</span>

              <div className="mt-1 block">
                <DatePicker
                  value={filters.dateRange[0]}
                  onChange={(date) => {
                    const dateRange = [date, filters.dateRange[1]]
                    setFilters({ ...filters, dateRange })
                  }}
                  className="w-full border-r-0"
                  clearIcon={null}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-gray-700">End Date</span>

              <div className="mt-1 block">
                <DatePicker
                  value={filters.dateRange[1]}
                  onChange={(date) => {
                    const dateRange = [filters.dateRange[0], date]
                    setFilters({ ...filters, dateRange })
                  }}
                  className="w-full"
                  maxDate={DateTime.now().toJSDate()}
                  clearIcon={null}
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-gray-700">Group By</span>
            <select
              className="mt-1 block w-full"
              onChange={(event) => {
                const newFilters = { ...filters, grouping: event.target.value }

                if (event.target.value === 'route') {
                  newFilters.routeId = 'all'
                  newFilters.directionId = 'all'
                  newFilters.stopId = 'all'
                } else if (event.target.value === 'stop') {
                  newFilters.stopId = 'all'
                } else if (event.target.value === 'day-of-week') {
                  newFilters.dayOfWeekType = 'all'
                } else if (event.target.value === 'day-of-week-type') {
                  newFilters.dayOfWeekType = 'all'
                }

                setFilters(newFilters)
              }}
              value={filters.grouping}
            >
              <option value="route">Route</option>
              <option value="day">Day</option>
              <option value="day-of-week">Day of week</option>
              <option value="day-of-week-type">Weekday vs Sat vs Sun</option>
              <option value="time-of-day">Time of day</option>
              <option value="trip">Trip</option>
              <option value="stop">Stop</option>
              <option value="none">None</option>
            </select>
          </label>

          {filters.grouping === 'time-of-day' && (
            <label className="block">
              <span className="text-gray-700">Time Bucket Size</span>
              <select
                className="mt-1 block w-full"
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    timeBucketSize: event.target.value,
                  })
                }
                value={filters.timeBucketSize}
              >
                <option value="120">2 hours</option>
                <option value="60">1 hour</option>
                <option value="30">30 minutes</option>
                <option value="15">15 minutes</option>
                <option value="10">10 minutes</option>
                <option value="5">5 minutes</option>
              </select>
            </label>
          )}

          {filters.grouping !== 'route' && (
            <label className="block">
              <span className="text-gray-700">Route</span>
              <select
                className="mt-1 block w-full"
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    routeId: event.target.value,
                    routeName:
                      event.target.value !== 'all'
                        ? event.nativeEvent.target[
                            event.nativeEvent.target.selectedIndex
                          ].text
                        : '',
                    directionId: 'all',
                    stopId: 'all',
                  })
                }
                value={filters.routeId}
              >
                <option value="all">All</option>
                {routes &&
                  routes.map((route) => (
                    <option key={route.route_id} value={route.route_id}>
                      {formatRouteName(route)}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {filters.grouping !== 'route' && filters.routeId !== 'all' && (
            <label className="block">
              <span className="text-gray-700">Direction</span>
              <select
                className="mt-1 block w-full"
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    directionId: event.target.value,
                    directionName:
                      event.target.value !== 'all'
                        ? event.nativeEvent.target[
                            event.nativeEvent.target.selectedIndex
                          ].text
                        : '',
                    stopId: 'all',
                    stopName: '',
                  })
                }
                value={filters.directionId}
              >
                {getDirectionOptions()}
              </select>
            </label>
          )}

          {filters.directionId !== 'all' && filters.grouping !== 'stop' && (
            <label className="block">
              <span className="text-gray-700">Stop</span>
              <select
                className="mt-1 block w-full"
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    stopId: event.target.value,
                    stopName:
                      event.target.value !== 'all'
                        ? stops.find(
                            (stop) => stop.stop_id === event.target.value,
                          ).stop_name
                        : '',
                  })
                }
                value={filters.stopId}
              >
                <option value="all">All</option>
                {stops &&
                  stops.map((stop) => (
                    <option key={stop.stop_id} value={stop.stop_id}>
                      {stop.stop_name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {filters.grouping !== 'day-of-week' &&
            filters.grouping !== 'day-of-week-type' && (
              <label className="block">
                <span className="text-gray-700">Day of Week Type</span>
                <select
                  className="mt-1 block w-full"
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      dayOfWeekType: event.target.value,
                    })
                  }
                  value={filters.dayOfWeekType}
                >
                  <option value="all">All</option>
                  <option value="Weekday">Weekday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </label>
            )}

          <button
            className="btn-blue mt-3"
            onClick={() => visualize(dataset, filters)}
          >
            📈 Visualize
          </button>
        </>
      )}
    </>
  )
}

export default Filters
