import React from 'react'
import { Line } from 'react-chartjs-2'
import { DateTime } from 'luxon'
import { compact } from 'lodash'

class LineChart extends React.PureComponent {
  render() {
    const { ridershipData } = this.props;
    
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

    const classifyDayOfWeek = dayOfWeek => {
      const weekdays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ]

      if (weekdays.includes(dayOfWeek)) {
        return 'Weekday'
      }

      return dayOfWeek
    }

    const dataPoints = [
      'Weekday',
      'Saturday',
      'Sunday'
    ].map(dayOfWeekType => ({
      label: dayOfWeekType,
      service_day_of_week_type: dayOfWeekType,
      boardings: 0,
      alightings: 0,
      load_count: 0
    }))

    for (const boardAlight of ridershipData) {
      const dayOfWeekType = classifyDayOfWeek(DateTime.fromFormat(boardAlight.service_date.toString(), 'yyyyMMdd').toFormat('cccc'))
      let dataPoint = dataPoints.find(item => item.service_day_of_week_type === dayOfWeekType);

      if (!dataPoint) {
        dataPoint = {
          label: dayOfWeekType,
          service_day_of_week_type: dayOfWeekType,
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

    data.labels = dataPoints.map(item => item.label);
    data.datasets[0].data = dataPoints.map(item => item.boardings);
    data.datasets[1].data = dataPoints.map(item => item.alightings);

    return <Line data={data} options={options} />
  }
}

export default LineChart