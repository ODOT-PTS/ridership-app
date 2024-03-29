import { NextRequest, NextResponse } from 'next/server'

import { queryRoutesAndDirections, queryRidershipDateRange } from '@/lib/api.js'

export  async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dataset = searchParams.get('dataset')

  if (!dataset) {
    return NextResponse.json({ error: true }, { status: 400 })
  }

  try {
    const routes = queryRoutesAndDirections(dataset)
    const ridershipDateRange = queryRidershipDateRange(dataset)
    return NextResponse.json({ routes, ridershipDateRange })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: true }, { status: 500 })
  }
}

export const revalidate = 0
