import React from 'react'
import { Bar } from 'react-chartjs-2'

const RidershipByDayOfWeekType = ({ ridershipData }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const data = {
    labels: ridershipData.map(item => item.label),
    datasets: [{
      label: 'Boardings',
      backgroundColor: 'rgb(75, 192, 192)',
      data: ridershipData.map(item => item.boardings),
    }, {
      label: 'Alightings',
      backgroundColor: 'rgb(255, 99, 132)',
      data: ridershipData.map(item => item.alightings)
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
          labelString: 'Day of Week Type'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Riders'
        }
      }]
    }
  }

  return <Bar data={data} options={options} />
}

export default RidershipByDayOfWeekType