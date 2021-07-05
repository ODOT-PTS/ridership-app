import { DateTime } from 'luxon'

import RidershipByDay from './ridership-by-day.js'
import RidershipByDayOfWeek from './ridership-by-day-of-week.js'
import RidershipByDayOfWeekType from './ridership-by-day-of-week-type.js'
import RidershipByTimeOfDay from './ridership-by-time-of-day.js'

const Results = ({ ridershipData, filters }) => {
  if (!ridershipData || !filters) {
    return null
  }

  const [startDate, endDate] = filters.dateRange

  const formatChartTitle = () => {
    const dateRangeText =<><span className="highlight">{DateTime.fromJSDate(startDate).toISODate()}</span> to <span className="highlight">{DateTime.fromJSDate(endDate).toISODate()}</span></>

    let routeText = ''
    if (filters.routeId !== 'all') {
      routeText = <>for <span className="highlight">Route {filters.routeName}</span></>
    }

    let stopText = ''
    if (filters.stopId !== 'all') {
      stopText = <>for <span className="highlight">Stop {filters.stopName}</span></>
    }

    let title = ''
    if (filters.grouping === 'day') {
      title = 'Ridership by Day'
    } else if (filters.grouping === 'day-of-week') {
      title = 'Ridership by Day of Week'
    } else if (filters.grouping === 'day-of-week-type') {
      title = 'Ridership by Weekday vs Weekend'
    } else if (filters.grouping === 'time-of-day') {
      title = 'Ridership by Time of Day'
    }

    return (
      <>
        <h2 className="inline-block text-2xl mr-2 font-bold">{title}</h2>
        {dateRangeText} {routeText} {stopText}
      </>
    )
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