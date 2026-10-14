import { describe, expect, it } from "vitest";
import { loginUrlForShare, safeNextPath } from "./share-access";

describe("safeNextPath", () => {
	it("keeps same-site paths", () => {
		expect(safeNextPath("/radar?share=abc123")).toBe("/radar?share=abc123");
	});
	it.each([null, undefined, "", "radar", "//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/\t\\evil.com", " //evil.com", "/a\u0000b"])(
		"falls back to /radar for %s",
		(value) => {
			expect(safeNextPath(value as string | null | undefined)).toBe("/radar");
		},
	);
});

describe("loginUrlForShare", () => {
	it("encodes the radar url as next", () => {
		expect(loginUrlForShare("abc123")).toBe(
			"/login?next=%2Fradar%3Fshare%3Dabc123",
		);
	});
});
