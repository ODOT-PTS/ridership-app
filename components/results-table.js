import { CSVLink } from 'react-csv'
import { Grid, _ } from 'gridjs-react'
import 'gridjs/dist/theme/mermaid.css'
import { DateTime } from 'luxon'

const getColumns = filters => {
  const dataColumns = [
    {
      id: 'boardings',
      name: 'Boardings'
    },
    {
      id: 'alightings',
      name: 'Alightings'
    },
    {
      id: 'load_count',
      name: 'Load Count'
    }
  ]

  if (filters.grouping === 'day') {
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