import { queryStops } from '../../lib/api.mjs'

export default async function handler(req, res) {
  try {
    const stops = queryStops(req.query)
    res.json(stops)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: true })
  }
}
