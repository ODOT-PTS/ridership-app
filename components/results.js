import { DateTime } from 'luxon'

import RidershipByDay from './ridership-by-day.js'
import RidershipByDayOfWeek from './ridership-by-day-of-week.js'
import RidershipByDayOfWeekType from './ridership-by-day-of-week-type.js'
import RidershipByTimeOfDay from './ridership-by-time-of-day.js'

import { formatRouteName } from '../lib/formatters.js'

const Results = ({ ridershipData, filters, grouping, routes }) => {
  const [startDate, endDate] = filters.dateRange

  const formatChartTitle = () => {
    const dateRangeText = `${DateTime.fromJSDate(startDate).toISODate()} to ${DateTime.fromJSDate(endDate).toISODate()}`

    let routeText = ''
    if (filters.routeId !== 'all') {
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
    <>
      {ridershipData && formatChartTitle()}
      {ridershipData && grouping === 'day' && <RidershipByDay ridershipData={ridershipData} />}
      {ridershipData && grouping === 'day-of-week' && <RidershipByDayOfWeek ridershipData={ridershipData} />}
      {ridershipData && grouping === 'day-of-week-type' && <RidershipByDayOfWeekType ridershipData={ridershipData} />}
      {ridershipData && grouping === 'time-of-day' && <RidershipByTimeOfDay ridershipData={ridershipData} />}
    </>
  )
}

export default Results