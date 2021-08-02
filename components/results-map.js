import { useEffect, useState, useMemo } from 'react'
import ReactMapGL, { Layer, Marker, NavigationControl, Popup, Source } from 'react-map-gl'
import WebMercatorViewport from 'viewport-mercator-project'
import { compact, maxBy, minBy, startCase } from 'lodash'
import Gradient from 'javascript-color-gradient'

import ToggleMenu from './toggle-menu.js'

import { divideIntoBuckets, formatNumber } from '../lib/formatters.js'
import { getAlightingFieldName, getBoardingFieldName } from '../lib/utils.js'

const getBounds = stops => {
  if (!stops || stops.length === 0) {
    return [[0, 0], [0, 0]]
  }

  const maxLat = maxBy(stops, 'stop_lat').stop_lat
  const minLat = minBy(stops, 'stop_lat').stop_lat
  const maxLng = maxBy(stops, 'stop_lon').stop_lon
  const minLng = minBy(stops, 'stop_lon').stop_lon

  const southWest = [minLng, minLat]
  const northEast = [maxLng, maxLat]
  return [southWest, northEast]
}

function sizePin(value, maxValue) {
  const maxPinSize = 60
  const minPinSize = 4

  return Math.round(((value || 0) / maxValue) * (maxPinSize - minPinSize) + minPinSize)
}

const Pins = ({ ridershipData, setPopupInfo, mapField, type }) => {
  const boardingFieldName = getBoardingFieldName(type)
  const alightingFieldName = getAlightingFieldName(type)
  const fieldName = mapField === 'boardings' ? boardingFieldName : alightingFieldName
  const maxValue = Math.max(
    ...compact(ridershipData.map(item => item[boardingFieldName])),
    ...compact(ridershipData.map(item => item[alightingFieldName]))
  )
  const colorGradient = new Gradient()
  colorGradient.setGradient('#F4B543', '#E94246', '#5C1B91')
  colorGradient.setMidpoint(57)

  return ridershipData.map(stop => {
    const size = sizePin(stop[fieldName], maxValue)
    return (
      <Marker latitude={stop.stop_lat} longitude={stop.stop_lon} key={stop.stop_id} offsetLeft={-size / 2} offsetTop={-size / 2}>
        <svg
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            cursor: 'pointer',
            fill: colorGradient.getColor(size - 3),
            stroke: '#cccccc',
            opacity: 0.9
          }}
          onClick={() => setPopupInfo({
            ...stop,
            size
          })}
        >
          <circle cx={size / 2} cy={size / 2} r={size / 2} />
        </svg>
      </Marker>
    )
  })
}

const Line = ({ ridershipData, setPopupInfo }) => {
  const features = []

  for (const [index, stop] of ridershipData.entries()) {
    const feature = {
      geometry: {
        type: 'LineString',
      },
      properties: {
        loadCount: stop.load_count
      },
      type: 'Feature'
    }

    if (stop.load_type === 0) {
      // Load Type is arrival, so ignore data from first stop
      if (index === 0) {
        continue
      }

      feature.geometry.coordinates = [
        [ridershipData[index - 1].stop_lon, ridershipData[index - 1].stop_lat],
        [stop.stop_lon, stop.stop_lat]
      ]

      feature.properties.from_stop_id = ridershipData[index - 1].stop_id
      feature.properties.to_stop_id = stop.stop_id

      features.push(feature)
    } else {
      // Load Type is departure, so ignore data from last stop
      if (index === ridershipData.length - 1) {
        continue
      }

      feature.geometry.coordinates = [
        [stop.stop_lon, stop.stop_lat],
        [ridershipData[index + 1].stop_lon, ridershipData[index + 1].stop_lat]
      ]

      feature.properties.from_stop_id = stop.stop_id
      feature.properties.to_stop_id = ridershipData[index + 1].stop_id

      features.push(feature)
    }
  }

  // Assign Line width into 5 buckets
  const buckets = divideIntoBuckets(features.map(feature => feature.properties.loadCount), 5)
  const loadCountColorGradient = new Gradient()
  loadCountColorGradient.setGradient('#F4B543', '#E94246', '#5C1B91')
  loadCountColorGradient.setMidpoint(5)

  for (const [index, bucket] of buckets.entries()) {
    bucket.color = loadCountColorGradient.getColor(index + 1)
  }

  for (const feature of features) {
    const bucket = buckets.find(bucket => bucket.min <= feature.properties.loadCount && bucket.max > feature.properties.loadCount)
    feature.properties = {
      ...feature.properties,
      lineColor: bucket?.color || '#cccccc'
    }
  }

  const layerStyle = {
    id: 'route-data-line',
    source: 'route-data',
    type: 'line',
    paint: {
      'line-width': 2,
      'line-color': ['get', 'lineColor'],
      'line-width': 6,
      'line-opacity': 1
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  }

  const geojson = {
    "type": "FeatureCollection",
    "features": features
  }

  return (
    <>
      <Source id="route-data" type="geojson" data={geojson}>
        <Layer {...layerStyle} />
      </Source>
      {ridershipData.map(stop => {
        const size = 8
        return (
          <Marker latitude={stop.stop_lat} longitude={stop.stop_lon} key={stop.stop_id} offsetLeft={-size / 2} offsetTop={-size / 2}>
            <svg
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{
                cursor: 'pointer',
                fill: '#333333',
                stroke: '#cccccc',
                opacity: 1
              }}
              onClick={() => setPopupInfo({
                ...stop,
                size
              })}
            >
              <circle cx={size / 2} cy={size / 2} r={size / 2} />
            </svg>
          </Marker>
        )
      })}
      <div className="absolute bottom-8 right-2 bg-white px-3 py-1 rounded-md">
        <strong>Load Count</strong>
        {buckets.map(bucket => (
          <div className="pl-2 flex items-center" key={bucket.min}>
            <div className="w-4 h-4 mr-1" style={{ backgroundColor: bucket.color }}></div>
            {bucket.min}-{bucket.max}
          </div>
        ))}
      </div>
    </>
  )
}

