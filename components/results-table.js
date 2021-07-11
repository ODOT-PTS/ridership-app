import { CSVLink } from 'react-csv'
import { Grid, _ } from 'gridjs-react'
import 'gridjs/dist/theme/mermaid.css'
import { DateTime } from 'luxon'

import { formatNumber } from '../lib/formatters.js'

const getColumns = filters => {
  const dataColumns = [
    {
      id: 'boardings',
      name: 'Boardings',
      formatter: formatNumber
    },
    {
      id: 'alightings',
      name: 'Alightings',
      formatter: formatNumber
    },
    {
      id: 'load_count',
      name: 'Load Count',
      formatter: formatNumber
    }
  ]

  if (filters.grouping === 'route') {
    return [
      {
        id: 'label',
        name: 'Route'
      },
      ...dataColumns
    ]
  } else if (filters.grouping === 'day') {
    return [
      {
        id: 'label',
        name: 'Date'
      },
      ...dataColumns
    ]
  } else if (filters.grouping === 'day-of-week') {
    return [
      {
        id: 'label',
        name: 'Day of Week'
      },
      ...dataColumns
    ]
  } else if (filters.grouping === 'day-of-week-type') {
    return [
      {
        id: 'label',
        name: 'Day of Week Type'
      },
      ...dataColumns
    ]
  } else if (filters.grouping === 'time-of-day') {
    return [
      {
        id: 'label',
        name: 'Time Range'
      },
      ...dataColumns
    ]
  }  else if (filters.grouping === 'trip') {
    return [
      {
        id: 'label',
        name: 'Trip'
      },
      ...dataColumns
    ]
  } else if (filters.grouping === 'stop') {
    return [
      {
        id: 'label',
        name: 'Stop Name'
      },
      {
        id: 'stop_id',
        name: 'Stop ID'
      },
      ...dataColumns
    ]
  } else if (filters.grouping === 'none') {
    return [
      {
        id: 'service_date',
        name: 'Service Date'
      },
      {
        id: 'service_departure_time',
        name: 'Service Departure Time'
      },
      {
        id: 'service_arrival_time',
        name: 'Service Arrival Time'
      },
      {
        id: 'trip_id',
        name: 'Trip ID'
      },
      {
        id: 'stop_id',
        name: 'Stop ID'
      },
      {
        id: 'stop_sequence',
        name: 'Stop Sequence'
      },
      {
        id: 'record_use',
        name: 'Record Use'
      },
      {
        id: 'schedule_relationship',
        name: 'Schedule Relationship'
      },
      {
        id: 'boardings',
        name: 'Boardings',
        formatter: formatNumber
      },
      {
        id: 'alightings',
        name: 'Alightings',
        formatter: formatNumber
      },
      {
        id: 'current_load',
        name: 'Current Load',
        formatter: formatNumber
      },
      {
        id: 'load_count',
        name: 'Load Count',
        formatter: formatNumber
      },
      {
        id: 'load_type',
        name: 'Load Type'
      },
      {
        id: 'rack_down',
        name: 'Rack Down'
      },
      {
        id: 'bike_boardings',
        name: 'Bike Boardings',
        formatter: formatNumber
      },
      {
        id: 'bike_alightings',
        name: 'Bike Alightings',
        formatter: formatNumber
      },
      {
        id: 'ramp_used',
        name: 'Ramp Used'
      },
      {
        id: 'ramp_boardings',
        name: 'Ramp Boadings',
        formatter: formatNumber
      },
      {
        id: 'ramp_alightings',
        name: 'Ramp Alightings',
        formatter: formatNumber
      },
      {
        id: 'source',
        name: 'Source'
      }
    ]
  }
}

const ResultsTable = ({ ridershipData, filters }) => {
  if (!ridershipData || ridershipData.length === 0 || !filters) {
    return null
  }

  const columns = getColumns(filters)
  const startDateFormatted = DateTime.fromJSDate(filters.dateRange[0]).toISODate()
  const endDateFormatted = DateTime.fromJSDate(filters.dateRange[1]).toISODate()
  const filename = `ridership_data_${startDateFormatted}_to_${endDateFormatted}.csv`

  return (
    <>
      <div className="mt-10">
        <Grid
          columns={columns}
          data={ridershipData}
          pagination={{
            enabled: true,
            limit: 100,
          }}
          height='500px'
          fixedHeader={true}
          style={{
            th: {
              padding: '8px 10px'
            },
            td: {
              padding: '5px 10px'
            }
          }}
        />
      </div>
      
      <CSVLink
        data={ridershipData}
        headers={columns.map(column => ({ label: column.name, key: column.id }))}
        filename={filename}
        className="btn-blue my-2 inline-block"
      >⬇️ Download CSV</CSVLink>
    </>
  )
}

export default ResultsTable