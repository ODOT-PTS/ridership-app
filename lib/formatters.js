import { min, max, range } from 'lodash'

export const formatRouteName = route => {
  const nameParts = []

  if (route.route_short_name !== '' && route.route_short_name !== null) {
    nameParts.push(route.route_short_name)
  }

  if (route.route_long_name !== '' && route.route_long_name !== null) {
    nameParts.push(route.route_long_name)
  }

  return nameParts.join(' - ')
}

export const formatDirectionName = direction => {
  const nameParts = [direction.direction_id.toString()]

  if (direction.trip_headsign) {
    nameParts.push(direction.trip_headsign)
  }

  return nameParts.join(' - ')
}

export const formatAgencyName = agencies => {
  return agencies.map(agency => agency.agency_name).join(' - ')
}

export const formatNumber = number => {
  if (number === undefined || number === null) {
    return ''
  }

  return Number(number).toLocaleString() 
}

export const formatBoardingLabel = type => {
  if (type === 'bikes') {
    return 'Bike Boardings'
  } else if (type === 'ramp') {
    return 'Ramp Boardings'
  }

  return 'Boardings'
}

export const formatAlightingLabel = type => {
  if (type === 'bikes') {
    return 'Bike Alightings'
  } else if (type === 'ramp') {
    return 'Ramp Alightings'
  }

  return 'Alightings'
}
export const formatYAxisLabel = type => {
  if (type === 'bikes') {
    return 'Bikess'
  } else if (type === 'ramp') {
    return 'Ramp Boardings'
  }

  return 'Riders'
}

export const divideIntoBuckets = (items, bucketCount) => {
  const minItem = min(items)
  const maxItem = max(items)

  const bucketSize = Math.ceil((maxItem - minItem) / bucketCount)

  return range(bucketCount).map(bucketIndex => {
    return {
      min: minItem + bucketIndex * bucketSize,
      max: minItem + (bucketIndex + 1) * bucketSize
    }
  })
}