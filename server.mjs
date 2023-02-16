import dotenv from 'dotenv'
import express from 'express'
import next from 'next'

import {
  queryAgencies,
  queryStops,
  queryRidershipData,
  queryRidershipDateRange,
  queryRoutesAndDirections,
} from './lib/api.mjs'

dotenv.config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.get('/agencies', (req, res) => {
    try {
      const agencies = queryAgencies()
      res.json(agencies)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/routes', (req, res) => {
    try {
      const routes = queryRoutesAndDirections()
      res.json(routes)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/boardalight-date-range', (req, res) => {
    try {
      const dateRange = queryRidershipDateRange()
      res.json(dateRange)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/stops', (req, res) => {
    try {
      const stops = queryStops(req.query)
      res.json(stops)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/ridership-data', (req, res) => {
    try {
      const ridershipData = queryRidershipData(req.query)
      res.json(ridershipData)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
