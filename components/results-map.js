import { useState, useMemo } from 'react'
import ReactMapGL, { Marker, NavigationControl, Popup } from 'react-map-gl';
import WebMercatorViewport from 'viewport-mercator-project'
import { compact, maxBy, minBy, startCase } from 'lodash'
import Gradient from "javascript-color-gradient"

import { formatNumber } from '../lib/formatters.js'

const getBounds = stops => {
  const maxLat = maxBy(stops, 'stop_lat').stop_lat
  const minLat = minBy(stops, 'stop_lat').stop_lat
  const maxLng = maxBy(stops, 'stop_lon').stop_lon
  const minLng = minBy(stops, 'stop_lon').stop_lon

  const southWest = [minLng, minLat]
  const northEast = [maxLng, maxLat]
  return [southWest, northEast]
}

function sizePin(ridership, maxStopRidershipValue) {
  const maxPinSize = 60
  const minPinSize = 4

  return Math.round(((ridership || 0) / maxStopRidershipValue) * (maxPinSize - minPinSize) + minPinSize)
}

function Pins(props) {
  const { ridershipData, mapField, setPopupInfo } = props
  const maxStopRidershipValue = Math.max(
    ...compact(ridershipData.map(item => item.boardings)),
    ...compact(ridershipData.map(item => item.alightings))
  )
  const colorGradient = new Gradient()
  colorGradient.setGradient('#F4B543', '#E94246', '#5C1B91')
  colorGradient.setMidpoint(57)

  return ridershipData.map(stop => {
    const size = sizePin(stop[mapField], maxStopRidershipValue)
    return (
      <Marker latitude={stop.stop_lat} longitude={stop.stop_lon} key={stop.stop_id}>
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

const MapPopup = ({ popupInfo, setPopupInfo }) => {
  if (!popupInfo) {
    return null
  }
  
  return (
    <Popup
      tipSize={10}
      longitude={popupInfo.stop_lon}
      latitude={popupInfo.stop_lat}
      closeOnClick={false}
      onClose={setPopupInfo}
      offsetLeft={popupInfo.size / 2}
      offsetTop={popupInfo.size / 2}
    >
      <div className="px-3">
        <div className="font-bold">{popupInfo.label}</div>
        {[
          'boardings',
          'alightings',
          'load_count',
          'bike_boardings',
          'bike_alightings',
          'ramp_boardings',
          'ramp_alightings'
        ].map(field => {
          if (popupInfo[field] === null || popupInfo[field] === undefined) {
            return null
          }

          return (
            <div key={field}>{startCase(field)}: {formatNumber(popupInfo[field])}</div>
          )
        })}
      </div>
    </Popup>
  )
}

const ResultsMap = ({ ridershipData, filters }) => {
  if (!ridershipData || ridershipData.length === 0 || !filters) {
    return null
  }

  // Calculate bounds of all stops
  const webViewport = new WebMercatorViewport({ width: 600, height: 400 })
  const bounds = webViewport.fitBounds(
    getBounds(ridershipData),
    { padding: 20 }
  )

  const [viewport, setViewport] = useState(bounds)
  const [popupInfo, setPopupInfo] = useState(null)
  const [mapField, setMapField] = useState('boardings')

  const pins = useMemo(() => <Pins ridershipData={ridershipData} setPopupInfo={setPopupInfo} mapField={mapField} />, [ridershipData, mapField])

  return (
    <div className="mt-8">
      <div className="flex justify-start pb-2">
        <div className="group">
          <a
            href="#"
            className={`flex items-end justify-center text-center mx-auto px-4 pt-2 w-full`}
            onClick={event => {
              event.preventDefault()
              setMapField('boardings')
            }}
          >
            <span className={`block px-1 pt-1 pb-1 text-gray-400 group-hover:text-blue-500 ${mapField === 'boardings' && 'text-gray-800'}`}>
                <span className="block text-xs pb-2">Boardings</span>
                {mapField === 'boardings' && <span className="block w-5 mx-auto h-1 bg-gray-800 group-hover:bg-blue-500 rounded-full"></span>}
            </span>
          </a>
        </div>
        <div className="group">
          <a
            href="#"
            className="flex items-end justify-center text-center mx-auto px-4 pt-2 w-full"
            onClick={event => {
              event.preventDefault()
              setMapField('alightings')
            }}
          >
            <span className={`block px-1 pt-1 pb-1 text-gray-400 group-hover:text-blue-500 ${mapField === 'alightings' && 'text-gray-800'}`}>
                <span className="block text-xs pb-2">Alightings</span>
                {mapField === 'alightings' && <span className="block w-5 mx-auto h-1 bg-gray-800 group-hover:bg-blue-500 rounded-full"></span>}
            </span>
          </a>
        </div>
      </div>
      <ReactMapGL
        {...viewport}
        width="100%"
        onViewportChange={nextViewport => setViewport(nextViewport)}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_REACT_APP_MAPBOX_ACCESS_TOKEN}
        scrollZoom={false}
      >
        <NavigationControl style={{ right: 10, top: 10 }} />

        {pins}

        <MapPopup popupInfo={popupInfo} setPopupInfo={setPopupInfo} />
      </ReactMapGL>
    </div>
  )
}

export default ResultsMap