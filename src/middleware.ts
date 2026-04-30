import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path  = req.nextUrl.pathname;

    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    if (token.isSuspended) {
      return NextResponse.redirect(new URL('/suspended', req.url));
    }

    // Role-based routing
    if (path.startsWith('/farmer') && token.role !== 'farmer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (path.startsWith('/buyer') && token.role !== 'buyer') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (path.startsWith('/transporter') && token.role !== 'transporter') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (path.startsWith('/specialist') && token.role !== 'specialist') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (path.startsWith('/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check approval for certain roles
    if (!token.isApproved && ['farmer', 'transporter', 'specialist'].includes(token.role as string)) {
      if (!path.startsWith('/pending-approval')) {
        return NextResponse.redirect(new URL('/pending-approval', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/farmer/:path*',
    '/buyer/:path*',
    '/transporter/:path*',
    '/specialist/:path*',
    '/admin/:path*',
    '/learning-hub/submit',
  ],
};
