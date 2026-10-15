// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isShareView, middleware } from "./middleware";

const req = (path: string) => new NextRequest(`http://localhost${path}`);

describe("isShareView", () => {
	it("is true only for /radar with a share code", () => {
		expect(isShareView("/radar", new URLSearchParams("share=abc123"))).toBe(true);
		expect(isShareView("/radar", new URLSearchParams("share="))).toBe(false);
		expect(isShareView("/radar", new URLSearchParams(""))).toBe(false);
		expect(isShareView("/compare", new URLSearchParams("share=abc123"))).toBe(false);
	});
});

describe("middleware (logged out)", () => {
	it("lets a share link through", async () => {
		const res = await middleware(req("/radar?share=abc123"));
		expect(res.headers.get("location")).toBeNull();
	});

	it("still redirects plain /radar to login", async () => {
		const res = await middleware(req("/radar"));
		expect(res.headers.get("location")).toContain("/login");
	});

	it("still redirects other protected routes to login", async () => {
		const res = await middleware(req("/compare?share=abc123"));
		expect(res.headers.get("location")).toContain("/login");
	});

	it("still redirects /admin to login", async () => {
		const res = await middleware(req("/admin"));
		expect(res.headers.get("location")).toContain("/login");
	});

	it("lets /explore through so the gallery is public", async () => {
		const res = await middleware(req("/explore"));
		expect(res.headers.get("location")).toBeNull();
	});

	it("lets the preview image route through for crawlers", async () => {
		const res = await middleware(req("/og/radar?share=abc123"));
		expect(res.headers.get("location")).toBeNull();
	});
});

const jwtWith = (payload: object) =>
	`h.${btoa(JSON.stringify(payload))}.s`;
const reqWithToken = (path: string, payload: object) =>
	new NextRequest(`http://localhost${path}`, {
		headers: { cookie: `auth_token=${jwtWith(payload)}` },
	});
const nowSec = () => Math.floor(Date.now() / 1000);

describe("middleware (token expiry)", () => {
	const expired = { user_id: "u1", username: "a", role: "user", exp: nowSec() - 60 };
	const valid = { user_id: "u1", username: "a", role: "user", exp: nowSec() + 3600 };
	const noExp = { user_id: "u1", username: "a", role: "user" };

	it("does not bounce an expired token away from /login", async () => {
		const res = await middleware(reqWithToken("/login?next=%2Fradar", expired));
		expect(res.headers.get("location")).toBeNull();
	});

	it("redirects a valid token from /login to /radar", async () => {
		const res = await middleware(reqWithToken("/login", valid));
		expect(res.headers.get("location")).toContain("/radar");
	});

	it("redirects an expired token on /radar to login", async () => {
		const res = await middleware(reqWithToken("/radar", expired));
		expect(res.headers.get("location")).toContain("/login");
	});

	it("lets an expired token through on a share link", async () => {
		const res = await middleware(reqWithToken("/radar?share=abc123", expired));
		expect(res.headers.get("location")).toBeNull();
	});

	it("treats a token without exp as authenticated", async () => {
		const res = await middleware(reqWithToken("/login", noExp));
		expect(res.headers.get("location")).toContain("/radar");
	});
});
