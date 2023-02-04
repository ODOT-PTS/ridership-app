export const getBoardingFieldName = (type) => {
  if (type === 'bikes') {
    return 'bike_boardings'
  } else if (type === 'ramp') {
    return 'ramp_boardings'
  }

  return 'boardings'
}

export const getAlightingFieldName = (type) => {
  if (type === 'bikes') {
    return 'bike_alightings'
  } else if (type === 'ramp') {
    return 'ramp_alightings'
  }

  return 'alightings'
}

export const chartColors = {
  boarding: '#4BC0C0',
  alighting: '#FF6384',
  load_count: '#4B84C1',
}
