import { useState } from 'react'
import { DateTime } from 'luxon'

import ResultsMap from './results-map.js'
import ResultsTable from './results-table.js'
import RidershipByDay from './ridership-by-day.js'
import RidershipByDayOfWeek from './ridership-by-day-of-week.js'
import RidershipByDayOfWeekType from './ridership-by-day-of-week-type.js'
import RidershipByRoute from './ridership-by-route.js'
import RidershipByTimeOfDay from './ridership-by-time-of-day.js'
import RidershipByTrip from './ridership-by-trip.js'
import RidershipByStop from './ridership-by-stop.js'
import RidershipRouteChart from './ridership-route-chart.js'
import ToggleMenu from './toggle-menu.js'

const Results = ({ ridershipData, filters }) => {
  const [type, setType] = useState('passengers')

  const formatChartTitle = () => {
    const dateRangeText = (
      <>
        <span className="highlight">
          {DateTime.fromJSDate(startDate).toISODate()}
        </span>{' '}
        to{' '}
        <span className="highlight">
          {DateTime.fromJSDate(endDate).toISODate()}
        </span>
      </>
    )

    let routeText = ''
    if (filters.routeId !== 'all') {
      routeText = (
        <>
          for <span className="highlight">Route {filters.routeName}</span>
        </>
      )
    }

    let directionText = ''
    if (filters.directionId !== 'all') {
      directionText = (
        <>
          in direction{' '}
          <span className="highlight"> {filters.directionName}</span>
        </>
      )
    }

    let stopText = ''
    if (filters.stopId !== 'all') {
      stopText = (
        <>
          for <span className="highlight">Stop {filters.stopName}</span>
        </>
      )
    }

    let title = ''
    if (filters.grouping === 'route') {
      title = 'Ridership by Route'
    } else if (filters.grouping === 'day') {
      title = 'Ridership by Day'
    } else if (filters.grouping === 'day-of-week') {
      title = 'Ridership by Day of Week'
    } else if (filters.grouping === 'day-of-week-type') {
      title = 'Ridership by Weekday vs Weekend'
    } else if (filters.grouping === 'time-of-day') {
      title = 'Ridership by Time of Day'
    } else if (filters.grouping === 'trip') {
      title = 'Ridership by Trip'
    } else if (filters.grouping === 'stop') {
      title = 'Ridership by Stop'
    } else if (filters.grouping === 'none') {
      title = 'Ridership'
    }

    return (
      <>
        <h2 className="inline-block text-2xl mr-2 font-bold">{title}</h2>
        {dateRangeText} {routeText} {directionText} {stopText}
      </>
    )
  }

  if (!ridershipData || !filters) {
    return null
  }

  const [startDate, endDate] = filters.dateRange

  return (
    <>
      {formatChartTitle()}
      {(!ridershipData || ridershipData.length === 0) && (
        <div className="text-center my-16">
          <div className="text-8xl">⚠️</div>
          <div className="font-bold text-2xl">No data</div>
        </div>
      )}
      {filters.grouping !== 'none' && (
        <ToggleMenu
          fieldOptions={[
            {
              value: 'passengers',
              label: 'Passengers',
            },
            {
              value: 'bikes',
              label: 'Bikes',
            },
            {
              value: 'ramp',
              label: 'Ramp Boardings',
            },
          ]}
          field={type}
          setField={setType}
        />
      )}
      {filters.grouping === 'route' && (
        <RidershipByRoute ridershipData={ridershipData} type={type} />
      )}
      {filters.grouping === 'day' && (
        <RidershipByDay ridershipData={ridershipData} type={type} />
      )}
      {filters.grouping === 'day-of-week' && (
        <RidershipByDayOfWeek ridershipData={ridershipData} type={type} />
      )}
      {filters.grouping === 'day-of-week-type' && (
        <RidershipByDayOfWeekType ridershipData={ridershipData} type={type} />
      )}
      {filters.grouping === 'time-of-day' && (
        <RidershipByTimeOfDay ridershipData={ridershipData} type={type} />
      )}
      {filters.grouping === 'trip' && (
        <RidershipByTrip ridershipData={ridershipData} type={type} />
      )}
      {filters.grouping === 'stop' && (
        <>
          <RidershipByStop ridershipData={ridershipData} type={type} />
          <RidershipRouteChart
            ridershipData={ridershipData}
            type={type}
            filters={filters}
          />
          <ResultsMap
            ridershipData={ridershipData}
            type={type}
            filters={filters}
          />
        </>
      )}
      <ResultsTable ridershipData={ridershipData} filters={filters} />
    </>
  )
}

export default Results
