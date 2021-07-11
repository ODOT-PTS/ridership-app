import { Line } from 'react-chartjs-2'

import { formatAlightingLabel, formatBoardingLabel, formatYAxisLabel } from '../lib/formatters.js'
import { getBoardingFieldName, getAlightingFieldName } from '../lib/utils.js'

const RidershipByDay = ({ ridershipData, type }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const boardingField = getBoardingFieldName(type)
  const alightingField = getAlightingFieldName(type)

  const data = {
    labels: ridershipData.map(item => item.label),
    datasets: [{
      label: formatBoardingLabel(type),
      backgroundColor: 'rgb(75, 192, 192)',
      borderColor: 'rgb(75, 192, 192)',
      data: ridershipData.map(item => item[boardingField]),
      lineTension: 0,
      fill: false
    }, {
      label: formatAlightingLabel(type),
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: ridershipData.map(item => item[alightingField]),
      lineTension: 0,
      fill: false
    }]
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