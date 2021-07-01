import { useState, useEffect } from 'react'
import Head from 'next/head'
import DatePicker from 'react-datepicker'
import { DateTime } from 'luxon'

import 'react-datepicker/dist/react-datepicker.css'
import styles from '../styles/Home.module.css'

import RidershipByDay from '../components/ridership-by-day.js'
import RidershipByDayOfWeek from '../components/ridership-by-day-of-week.js'
import RidershipByDayOfWeekType from '../components/ridership-by-day-of-week-type.js'
import RidershipByTimeOfDay from '../components/ridership-by-time-of-day.js'
import { formatRouteName } from '../lib/formatters.js'

export default function Home() {
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [grouping, setGrouping] = useState('day')
  const [routeId, setRouteId] = useState('all')
  const [directionId, setDirectionId] = useState('all')
  const [routes, setRoutes] = useState()
  const [ridershipData, setRidershipData] = useState()

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
        startDate: DateTime.fromJSDate(startDate).toISODate(),
        endDate: DateTime.fromJSDate(endDate).toISODate(),
        route_id: routeId,
        direction_id: directionId
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

  const formatChartTitle = () => {
    const dateRangeText = `${DateTime.fromJSDate(startDate).toISODate()} to ${DateTime.fromJSDate(endDate).toISODate()}`

    let routeText = ''
    if (routeId !== 'all') {
      const route = routes.find(route => route.route_id === routeId)
      routeText = `for Route ${formatRouteName(route)}`
    }
    
    if (grouping === 'day') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Day</h2>
          {dateRangeText} {routeText}
        </>
      )
    } else if (grouping === 'day-of-week') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Day of Week</h2>
          {dateRangeText} {routeText}
        </>
      )
    } else if (grouping === 'day-of-week-type') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Weekday vs Weekend</h2>
          {dateRangeText} {routeText}
        </>
      )
    } else if (grouping === 'time-of-day') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Time of Day</h2>
          {dateRangeText} {routeText}
        </>
      )
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
                    setDateRange(update);
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
                onChange={event => setRouteId(event.target.value)}
              >
                <option value="all">All</option>
                {routes && routes.map(route => <option key={route.route_id} value={route.route_id}>{formatRouteName(route)}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-gray-700">Direction</span>
              <select
                className="mt-1 block w-full"
                onChange={event => setDirectionId(event.target.value)}
                value={directionId}
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
            {ridershipData && formatChartTitle()}
            {ridershipData && grouping === 'day' && <RidershipByDay ridershipData={ridershipData} />}
            {ridershipData && grouping === 'day-of-week' && <RidershipByDayOfWeek ridershipData={ridershipData} />}
            {ridershipData && grouping === 'day-of-week-type' && <RidershipByDayOfWeekType ridershipData={ridershipData} />}
            {ridershipData && grouping === 'time-of-day' && <RidershipByTimeOfDay ridershipData={ridershipData} />}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        
      </footer>
    </div>
  )
}