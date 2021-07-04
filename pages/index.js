import { useState, useEffect } from 'react'
import Head from 'next/head'
import { DateTime } from 'luxon'

import styles from '../styles/Home.module.css'

import Filters from '../components/filters.js'
import Loading from '../components/loading.js'
import Results from '../components/results.js'

export default function Home() {
  const [filters, setFilters] = useState({
    dateRange: [null, null],
    routeId: 'all',
    directionId: 'all'
  })
  const [grouping, setGrouping] = useState('day')
  const [routes, setRoutes] = useState()
  const [ridershipData, setRidershipData] = useState()
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    // Validation
    if (filters.dateRange[0] === null || filters.dateRange[1] === null) {
      alert('Date range is required')
      setLoading(false)
      return
    }

    try {
      const parameters = {
        start_date: DateTime.fromJSDate(filters.dateRange[0]).toISODate(),
        end_date: DateTime.fromJSDate(filters.dateRange[1]).toISODate(),
        route_id: filters.routeId,
        direction_id: filters.directionId
      };

      const response = await fetch('/ridership-data?' + new URLSearchParams(parameters))

      if (response.ok) {
        const results = await response.json()
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
              filters={filters}
              setFilters={setFilters}
              setGrouping={setGrouping}
              routes={routes}
              visualize={visualize}
            />
          </div>
          <div className="flex-grow-1 w-full ml-5 mt-2">
            <Loading loading={loading} />
            <Results
              ridershipData={ridershipData}
              filters={filters}
              grouping={grouping}
              routes={routes}
            />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        
      </footer>
    </div>
  )
}