import { Bar } from 'react-chartjs-2'

import { formatAlightingLabel, formatBoardingLabel, formatYAxisLabel } from '../lib/formatters.js'
import { chartColors, getBoardingFieldName, getAlightingFieldName } from '../lib/utils.js'

const RidershipByDayOfWeekType = ({ ridershipData, type }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const boardingField = getBoardingFieldName(type)
  const alightingField = getAlightingFieldName(type)

  const data = {
    labels: ridershipData.map(item => item.label),
    datasets: [{
      label: formatBoardingLabel(type),
      backgroundColor: chartColors.boarding,
      borderColor: chartColors.boarding,
      data: ridershipData.map(item => item[boardingField])
    }, {
      label: formatAlightingLabel(type),
      backgroundColor: chartColors.alighting,
      borderColor: chartColors.alighting,
      data: ridershipData.map(item => item[alightingField])
    }]
  }

  if (type === 'passengers' && ridershipData.some(item => item.load_type !== null)) {
    data.datasets.push({
      label: 'Average Load Count',
      backgroundColor: chartColors.load_count,
      borderColor: chartColors.load_count,
      data: ridershipData.map(item => item.average_load_count)
    })
  }
  
  const options = {
    responsive: true,
    title: {
      display: true,
      text: 'Ridership'
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Day of Week Type'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: formatYAxisLabel(type)
        }
      }]
    }
  }

  return <Bar data={data} options={options} />
}

export default RidershipByDayOfWeekType