import { useState, useEffect } from 'react'
import Head from 'next/head'
import { DateTime } from 'luxon'

import styles from '../styles/Home.module.css'

import {
  queryAgencies,
  queryRidershipDateRange,
  queryRoutesAndDirections,
} from '../lib/api.js'

import { formatAgencyName } from '../lib/formatters.js'

import Filters from '../components/filters.js'
import Loading from '../components/loading.js'
import Results from '../components/results.js'
import Footer from '../components/footer'

export default function Home({ agencies, routes, ridershipDateRange }) {
  const [appliedFilters, setAppliedFilters] = useState()
  const [ridershipData, setRidershipData] = useState()
  const [loading, setLoading] = useState(false)

  const validationError = (message) => {
    alert(message)
    setLoading(false)
  }

  const visualize = async (filters) => {
    setRidershipData()
    setLoading(true)

    // Validation
    if (filters.dateRange[0] === null) {
      return validationError('Start Date is required')
    }

    if (filters.dateRange[1] === null) {
      return validationError('End Date is required')
    }

    try {
      const parameters = {
        start_date: DateTime.fromJSDate(filters.dateRange[0]).toISODate(),
        end_date: DateTime.fromJSDate(filters.dateRange[1]).toISODate(),
        route_id: filters.routeId,
        direction_id: filters.directionId,
        stop_id: filters.stopId,
        grouping: filters.grouping,
        time_bucket_size: filters.timeBucketSize,
      }

      const response = await fetch(
        `/api/ridership-data?${new URLSearchParams(parameters)}`
      )

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
        <title>{`${formatAgencyName(agencies)} Ridership Visualization`}</title>
        <meta name="description" content="Ridership App for GTFS-Ride data" />
      </Head>

      <main className="container mx-auto justify-center mb-5">
        <div className="flex">
          <div className="self-start flex-shrink-0 grid grid-cols-1 gap-2 w-72 px-3">
            <h1 className={styles.title}>
              {formatAgencyName(agencies)} Ridership
            </h1>
            <Filters
              visualize={visualize}
              routes={routes}
              ridershipDateRange={ridershipDateRange}
            />
          </div>
          <div className="ml-5 mt-2" style={{ width: 'calc(100% - 320px)' }}>
            <Loading loading={loading} />
            <Results ridershipData={ridershipData} filters={appliedFilters} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export function getServerSideProps() {
  const agencies = queryAgencies()
  const routes = queryRoutesAndDirections()
  const ridershipDateRange = queryRidershipDateRange()

  return {
    props: {
      agencies,
      routes,
      ridershipDateRange,
    },
  }
}
