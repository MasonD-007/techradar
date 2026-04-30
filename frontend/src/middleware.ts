import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "auth_token";
const PUBLIC_ROUTES = ["/", "/login", "/sign-up"];
const ADMIN_ROUTE = "/admin";
const AUTHENTICATED_REDIRECT = "/radar";
const LOGIN_REDIRECT = "/login";

interface JwtPayload {
	user_id?: string;
	username?: string;
	role?: string;
}

function decodeJwt(token: string): JwtPayload | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return {
			user_id: payload.user_id,
			username: payload.username,
			role: payload.role,
		};
	} catch {
		return null;
	}
}

function getAuthToken(request: NextRequest): string | undefined {
	return request.cookies.get(COOKIE_NAME)?.value;
}

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = getAuthToken(request);
	const decoded = token ? decodeJwt(token) : null;
	const isAuthenticated = !!decoded;
	const isAdmin = decoded?.role === "admin";

	if (pathname === LOGIN_REDIRECT && isAuthenticated) {
		return NextResponse.redirect(new URL(AUTHENTICATED_REDIRECT, request.url));
	}

	if (pathname === ADMIN_ROUTE) {
		if (!isAuthenticated) {
			return NextResponse.redirect(new URL(LOGIN_REDIRECT, request.url));
		}
		if (!isAdmin) {
			return NextResponse.redirect(new URL(AUTHENTICATED_REDIRECT, request.url));
		}
		return NextResponse.next();
	}

	if (pathname !== "/" && !isPublicRoute(pathname)) {
		if (!isAuthenticated) {
			return NextResponse.redirect(new URL(LOGIN_REDIRECT, request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};