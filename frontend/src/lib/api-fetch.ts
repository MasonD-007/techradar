import { cookies } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:8080";

export type ActionResult<T = undefined> = {
	success: boolean;
	data?: T;
	error?: string;
	status?: number;
};

export async function apiFetch(path: string, init: RequestInit = {}) {
	const token = (await cookies()).get("auth_token")?.value;
	const headers = new Headers(init.headers);
	if (token) headers.set("Authorization", `Bearer ${token}`);
	if (init.body) headers.set("Content-Type", "application/json");
	return fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
}

export async function readError(response: Response, fallback: string) {
	const text = (await response.text()).trim();
	return text || fallback;
}
