import { DateTime } from 'luxon'

import RidershipByDay from './ridership-by-day.js'
import RidershipByDayOfWeek from './ridership-by-day-of-week.js'
import RidershipByDayOfWeekType from './ridership-by-day-of-week-type.js'
import RidershipByTimeOfDay from './ridership-by-time-of-day.js'

import { formatRouteName } from '../lib/formatters.js'

const Results = ({ ridershipData, filters, routes }) => {
  if (!ridershipData || !filters) {
    return null
  }

  const [startDate, endDate] = filters.dateRange

  const formatChartTitle = () => {
    const dateRangeText = `${DateTime.fromJSDate(startDate).toISODate()} to ${DateTime.fromJSDate(endDate).toISODate()}`

    let routeText = ''
    if (filters.routeId !== 'all') {
      const route = routes.find(route => route.route_id === filters.routeId)
      routeText = `for Route ${formatRouteName(route)}`
    }
    
    if (filters.grouping === 'day') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Day</h2>
          {dateRangeText} {routeText}
        </>
      )
    } else if (filters.grouping === 'day-of-week') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Day of Week</h2>
          {dateRangeText} {routeText}
        </>
      )
    } else if (filters.grouping === 'day-of-week-type') {
      return (
        <>
          <h2 className="inline-block text-2xl mr-2 font-bold">Ridership by Weekday vs Weekend</h2>
          {dateRangeText} {routeText}
        </>
      )
    } else if (filters.grouping === 'time-of-day') {
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
      {formatChartTitle()}
      {filters.grouping === 'day' && <RidershipByDay ridershipData={ridershipData} startDate={startDate} endDate={endDate} />}
      {filters.grouping === 'day-of-week' && <RidershipByDayOfWeek ridershipData={ridershipData} />}
      {filters.grouping === 'day-of-week-type' && <RidershipByDayOfWeekType ridershipData={ridershipData} />}
      {filters.grouping === 'time-of-day' && <RidershipByTimeOfDay ridershipData={ridershipData} />}
    </>
  )
}

export default Results