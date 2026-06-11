import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  const hostname = host.split(':')[0]; // Remove port if present

  // dipika.localhost - support localhost subdomains
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.split('.')[0];
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-slug', slug);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const parts = hostname.split('.');

  // dipika.yourdomain.com
  if (
    parts.length >= 3 &&
    parts[0] !== 'www' &&
    !hostname.includes('localhost')
  ) {
    const slug = parts[0];
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-slug', slug);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
