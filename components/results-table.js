import { CSVLink } from 'react-csv'
import { Grid, _ } from 'gridjs-react'
import 'gridjs/dist/theme/mermaid.css'
import { DateTime } from 'luxon'

const ResultsTable = ({ ridershipData, filters }) => {
  if (!ridershipData || ridershipData.length === 0 || !filters) {
    return null
  }

  const columns = [
    {
      id: 'label',
      name: 'Label'
    },
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

  const startDateFormatted = DateTime.fromJSDate(filters.dateRange[0]).toISODate()
  const endDateFormatted = DateTime.fromJSDate(filters.dateRange[1]).toISODate()
  const filename = `ridership_data_${startDateFormatted}_to_${endDateFormatted}.csv`

  return (
    <>
      <div className="mt-5">
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