import React from 'react'
import { Line } from 'react-chartjs-2'

const RidershipByStop = ({ ridershipData, startDate, endDate }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const data = {
    labels: ridershipData.map(item => item.label),
    datasets: [{
      label: 'Boardings',
      backgroundColor: 'rgb(75, 192, 192)',
      borderColor: 'rgb(75, 192, 192)',
      data: ridershipData.map(item => item.boardings),
      lineTension: 0,
      fill: false
    }, {
      label: 'Alightings',
      fill: false,
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: ridershipData.map(item => item.alightings),
      lineTension: 0
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
          labelString: 'Stop'
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

  return <Line data={data} options={options} />
}

export default RidershipByStop