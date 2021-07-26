import { useState, useMemo } from 'react'
import ReactMapGL, { Marker, NavigationControl, Popup } from 'react-map-gl'
import WebMercatorViewport from 'viewport-mercator-project'
import { compact, maxBy, minBy, startCase } from 'lodash'
import Gradient from 'javascript-color-gradient'

import ToggleMenu from './toggle-menu.js'

import { formatNumber } from '../lib/formatters.js'
import { getAlightingFieldName, getBoardingFieldName } from '../lib/utils.js'

const getBounds = stops => {
  if (!stops) {
    return []
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

function Pins({ ridershipData, setPopupInfo, boardingsOrAlightings, type }) {
  const boardingFieldName = getBoardingFieldName(type)
  const alightingFieldName = getAlightingFieldName(type)
  const fieldName = boardingsOrAlightings === 'boardings' ? boardingFieldName : alightingFieldName
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

const ResultsMap = ({ ridershipData, type }) => {
  // Calculate bounds of all stops
  const webViewport = new WebMercatorViewport({ width: 600, height: 400 })
  const bounds = webViewport.fitBounds(
    getBounds(ridershipData),
    { padding: 40 }
  )

  const [viewport, setViewport] = useState(bounds)
  const [popupInfo, setPopupInfo] = useState(null)
  const [boardingsOrAlightings, setBoardingsOrAlightings] = useState('boardings')

  const pins = useMemo(
    () => <Pins ridershipData={ridershipData} setPopupInfo={setPopupInfo} type={type} boardingsOrAlightings={boardingsOrAlightings} />,
    [ridershipData, boardingsOrAlightings, type]
  )

  if (!ridershipData || ridershipData.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <ToggleMenu
        fieldOptions={[
          {
            value: 'boardings',
            label: 'Boardings'
          },
          {
            value: 'alightings',
            label: 'Alightings'
          }
        ]}
        field={boardingsOrAlightings}
        setField={setBoardingsOrAlightings}
      />
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