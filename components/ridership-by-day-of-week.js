import React from 'react'
import { Line } from 'react-chartjs-2'
import { DateTime } from 'luxon'

const RidershipByDayOfWeek = ({ ridershipData }) => {
  if (!ridershipData || ridershipData.length === 0) {
    return (
      <div>No data</div>
    )
  }

  const data = {
    labels: [],
    datasets: [{
      label: 'Boardings',
      backgroundColor: 'rgb(75, 192, 192)',
      borderColor: 'rgb(75, 192, 192)',
      data: [],
      lineTension: 0,
      fill: false
    }, {
      label: 'Alightings',
      fill: false,
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: [],
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
          labelString: 'Day of Week'
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

  data.labels = ridershipData.map(item => item.label);
  data.datasets[0].data = ridershipData.map(item => item.boardings);
  data.datasets[1].data = ridershipData.map(item => item.alightings);

  return <Line data={data} options={options} />
}

export default RidershipByDayOfWeek