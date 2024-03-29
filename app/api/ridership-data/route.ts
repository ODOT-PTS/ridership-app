import { NextRequest, NextResponse } from 'next/server'

import { queryRidershipData } from '@/lib/api.js'

export  async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dataset = searchParams.get('dataset')

  if (!dataset ) {
    return NextResponse.json({ error: true }, { status: 400 })
  }

  try {
    const ridershipData = queryRidershipData(dataset, {
      route_id: searchParams.get('route_id'),
      direction_id: searchParams.get('direction_id'),
      stop_id: searchParams.get('stop_id'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      grouping: searchParams.get('grouping'),
      day_of_week_type: searchParams.get('day_of_week_type'),
    })
    return NextResponse.json(ridershipData)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: true }, { status: 500 })
  }
}

export const revalidate = 0
