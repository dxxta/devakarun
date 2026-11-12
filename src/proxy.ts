import { NextResponse, type NextRequest } from 'next/server'

import { isAiCrawler } from '@/lib/ai-crawlers'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/health') return NextResponse.next()
  if (process.env.BLOCK_AI_CRAWLERS?.toLowerCase() === 'false') return NextResponse.next()

  if (!isAiCrawler(request.headers.get('user-agent'))) return NextResponse.next()

  return new NextResponse('AI crawlers are not allowed.', {
    status: 403,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
}
