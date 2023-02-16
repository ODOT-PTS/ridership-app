import { queryRidershipData } from '../../lib/api.js'

export default async function handler(req, res) {
  try {
    const ridershipData = queryRidershipData(req.query)
    res.json(ridershipData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: true })
  }
}
