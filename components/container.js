'use client'

import { useState } from 'react'
import { DateTime } from 'luxon'

import { formatAgencyName } from '../lib/formatters.js'

import Filters from '../components/filters.js'
import Loading from '../components/loading.js'
import Results from '../components/results.js'

const Container = ({ agencies }) => {
  const [appliedFilters, setAppliedFilters] = useState()
  const [ridershipData, setRidershipData] = useState()
  const [loading, setLoading] = useState(false)

  const validationError = (message) => {
    alert(message)
    setLoading(false)
  }

  const visualize = async (dataset, filters) => {
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
        dataset,
        start_date: DateTime.fromJSDate(filters.dateRange[0]).toISODate(),
        end_date: DateTime.fromJSDate(filters.dateRange[1]).toISODate(),
        route_id: filters.routeId,
        direction_id: filters.directionId,
        stop_id: filters.stopId,
        grouping: filters.grouping,
        day_of_week_type: filters.dayOfWeekType,
        time_bucket_size: filters.timeBucketSize,
      }

      const response = await fetch(
        `/api/ridership-data?${new URLSearchParams(parameters)}`,
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

  const clearVisualization = () => {
    setRidershipData()
    setAppliedFilters()
  }

  return (
    <div className="flex">
      <div className="self-start flex-shrink-0 grid grid-cols-1 gap-2 w-72 px-3">
        <h1 className="text-2xl mt-3">
          {formatAgencyName(agencies)} Ridership
        </h1>
        <Filters
          visualize={visualize}
          clearVisualization={clearVisualization}
        />
      </div>
      <div className="ml-5 mt-2" style={{ width: 'calc(100% - 320px)' }}>
        <Loading loading={loading} />
        <Results ridershipData={ridershipData} filters={appliedFilters} />
      </div>
    </div>
  )
}

export default Container
