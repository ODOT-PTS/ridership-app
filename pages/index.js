import { useState, useEffect } from 'react'
import Head from 'next/head'
import DatePicker from 'react-datepicker'
import { DateTime } from 'luxon'

import 'react-datepicker/dist/react-datepicker.css'
import styles from '../styles/Home.module.css'

import Results from '../components/results.js'
import { formatRouteName } from '../lib/formatters.js'

export default function Home() {
  const [filters, setFilters] = useState({
    dateRange: [null, null],
    routeId: 'all',
    directionId: 'all'
  })
  const [grouping, setGrouping] = useState('day')
  const [routes, setRoutes] = useState()
  const [ridershipData, setRidershipData] = useState()

  const [startDate, endDate] = filters.dateRange

  useEffect(async () => {
    try {
      const response = await fetch('/routes')
  
      if (response.ok) {
        const data = await response.json()
        setRoutes(data)
      } else {
        throw new Error('Bad request')
      }
    } catch (error) {
      console.warn(error)
    }
  }, [])

  const visualize = async () => {
    // Validation
    if (startDate === null || endDate === null) {
      alert('Date range is required')
      return
    }

    try {
      const parameters = {
        start_date: DateTime.fromJSDate(startDate).toISODate(),
        end_date: DateTime.fromJSDate(endDate).toISODate(),
        route_id: filters.routeId,
        direction_id: filters.directionId
      };

      const response = await fetch('/ridership-data?' + new URLSearchParams(parameters))

      if (response.ok) {
        const results = await response.json()
        setRidershipData(results)
      }

    } catch (error) {
      console.warn(error)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Ridership App</title>
        <meta name="description" content="Ridership App for GTFS-Ride data" />
      </Head>

      <main className="container mx-auto justify-center mb-5">
        <div className="flex">
          <div className="self-start flex-shrink-0 grid grid-cols-1 gap-2 w-60">
            <h1 className={styles.title}>
              Ridership Data Visualization
            </h1>
            <label className="block">
              <span className="text-gray-700">Date Range</span>

              <div className="mt-1 block w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
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
                onChange={event => setGrouping(event.target.value)}
              >
                <option value="day">Day</option>
                <option value="day-of-week">Day of week</option>
                <option value="day-of-week-type">(Weekday vs Sat vs Sun)</option>
                <option value="time-of-day">Time of day</option>
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Route</span>
              <select
                className="mt-1 block w-full"
                onChange={event => setFilters({ ...filters, routeId: event.target.value })}
              >
                <option value="all">All</option>
                {routes && routes.map(route => <option key={route.route_id} value={route.route_id}>{formatRouteName(route)}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Direction</span>
              <select
                className="mt-1 block w-full"
                onChange={event => setFilters({ ...filters, directionId: event.target.value })}
                value={filters.directionId}
              >
                <option value="all">Both</option>
                <option value="0">0</option>
                <option value="1">1</option>
              </select>
            </label>

            <button
              className="bg-blue-700 px-5 py-3 text-sm shadow-sm font-medium tracking-wider border text-blue-100 rounded-full hover:shadow-lg hover:bg-blue-800"
              onClick={() => visualize()}
            >Visualize</button>
          </div>
          <div className="flex-grow-1 w-full ml-5 mt-2">
            <Results ridershipData={ridershipData} filters={filters} grouping={grouping} routes={routes} />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        
      </footer>
    </div>
  )
}