const MapPopup = ({ popupInfo, setPopupInfo }) => {
  if (!popupInfo) {
    return null
  }

  const loadTypeLabel = popupInfo.load_type === 0 ? 'Arrival' : 'Departure';

  const fields = [
    {
      key: 'boardings',
      name: 'Boardings',
    },
    {
      key: 'alightings',
      name: 'Alightings',
    },
    {
      key: 'load_count',
      name: `${loadTypeLabel} Load Count`,
    },
    {
      key: 'bike_boardings',
      name: 'Bike Boardings',
    },
    {
      key: 'bike_alightings',
      name: 'Bike Alightings',
    },
    {
      key: 'ramp_boardings',
      name: 'Ramp Boardings',
    },
    {
      key: 'ramp_alightings',
      name: 'Ramp Alightings',
    }
  ]
  
  return (
    <Popup
      tipSize={10}
      longitude={popupInfo.stop_lon}
      latitude={popupInfo.stop_lat}
      closeOnClick={false}
      onClose={setPopupInfo}
      offsetLeft={0}
      offsetTop={-popupInfo.size / 2}
    >
      <div className="px-3">
        <div className="font-bold mb-2">{popupInfo.label}</div>
        <table className="min-w-full divide-y divide-gray-200 border-t border-b border-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {fields.map(field => {
              if (popupInfo[field.key] === null || popupInfo[field.key] === undefined) {
                return null
              }

              return (
                <tr key={field.key}>
                  <td className="px-3 pl-1 whitespace-nowrap">{field.name}</td>
                  <td className="px-3 pr-1 whitespace-nowrap text-right font-bold">{formatNumber(popupInfo[field.key])}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Popup>
  )
}

const ResultsMap = ({ ridershipData, type, filters }) => {
  // Calculate bounds of all stops
  const webViewport = new WebMercatorViewport({ width: 600, height: 400 })
  const bounds = webViewport.fitBounds(
    getBounds(ridershipData),
    { padding: 40 }
  )

  const viewSupportsLoadCounts = type === 'passengers' && filters.routeId !== 'all' && filters.directionId !== 'all'

  const [viewport, setViewport] = useState(bounds)
  const [popupInfo, setPopupInfo] = useState(null)
  const [mapField, setMapField] = useState(viewSupportsLoadCounts ? 'loadCounts' : 'boardings')

  useEffect(() => {
    if (!viewSupportsLoadCounts && mapField === 'loadCounts') {
      setMapField('boardings')
    }
  }, [viewSupportsLoadCounts, mapField])

  const mapData = useMemo(
    () => {
      if (mapField === 'boardings' || mapField === 'alightings') {
        return <Pins ridershipData={ridershipData} setPopupInfo={setPopupInfo} type={type} mapField={mapField} />
      } else if (mapField === 'loadCounts') {
        return <Line ridershipData={ridershipData} setPopupInfo={setPopupInfo} />
      }
      
    },
    [ridershipData, mapField, type]
  )

  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  const fieldOptions = [
    {
      value: 'boardings',
      label: 'Boardings'
    },
    {
      value: 'alightings',
      label: 'Alightings'
    }
  ]

  if (viewSupportsLoadCounts) {
    fieldOptions.unshift({
      value: 'loadCounts',
      label: 'Load Count'
    })
  }

  return (
    <div className="mt-8">
      <ToggleMenu
        fieldOptions={fieldOptions}
        field={mapField}
        setField={setMapField}
      />
      <ReactMapGL
        {...viewport}
        width="100%"
        onViewportChange={nextViewport => setViewport(nextViewport)}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN}
        scrollZoom={false}
      >
        <NavigationControl style={{ right: 10, top: 10 }} />

        {mapData}

        <MapPopup popupInfo={popupInfo} setPopupInfo={setPopupInfo} />
      </ReactMapGL>
    </div>
  )
}

export default ResultsMap