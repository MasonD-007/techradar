import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
	getRadarGraphByCode: vi.fn(),
	getMyRadarGraph: vi.fn(),
}));
const discovery = vi.hoisted(() => ({
	getTemplate: vi.fn(),
	importRadar: vi.fn(),
}));
vi.mock("@/lib/actions", () => actions);
vi.mock("@/lib/discovery-actions", () => discovery);

import CopyRadarButton from "./copy-radar-button";

beforeEach(() => {
	for (const fn of [...Object.values(actions), ...Object.values(discovery)])
		fn.mockReset();
	actions.getRadarGraphByCode.mockResolvedValue({
		success: true,
		data: { radar: [] },
	});
	actions.getMyRadarGraph.mockResolvedValue({
		success: true,
		data: { radar: [] },
	});
});

describe("CopyRadarButton", () => {
	it("links signed-out viewers to login", () => {
		render(<CopyRadarButton shareCode="abc123" signedIn={false} />);
		const link = screen.getByRole("link");
		expect(link.getAttribute("href")).toBe("/login?next=%2Fradar%3Fshare%3Dabc123");
	});

	it("opens the dialog for signed-in viewers", async () => {
		render(<CopyRadarButton shareCode="abc123" signedIn />);
		await userEvent.click(screen.getByRole("button", { name: "Copy to my radar" }));
		expect(await screen.findByRole("dialog")).toBeTruthy();
		expect(actions.getRadarGraphByCode).toHaveBeenCalledWith("abc123");
	});

	it("renders nothing on the viewer's own radar", () => {
		const { container } = render(
			<CopyRadarButton shareCode="abc123" signedIn isOwnRadar />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders nothing without a share code", () => {
		const { container } = render(<CopyRadarButton shareCode="" signedIn />);
		expect(container.innerHTML).toBe("");
	});
});
