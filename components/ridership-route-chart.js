import {
  Chart as ChartJS,
  CategoryScale,
  BarElement,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Line } from 'react-chartjs-2'
ChartJS.register(
  CategoryScale,
  BarElement,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

import { formatYAxisLabel } from '../lib/formatters.js'
import {
  chartColors,
  getBoardingFieldName,
  getAlightingFieldName,
  haversineDistanceMeters,
  metersToMiles,
} from '../lib/utils.js'

const RidershipRouteChart = ({ ridershipData, type, filters }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  if (filters.directionId === 'all') {
    return null
  }

  const boardingField = getBoardingFieldName(type)
  const alightingField = getAlightingFieldName(type)

  let cumulativeDistance = 0
  const distances = ridershipData.map((item, index) => {
    if (index === 0) {
      return 0
    }

    const distance = haversineDistanceMeters(
      item.stop_lat,
      item.stop_lon,
      ridershipData[index - 1].stop_lat,
      ridershipData[index - 1].stop_lon,
    )

    cumulativeDistance += distance

    return metersToMiles(cumulativeDistance)
  })

  let cumulativePassengers = 0
  const passengers = ridershipData.map((item) => {
    cumulativePassengers += item[boardingField] - item[alightingField]

    return cumulativePassengers
  })

  const data = {
    labels: distances,
    datasets: [
      {
        label: 'Passengers on Board',
        backgroundColor: chartColors.boarding,
        borderColor: chartColors.boarding,
        data: passengers,
        yAxisID: 'yAxis',
      },
    ],
  }

  const options = {
    responsive: true,
    layout: {
      padding: {
        bottom: 150,
      },
    },
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
        display: false,
        type: 'linear',
        scaleLabel: {
          display: true,
          labelString: 'Distance (miles)',
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
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = ridershipData[context.dataIndex]

            return [
              `Cumulative: ${context.formattedValue}`,
              `Boardings: ${item[boardingField]}`,
              `Alightings: ${item[alightingField]}`,
            ]
          },
          title: (context) => {
            const item = ridershipData[context[0].dataIndex]
            return item.label
          },
        },
      },
      datalabels: {
        formatter: function (value, context) {
          const item = ridershipData[context.dataIndex]
          return item.label
        },
        rotation: 90,
        align: 'bottom',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        offset: 10,
        clamp: true,
      },
    },
  }

  return (
    <Line
      data={data}
      plugins={[ChartDataLabels]}
      options={options}
      className="mt-10"
    />
  )
}

export default RidershipRouteChart
