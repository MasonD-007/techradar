// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	cookies: async () => ({ get: () => ({ value: "tok" }) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
	createTemplate,
	deleteTemplate,
	getGallery,
	getTemplate,
	getTemplates,
	importRadar,
	updateTemplate,
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

describe("template mutations", () => {
	const input = {
		slug: "my tpl/x",
		name: "N",
		description: "D",
		items: [{ technology_id: "t1", ring_id: 1 }],
	};

	it("createTemplate POSTs the body to /templates", async () => {
		fetchMock.mockResolvedValue(res(201, "{}"));
		expect(await createTemplate(input)).toEqual({ success: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url).endsWith("/templates")).toBe(true);
		expect(init.method).toBe("POST");
		expect(JSON.parse(init.body)).toEqual(input);
	});

	it("updateTemplate PUTs to the encoded slug", async () => {
		fetchMock.mockResolvedValue(res(200, "{}"));
		expect(await updateTemplate(input)).toEqual({ success: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url).endsWith("/templates/my%20tpl%2Fx")).toBe(true);
		expect(init.method).toBe("PUT");
		expect(JSON.parse(init.body)).toEqual(input);
	});

	it("deleteTemplate DELETEs the encoded slug", async () => {
		fetchMock.mockResolvedValue(res(200));
		expect(await deleteTemplate("a/b")).toEqual({ success: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url).endsWith("/templates/a%2Fb")).toBe(true);
		expect(init.method).toBe("DELETE");
	});

	it("passes server error text and status through", async () => {
		fetchMock.mockResolvedValue(res(409, "slug taken\n"));
		expect(await createTemplate(input)).toEqual({
			success: false,
			status: 409,
			error: "slug taken",
		});
		fetchMock.mockResolvedValue(res(400, "bad"));
		expect(await updateTemplate(input)).toMatchObject({ error: "bad", status: 400 });
		fetchMock.mockResolvedValue(res(403, "nope"));
		expect(await deleteTemplate("x")).toMatchObject({ error: "nope", status: 403 });
	});

	it("falls back to a friendly message on empty body and never throws", async () => {
		fetchMock.mockResolvedValue(res(500));
		expect(await createTemplate(input)).toMatchObject({
			error: "Failed to create template",
		});
		fetchMock.mockRejectedValue(new Error("net"));
		expect(await createTemplate(input)).toEqual({
			success: false,
			error: "Failed to create template",
		});
		expect(await updateTemplate(input)).toEqual({
			success: false,
			error: "Failed to update template",
		});
		expect(await deleteTemplate("x")).toEqual({
			success: false,
			error: "Failed to delete template",
		});
	});
});
