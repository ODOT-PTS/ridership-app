import dotenv from 'dotenv'
import untildify from 'untildify'

import express from 'express'
import next from 'next'
import { openDb } from 'gtfs'

import { queryAgencies, queryStops, queryRidershipData, queryRidershipDateRange, queryRoutesAndDirections } from './lib/api.mjs'

dotenv.config()

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = express()

  const db = await openDb({ sqlitePath: untildify(process.env.SQLITE_PATH) })

  server.get('/agencies', async (req, res) => {
    try {
      const agencies = await queryAgencies()
      res.json(agencies)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/routes', async (req, res) => {
    try {
      const routes = await queryRoutesAndDirections()
      res.json(routes)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/boardalight-date-range', async (req, res) => {
    try {
      const dateRange = await queryRidershipDateRange()
      res.json(dateRange)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/stops', async (req, res) => {
    try {
      const stops = await queryStops(req.query)
      res.json(stops)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: true })
    }
  })

  server.get('/ridership-data', async (req, res) => {
    try {
      const ridershipData = await queryRidershipData(req.query)
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