import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route công khai (không cần đăng nhập)
const PUBLIC_ROUTES = ['/login', '/register', '/'];

// Kiểm tra xem request có session cookie hợp lệ không
// cookie-session của backend sẽ set cookie tên "session" 
function hasSessionCookie(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get('session');
  return !!sessionCookie?.value;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bỏ qua các route tĩnh, api routes của Next, ...
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const isAuthenticated = hasSessionCookie(req);

  // Nếu chưa đăng nhập và truy cập route được bảo vệ → redirect về login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Áp dụng middleware cho tất cả routes trừ static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
