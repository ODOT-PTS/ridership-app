import { useState, useEffect } from 'react'
import Head from 'next/head'
import { DateTime } from 'luxon'

import styles from '../styles/Home.module.css'

import Filters from '../components/filters.js'
import Loading from '../components/loading.js'
import Results from '../components/results.js'

export default function Home() {
  const [appliedFilters, setAppliedFilters] = useState()
  const [ridershipData, setRidershipData] = useState()
  const [loading, setLoading] = useState(false)

  const validationError = message => {
    alert(message)
    setLoading(false)
  }

  const visualize = async (filters) => {
    setRidershipData()
    setLoading(true)

    // Validation
    if (filters.dateRange[0] === null || filters.dateRange[1] === null) {
      return validationError('Date range is required')
    }

    if (filters.grouping === 'stop') {
      if (filters.routeId === 'all') {
        return validationError('You must choose a specific route to analyze by stop')
      }

      if (filters.directionId === 'all') {
        return validationError('You must choose a specific direction to analyze by stop')
      }
    }

    try {
      const parameters = {
        start_date: DateTime.fromJSDate(filters.dateRange[0]).toISODate(),
        end_date: DateTime.fromJSDate(filters.dateRange[1]).toISODate(),
        route_id: filters.routeId,
        direction_id: filters.directionId,
        stop_id: filters.stopId,
        grouping: filters.grouping
      };

      const response = await fetch('/ridership-data?' + new URLSearchParams(parameters))

      if (response.ok) {
        const results = await response.json()
        setAppliedFilters(filters)
        setRidershipData(results)
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
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
            <Filters
              visualize={visualize}
            />
          </div>
          <div className="flex-grow-1 w-full ml-5 mt-2">
            <Loading loading={loading} />
            <Results
              ridershipData={ridershipData}
              filters={appliedFilters}
            />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        
      </footer>
    </div>
  )
}