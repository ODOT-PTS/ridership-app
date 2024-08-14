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

export const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // meters
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const metersToMiles = (meters) => meters / 1609.344
