import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:8080";
const COOKIE_NAME = "auth_token";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        return NextResponse.json({ valid: true });
    } catch {
        return NextResponse.json({ valid: false }, { status: 401 });
    }
}