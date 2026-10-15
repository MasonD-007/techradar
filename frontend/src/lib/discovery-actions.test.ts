// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	cookies: async () => ({ get: () => ({ value: "tok" }) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
	getGallery,
	getTemplate,
	getTemplates,
	importRadar,
} from "./discovery-actions";

const fetchMock = vi.fn();

beforeEach(() => {
	vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
	fetchMock.mockReset();
	vi.unstubAllGlobals();
});

const res = (status: number, body = "") =>
	new Response(body, {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("getGallery", () => {
	it("builds the query string from provided params", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ radars: [] })));
		await getGallery({ q: "go", quadrant: 2, page: 3 });
		expect(String(fetchMock.mock.calls[0][0])).toContain(
			"/gallery?q=go&quadrant=2&page=3",
		);
	});

	it("omits absent params", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ radars: [] })));
		await getGallery({});
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url.endsWith("/gallery")).toBe(true);
	});

	it("returns data on 200", async () => {
		const page = { radars: [], page: 1, has_more: false };
		fetchMock.mockResolvedValue(res(200, JSON.stringify(page)));
		expect(await getGallery({})).toEqual({ success: true, data: page });
	});

	it("returns a friendly error with status on 500", async () => {
		fetchMock.mockResolvedValue(res(500, "boom"));
		expect(await getGallery({})).toEqual({
			success: false,
			status: 500,
			error: "Failed to load gallery",
		});
	});
});

describe("templates", () => {
	it("getTemplates hits /templates", async () => {
		fetchMock.mockResolvedValue(res(200, "[]"));
		const out = await getTemplates();
		expect(out.success).toBe(true);
		expect(String(fetchMock.mock.calls[0][0]).endsWith("/templates")).toBe(true);
	});

	it("getTemplate hits /templates/{slug}", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ slug: "frontend-starter" })));
		await getTemplate("frontend-starter");
		expect(String(fetchMock.mock.calls[0][0])).toContain(
			"/templates/frontend-starter",
		);
	});

	it("getTemplate 404 carries status", async () => {
		fetchMock.mockResolvedValue(res(404, "nope"));
		expect(await getTemplate("missing")).toMatchObject({
			success: false,
			status: 404,
		});
	});
});

describe("importRadar", () => {
	it("POSTs the source and technologyIds with the bearer token", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ added: 1, skipped: 0 })));
		const out = await importRadar({ shareCode: "abc123" }, ["id1"]);
		expect(out).toEqual({ success: true, data: { added: 1, skipped: 0 } });
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toContain("/radar/import");
		expect(init.method).toBe("POST");
		expect(init.body).toBe(
			'{"source":{"shareCode":"abc123"},"technologyIds":["id1"]}',
		);
		expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
	});

	it("omits technologyIds when undefined", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ added: 0, skipped: 0 })));
		await importRadar({ templateSlug: "t" });
		expect(fetchMock.mock.calls[0][1].body).toBe('{"source":{"templateSlug":"t"}}');
	});

	it.each([
		[401, "Sign in to copy technologies"],
		[404, "Radar not found or not shared with you"],
	])("maps %i to a friendly error", async (status, error) => {
		fetchMock.mockResolvedValue(res(status, "x"));
		expect(await importRadar({ shareCode: "abc123" })).toEqual({
			success: false,
			status,
			error,
		});
	});

	it("does not throw on network failure", async () => {
		fetchMock.mockRejectedValue(new Error("down"));
		expect(await importRadar({ shareCode: "abc123" })).toEqual({
			success: false,
			error: "Failed to copy technologies",
		});
	});
});
