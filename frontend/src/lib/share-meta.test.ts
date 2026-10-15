// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildShareMetadata, fetchPublicShareSummary } from "./share-meta";

afterEach(() => vi.unstubAllGlobals());

const summary = { username: "secretalice", count: 4, top: ["Zebra DB", "Quokka JS", "Narwhal"] };

describe("fetchPublicShareSummary", () => {
	it("summarises a 200 response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({
					username: "bob",
					radar: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }],
				}),
			}),
		);
		expect(await fetchPublicShareSummary("abc")).toEqual({
			username: "bob",
			count: 4,
			top: ["a", "b", "c"],
		});
	});

	it.each([401, 404, 500])("returns null for %i", async (status) => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({}) }));
		expect(await fetchPublicShareSummary("abc")).toBeNull();
	});

	it("returns null when fetch rejects", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
		expect(await fetchPublicShareSummary("abc")).toBeNull();
	});

	it("returns null on a timeout/abort", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));
		const m = buildShareMetadata("abc", await fetchPublicShareSummary("abc"));
		expect(m.title).toBe("Private radar | TechRadar");
	});

	it("sends an anonymous request with a timeout signal", async () => {
		const f = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
		vi.stubGlobal("fetch", f);
		await fetchPublicShareSummary("abc");
		const init = f.mock.calls[0][1] as RequestInit;
		expect(init.signal).toBeDefined();
		expect(init.credentials).toBeUndefined();
		const headers = JSON.stringify(init.headers ?? {}).toLowerCase();
		expect(headers).not.toContain("cookie");
		expect(headers).not.toContain("authorization");
	});

	it("returns null for oversized codes without fetching", async () => {
		const f = vi.fn();
		vi.stubGlobal("fetch", f);
		expect(await fetchPublicShareSummary("x".repeat(65))).toBeNull();
		expect(f).not.toHaveBeenCalled();
	});
});

describe("buildShareMetadata", () => {
	it("builds rich metadata for a public summary", () => {
		const m = buildShareMetadata("abc123", summary);
		expect(String(m.title)).toContain("secretalice");
		expect(m.description).toContain("4");
		const images = m.openGraph?.images as { url: string }[];
		expect(images[0].url.endsWith("/og/radar?share=abc123")).toBe(true);
	});

	it("pluralises the description", () => {
		expect(buildShareMetadata("a", { username: "u", count: 1, top: ["X"] }).description).toBe("1 technology, including X.");
		expect(buildShareMetadata("a", { username: "u", count: 0, top: [] }).description).toBe("No technologies yet.");
		expect(buildShareMetadata("a", { username: "u", count: 2, top: ["X", "Y"] }).description).toBe("2 technologies, including X, Y.");
	});

	it("encodes the share code in the image URL", () => {
		const m = buildShareMetadata("a b&c", summary);
		const images = m.openGraph?.images as { url: string }[];
		expect(images[0].url.endsWith("/og/radar?share=a%20b%26c")).toBe(true);
	});

	it("is generic and leak-free when the radar is not public", () => {
		const m = buildShareMetadata("abc123", null);
		expect(m.title).toBe("Private radar | TechRadar");
		const json = JSON.stringify(m);
		expect(json).not.toContain("secretalice");
		for (const name of summary.top) expect(json).not.toContain(name);
	});

	it("is generic for oversized codes", () => {
		const m = buildShareMetadata("x".repeat(65), summary);
		expect(m.title).toBe("Private radar | TechRadar");
		expect(JSON.stringify(m)).not.toContain("secretalice");
	});

	it("returns the default title with no code", () => {
		const m = buildShareMetadata(undefined, null);
		expect(m.title).toBe("TechRadar");
		expect(m.openGraph?.images).toBeUndefined();
	});

	describe("site URL", () => {
		const url = (m: ReturnType<typeof buildShareMetadata>) =>
			(m.openGraph?.images as { url: string }[])[0].url;
		afterEach(() => vi.unstubAllEnvs());

		it("prefers SITE_URL over NEXT_PUBLIC_SITE_URL", () => {
			vi.stubEnv("SITE_URL", "https://a.example");
			vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://b.example");
			expect(url(buildShareMetadata("abc", summary))).toBe("https://a.example/og/radar?share=abc");
		});

		it("falls back to NEXT_PUBLIC_SITE_URL", () => {
			vi.stubEnv("SITE_URL", undefined as unknown as string);
			vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://b.example");
			expect(url(buildShareMetadata("abc", summary))).toBe("https://b.example/og/radar?share=abc");
		});

		it("reads the env on every call", () => {
			vi.stubEnv("SITE_URL", "https://one.example");
			expect(url(buildShareMetadata("abc", summary))).toContain("https://one.example");
			vi.stubEnv("SITE_URL", "https://two.example");
			expect(url(buildShareMetadata("abc", null))).toBe("https://two.example/og/radar");
		});
	});
});
