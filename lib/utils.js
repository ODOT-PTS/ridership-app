export const getBoardingFieldName = type => {
  if (type === 'bikes') {
    return 'bike_boardings'
  } else if (type === 'ramp') {
    return 'ramp_boardings'
  }

  return 'boardings'
}

export const getAlightingFieldName = type => {
  if (type === 'bikes') {
    return 'bike_alightings'
  } else if (type === 'ramp') {
    return 'ramp_alightings'
  }

  return 'alightings'
}