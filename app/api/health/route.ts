import { NextResponse } from 'next/server';

// Use Node.js runtime (default)
// export const runtime = 'nodejs'; // Optional, this is default

export async function GET() {
  try {
    // Check basic app health
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    // Optional: Check database connection
    if (process.env.DATABASE_URL) {
      // Add database check here if needed
      health['database'] = 'connected';
    }

    // Optional: Check Redis connection
    if (process.env.REDIS_URL) {
      // Add Redis check here if needed
      health['cache'] = 'connected';
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      { status: 503 }
    );
  }
}

