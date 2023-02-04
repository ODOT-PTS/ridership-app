import {
  Chart as ChartJS,
  CategoryScale,
  BarElement,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
ChartJS.register(
  CategoryScale,
  BarElement,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
)

import {
  formatAlightingLabel,
  formatBoardingLabel,
  formatYAxisLabel,
} from '../lib/formatters.js'
import {
  chartColors,
  getBoardingFieldName,
  getAlightingFieldName,
} from '../lib/utils.js'

const RidershipByDay = ({ ridershipData, type }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const boardingField = getBoardingFieldName(type)
  const alightingField = getAlightingFieldName(type)

  const data = {
    labels: ridershipData.map((item) => item.label),
    datasets: [
      {
        label: formatBoardingLabel(type),
        backgroundColor: chartColors.boarding,
        borderColor: chartColors.boarding,
        data: ridershipData.map((item) => item[boardingField]),
        lineTension: 0,
        fill: false,
        yAxisID: 'yAxis',
      },
      {
        label: formatAlightingLabel(type),
        backgroundColor: chartColors.alighting,
        borderColor: chartColors.alighting,
        data: ridershipData.map((item) => item[alightingField]),
        lineTension: 0,
        fill: false,
        yAxisID: 'yAxis',
      },
    ],
  }

  if (
    type === 'passengers' &&
    ridershipData.some((item) => item.load_type !== null)
  ) {
    data.datasets.push({
      label: 'Average Load Count',
      backgroundColor: chartColors.load_count,
      borderColor: chartColors.load_count,
      data: ridershipData.map((item) => item.average_load_count),
      lineTension: 0,
      fill: false,
      yAxisID: 'yAxis',
    })
  }

  const options = {
    responsive: true,
    title: {
      display: true,
      text: 'Ridership',
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Date',
        },
      },
      yAxis: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: formatYAxisLabel(type),
        },
      },
    },
  }

  return <Line data={data} options={options} />
}

export default RidershipByDay
