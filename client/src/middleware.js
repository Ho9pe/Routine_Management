import { NextResponse } from 'next/server';

// Middleware function to check if user is authenticated and has the correct role to access certain routes
export function middleware(request) {
    const token = request.cookies.get('token');
    const { pathname } = request.nextUrl;
    const userRole = request.cookies.get('user_role');
    // If user is logged in and tries to access login/register pages
    if (token && (pathname === '/login' || pathname === '/register')) {
        switch(userRole?.value) {
            case 'admin':
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            case 'teacher':
                return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
            case 'student':
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            default:
                return NextResponse.redirect(new URL('/', request.url));
        }
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
    if (pathname.startsWith('/admin') && userRole?.value !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/teacher') && userRole?.value !== 'teacher') {
        return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/student') && userRole?.value !== 'student') {
        return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
}

// Configuration for the middleware
export const config = {
    matcher: [
        '/',
        '/login',
        '/register',
        '/admin/:path*',
        '/teacher/:path*',
        '/student/:path*',
    ]
};