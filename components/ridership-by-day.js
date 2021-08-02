import { Line } from 'react-chartjs-2'

import { formatAlightingLabel, formatBoardingLabel, formatYAxisLabel } from '../lib/formatters.js'
import { chartColors, getBoardingFieldName, getAlightingFieldName, getLoadCountFieldName } from '../lib/utils.js'

const RidershipByDay = ({ ridershipData, type }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const boardingField = getBoardingFieldName(type)
  const alightingField = getAlightingFieldName(type)
  const loadCountField = getLoadCountFieldName(type)

  const data = {
    labels: ridershipData.map(item => item.label),
    datasets: [{
      label: formatBoardingLabel(type),
      backgroundColor: chartColors.boarding,
      borderColor: chartColors.boarding,
      data: ridershipData.map(item => item[boardingField]),
      lineTension: 0,
      fill: false
    }, {
      label: formatAlightingLabel(type),
      backgroundColor: chartColors.alighting,
      borderColor: chartColors.alighting,
      data: ridershipData.map(item => item[alightingField]),
      lineTension: 0,
      fill: false
    }]
  }

  if (loadCountField !== null && ridershipData.some(item => item.load_type !== null)) {
    data.datasets.push({
      label: 'Load Count',
      backgroundColor: chartColors.load_count,
      borderColor: chartColors.load_count,
      data: ridershipData.map(item => item[loadCountField]),
      lineTension: 0,
      fill: false
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
          labelString: 'Date'
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

  return <Line data={data} options={options} />
}

export default RidershipByDay