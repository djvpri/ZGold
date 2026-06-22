import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    // DB health check
    const result = await pool.query('SELECT 1')
    
    return NextResponse.json({
      status: 'healthy',
      app: 'ZGold',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      app: 'ZGold',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
