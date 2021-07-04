import React from 'react'
import { Line } from 'react-chartjs-2'
import { DateTime } from 'luxon'
import { sortBy } from 'lodash'

const RidershipByTimeOfDay = ({ ridershipData }) => {
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
          labelString: 'Time of Day'
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

  const classifyTimeOfDay = time => {

  }

  const dataPoints = [];

  for (const boardAlight of ridershipData) {
    let dataPoint = dataPoints.find(item => item.service_date === boardAlight.service_date);

    if (!dataPoint) {
      dataPoint = {
        label: DateTime.fromFormat(boardAlight.service_date.toString(), 'yyyyMMdd').toISODate(),
        service_date: boardAlight.service_date,
        boardings: 0,
        alightings: 0,
        load_count: 0
      };
      dataPoints.push(dataPoint);
    }

    if (boardAlight.boardings !== null) {
      dataPoint.boardings += boardAlight.boardings;
    }

    if (boardAlight.alightings !== null) {
      dataPoint.alightings += boardAlight.alightings;
    }

    if (boardAlight.load_count !== null) {
      dataPoint.load_count += boardAlight.load_count;
    }
  }

  const sortedData = sortBy(dataPoints, 'service_date');

  data.labels = sortedData.map(item => item.label);
  data.datasets[0].data = sortedData.map(item => item.boardings);
  data.datasets[1].data = sortedData.map(item => item.alightings);

  return <Line data={data} options={options} />
}

export default RidershipByTimeOfDay