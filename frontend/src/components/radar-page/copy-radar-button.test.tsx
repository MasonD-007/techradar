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
const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const toastMock = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/lib/actions", () => actions);
vi.mock("@/lib/discovery-actions", () => discovery);

import CopyRadarButton from "./copy-radar-button";

beforeEach(() => {
	nav.push.mockReset();
	nav.refresh.mockReset();
	toastMock.success.mockReset();
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

	it("toasts the import counts and navigates without a full reload", async () => {
		actions.getRadarGraphByCode.mockResolvedValue({
			success: true,
			data: {
				radar: [
					{ technology_id: "t1", name: "React", quadrant_id: 1, quadrant_name: "Q", ring_id: 1, ring_name: "Adopt" },
				],
			},
		});
		discovery.importRadar.mockResolvedValue({ success: true, data: { added: 1, skipped: 2 } });
		render(<CopyRadarButton shareCode="abc123" signedIn />);
		await userEvent.click(screen.getByRole("button", { name: "Copy to my radar" }));
		await userEvent.click(await screen.findByRole("button", { name: /^Copy 1/ }));
		await vi.waitFor(() => expect(nav.push).toHaveBeenCalledWith("/radar"));
		expect(toastMock.success).toHaveBeenCalledWith("Added 1, skipped 2");
		expect(nav.refresh).toHaveBeenCalled();
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
