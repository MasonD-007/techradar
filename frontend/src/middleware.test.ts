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
});
