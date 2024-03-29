import { NextRequest, NextResponse } from 'next/server'

import { queryStops } from '@/lib/api.js'

export  async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dataset = searchParams.get('dataset')

  if (!dataset ) {
    return NextResponse.json({ error: true }, { status: 400 })
  }

  try {
    const stops = queryStops(dataset, {
      route_id: searchParams.get('route_id'),
      direction_id: searchParams.get('direction_id'),
    })
    return NextResponse.json(stops)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: true }, { status: 500 })
  }
}

export const revalidate = 0
