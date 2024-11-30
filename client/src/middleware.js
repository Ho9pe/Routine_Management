import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('token');
    const { pathname } = request.nextUrl;

    // If user is logged in and tries to access login/register pages
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Public paths that don't require authentication
    const publicPaths = ['/', '/login', '/register'];
    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for authentication
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based route protection
    const userRole = request.cookies.get('user_role');
    
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/teacher') && userRole !== 'teacher') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/student') && userRole !== 'student') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/login',
        '/register',
        '/dashboard/:path*',
        '/admin/:path*',
        '/teacher/:path*',
        '/student/:path*',
        '/courses/:path*'
    ]
};