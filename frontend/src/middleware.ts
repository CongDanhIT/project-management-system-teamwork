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

  // Tạm thời nới lỏng Middleware để tránh Redirect Loop giữa localhost:3000 và :8000
  // Chúng ta sẽ để AuthProvider (Client-side) thực hiện kiểm tra chính xác qua API backend
  // Middleware chỉ đóng vai trò lọc sơ bộ các route tĩnh và api Next.js
  
  return NextResponse.next();
}

// Áp dụng middleware cho tất cả routes trừ static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
