import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
	getMyShareCode: vi.fn(),
	setShareVisibility: vi.fn(),
	getShareViewers: vi.fn(),
	addShareViewer: vi.fn(),
	removeShareViewer: vi.fn(),
}));
vi.mock("@/lib/actions", () => actions);

import ShareButton from "./share-button";

beforeEach(() => {
	Object.values(actions).forEach((fn) => fn.mockReset());
});

async function openDialog() {
	await userEvent.click(screen.getByLabelText("Share tech radar"));
}

describe("ShareButton", () => {
	it("hides owner controls for someone else's radar", async () => {
		actions.getMyShareCode.mockResolvedValue({ success: true, data: { code: "mine", visibility: "private" } });
		render(<ShareButton shareCode="theirs" />);
		await openDialog();
		await screen.findByText("Share code");
		expect(screen.queryByRole("button", { name: "Public" })).toBeNull();
		expect(screen.queryByPlaceholderText("Username")).toBeNull();
	});

	it("hides owner controls when logged out", async () => {
		actions.getMyShareCode.mockResolvedValue({ success: false, status: 401, error: "x" });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await screen.findByText("Share code");
		expect(screen.queryByRole("button", { name: "Private" })).toBeNull();
	});

	it("lets the owner switch to public", async () => {
		actions.getMyShareCode.mockResolvedValue({ success: true, data: { code: "abc123", visibility: "private" } });
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		actions.setShareVisibility.mockResolvedValue({ success: true, data: { code: "abc123", visibility: "public" } });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await userEvent.click(await screen.findByRole("button", { name: "Public" }));
		expect(actions.setShareVisibility).toHaveBeenCalledWith("public");
		await waitFor(() => expect(screen.queryByPlaceholderText("Username")).toBeNull());
	});

	it("adds and removes viewers in private mode", async () => {
		actions.getMyShareCode.mockResolvedValue({ success: true, data: { code: "abc123", visibility: "private" } });
		actions.getShareViewers
			.mockResolvedValueOnce({ success: true, data: ["bob"] })
			.mockResolvedValueOnce({ success: true, data: ["bob", "carol"] })
			.mockResolvedValueOnce({ success: true, data: ["carol"] });
		actions.addShareViewer.mockResolvedValue({ success: true });
		actions.removeShareViewer.mockResolvedValue({ success: true });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();

		await screen.findByText("bob");
		await userEvent.type(screen.getByPlaceholderText("Username"), "carol");
		await userEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(actions.addShareViewer).toHaveBeenCalledWith("carol");
		await screen.findByText("carol");

		await userEvent.click(screen.getByRole("button", { name: "Remove bob" }));
		expect(actions.removeShareViewer).toHaveBeenCalledWith("bob");
		await waitFor(() => expect(screen.queryByText("bob")).toBeNull());
	});

	it("shows the backend error when adding fails", async () => {
		actions.getMyShareCode.mockResolvedValue({ success: true, data: { code: "abc123", visibility: "private" } });
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		actions.addShareViewer.mockResolvedValue({ success: false, error: "User not found" });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await userEvent.type(await screen.findByPlaceholderText("Username"), "ghost");
		await userEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(await screen.findByText("User not found")).toBeTruthy();
	});
});
