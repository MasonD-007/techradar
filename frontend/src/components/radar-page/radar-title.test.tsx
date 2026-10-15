import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
	getCurrentUserId: vi.fn(),
	getMyShareCode: vi.fn(),
	getRadarGraphByCode: vi.fn(),
	getTechnologiesByUser: vi.fn(),
	getUser: vi.fn(),
}));
vi.mock("@/lib/actions", () => actions);
vi.mock("./share-button", () => ({ default: () => null }));
vi.mock("./copy-radar-button", () => ({
	default: ({ signedIn }: { signedIn: boolean }) => (
		<span>{signedIn ? "Copy to my radar" : "Sign in to copy to your radar"}</span>
	),
}));

import RadarTitle from "./radar-title";

beforeEach(() => {
	for (const fn of Object.values(actions)) fn.mockReset();
	actions.getRadarGraphByCode.mockResolvedValue({ success: true, data: { radar: [] } });
	actions.getTechnologiesByUser.mockResolvedValue({ success: true, data: [] });
	actions.getUser.mockResolvedValue({ success: true, data: { name: "Sam" } });
});

const settle = () => act(async () => {});
const signIn = () => screen.queryByText("Sign in to copy to your radar");
const copy = () => screen.queryByText("Copy to my radar");

describe("RadarTitle copy button", () => {
	it("never shows the sign-in link to the owner, even before resolution", async () => {
		let resolveId: (v: string) => void = () => {};
		actions.getCurrentUserId.mockImplementation(
			() => new Promise((r) => { resolveId = r; }),
		);
		actions.getMyShareCode.mockResolvedValue({ success: true, data: { code: "abc123" } });
		render(<RadarTitle shareCode="abc123" />);
		expect(signIn()).toBeNull();
		expect(copy()).toBeNull();
		await act(async () => resolveId("u1"));
		await settle();
		expect(signIn()).toBeNull();
		expect(copy()).toBeNull();
	});

	it("shows the sign-in link to signed-out viewers after resolution", async () => {
		actions.getCurrentUserId.mockResolvedValue(null);
		render(<RadarTitle shareCode="abc123" />);
		await settle();
		expect(signIn()).not.toBeNull();
		expect(actions.getMyShareCode).not.toHaveBeenCalled();
	});

	it("shows copy to signed-in non-owners", async () => {
		actions.getCurrentUserId.mockResolvedValue("u1");
		actions.getMyShareCode.mockResolvedValue({ success: true, data: { code: "zzz" } });
		render(<RadarTitle shareCode="abc123" />);
		await settle();
		expect(copy()).not.toBeNull();
	});

	it("renders no copy button when ownership is unknown", async () => {
		actions.getCurrentUserId.mockResolvedValue("u1");
		actions.getMyShareCode.mockRejectedValue(new Error("boom"));
		render(<RadarTitle shareCode="abc123" />);
		await settle();
		expect(copy()).toBeNull();
		expect(signIn()).toBeNull();

		actions.getMyShareCode.mockResolvedValue({ success: false, error: "x" });
		render(<RadarTitle shareCode="abc123" />);
		await settle();
		expect(copy()).toBeNull();
	});

	it("does not resolve the viewer without a share code", async () => {
		actions.getCurrentUserId.mockResolvedValue(null);
		render(<RadarTitle shareCode={null} userId="u1" />);
		await settle();
		expect(actions.getMyShareCode).not.toHaveBeenCalled();
		expect(signIn()).toBeNull();
	});
});
