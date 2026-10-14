// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	cookies: async () => ({ get: () => ({ value: "tok" }) }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./api", () => ({ api: {} }));

import {
	addShareViewer,
	getRadarGraphByCode,
	getShareViewers,
	removeShareViewer,
	setShareVisibility,
} from "./actions";

const fetchMock = vi.fn();

beforeEach(() => {
	vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
	fetchMock.mockReset();
	vi.unstubAllGlobals();
});

const res = (status: number, body = "") =>
	new Response(body, { status, headers: { "Content-Type": "application/json" } });

describe("getRadarGraphByCode", () => {
	it("sends the bearer token and returns data", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ username: "bob", radar: [] })));
		const out = await getRadarGraphByCode("abc123");
		expect(out.success).toBe(true);
		expect(out.data?.username).toBe("bob");
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toContain("/share-codes/abc123");
		expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
	});

	it.each([
		[401, "Sign in to view this radar"],
		[404, "Radar not found or not shared with you"],
		[500, "Failed to fetch radar graph"],
	])("maps %i to a friendly error with status", async (status, error) => {
		fetchMock.mockResolvedValue(res(status, "nope"));
		const out = await getRadarGraphByCode("abc123");
		expect(out).toMatchObject({ success: false, status, error });
	});
});

describe("viewer actions", () => {
	it("setShareVisibility PATCHes the visibility", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ code: "abc123", visibility: "public" })));
		const out = await setShareVisibility("public");
		expect(out.data?.visibility).toBe("public");
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toContain("/share-codes/my");
		expect(init.method).toBe("PATCH");
		expect(init.body).toBe(JSON.stringify({ visibility: "public" }));
	});

	it("getShareViewers returns usernames", async () => {
		fetchMock.mockResolvedValue(res(200, JSON.stringify({ viewers: ["bob"] })));
		expect((await getShareViewers()).data).toEqual(["bob"]);
	});

	it("addShareViewer surfaces the backend message", async () => {
		fetchMock.mockResolvedValue(res(404, "User not found\n"));
		expect(await addShareViewer("ghost")).toMatchObject({ success: false, error: "User not found" });
	});

	it("removeShareViewer encodes the username", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
		expect((await removeShareViewer("a b")).success).toBe(true);
		expect(String(fetchMock.mock.calls[0][0])).toContain("/share-codes/my/viewers/a%20b");
	});
});
