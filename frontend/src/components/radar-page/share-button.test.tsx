import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
	getMyShareCode: vi.fn(),
	setShareVisibility: vi.fn(),
	setShareListed: vi.fn(),
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

async function settleOwnerCheck() {
	await waitFor(() => expect(actions.getMyShareCode).toHaveBeenCalled());
	await act(async () => {});
}

describe("ShareButton", () => {
	it("shows owner controls for the owner (positive control)", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await settleOwnerCheck();
		expect(screen.getByRole("button", { name: "Public" })).toBeTruthy();
		expect(screen.getByPlaceholderText("Username")).toBeTruthy();
	});

	it("hides owner controls for someone else's radar", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "mine", visibility: "private" },
		});
		render(<ShareButton shareCode="theirs" />);
		await openDialog();
		await settleOwnerCheck();
		expect(screen.queryByRole("button", { name: "Public" })).toBeNull();
		expect(screen.queryByPlaceholderText("Username")).toBeNull();
	});

	it("hides owner controls when logged out", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: false,
			status: 401,
			error: "x",
		});
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await settleOwnerCheck();
		expect(screen.queryByRole("button", { name: "Private" })).toBeNull();
	});

	it("lets the owner switch to public", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		actions.setShareVisibility.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "public" },
		});
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await userEvent.click(
			await screen.findByRole("button", { name: "Public" }),
		);
		expect(actions.setShareVisibility).toHaveBeenCalledWith("public");
		await waitFor(() =>
			expect(screen.queryByPlaceholderText("Username")).toBeNull(),
		);
	});

	it("ignores toggle clicks while a visibility change is pending", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		let resolveFirst: (v: unknown) => void = () => {};
		actions.setShareVisibility.mockImplementationOnce(
			() => new Promise((resolve) => { resolveFirst = resolve; }),
		);
		actions.setShareVisibility.mockResolvedValue({ success: true });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await settleOwnerCheck();

		await userEvent.click(screen.getByRole("button", { name: "Public" }));
		expect(actions.setShareVisibility).toHaveBeenCalledTimes(1);

		await userEvent.click(screen.getByRole("button", { name: "Private" }));
		expect(actions.setShareVisibility).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveFirst({ success: true });
		});
		await waitFor(() =>
			expect(screen.queryByPlaceholderText("Username")).toBeNull(),
		);

		await userEvent.click(screen.getByRole("button", { name: "Private" }));
		expect(actions.setShareVisibility).toHaveBeenCalledTimes(2);
		expect(actions.setShareVisibility).toHaveBeenLastCalledWith("private");
	});

	it("adds and removes viewers in private mode", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
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
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		actions.addShareViewer.mockResolvedValue({
			success: false,
			error: "User not found",
		});
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await userEvent.type(
			await screen.findByPlaceholderText("Username"),
			"ghost",
		);
		await userEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(await screen.findByText("User not found")).toBeTruthy();
	});

	it("drops owner state when reopened for a different share code", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers.mockResolvedValue({ success: true, data: ["bob"] });
		const { rerender } = render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await screen.findByText("bob");
		await userEvent.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByPlaceholderText("Username")).toBeNull(),
		);

		let release: (v: unknown) => void = () => {};
		actions.getMyShareCode.mockReturnValue(
			new Promise((r) => {
				release = r;
			}),
		);
		rerender(<ShareButton shareCode="other" />);
		await openDialog();
		await act(async () => {});
		expect(screen.queryByPlaceholderText("Username")).toBeNull();
		expect(screen.queryByText("bob")).toBeNull();
		await act(async () => {
			release({ success: true, data: { code: "mine", visibility: "private" } });
		});
		expect(screen.queryByPlaceholderText("Username")).toBeNull();
	});

	it("is not owner when getMyShareCode rejects on reopen", async () => {
		actions.getMyShareCode.mockResolvedValueOnce({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await screen.findByPlaceholderText("Username");
		await userEvent.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByPlaceholderText("Username")).toBeNull(),
		);
		actions.getMyShareCode.mockRejectedValue(new Error("boom"));
		await openDialog();
		await act(async () => {});
		expect(screen.queryByPlaceholderText("Username")).toBeNull();
	});

	it("shows an error when refreshing viewers fails after add", async () => {
		actions.getMyShareCode.mockResolvedValue({
			success: true,
			data: { code: "abc123", visibility: "private" },
		});
		actions.getShareViewers
			.mockResolvedValueOnce({ success: true, data: [] })
			.mockResolvedValueOnce({
				success: false,
				error: "Viewer list unavailable",
			});
		actions.addShareViewer.mockResolvedValue({ success: true });
		render(<ShareButton shareCode="abc123" />);
		await openDialog();
		await userEvent.type(
			await screen.findByPlaceholderText("Username"),
			"carol",
		);
		await userEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(await screen.findByText("Viewer list unavailable")).toBeTruthy();
	});

	describe("List in gallery", () => {
		async function openOwner(visibility: string, listed: boolean) {
			actions.getMyShareCode.mockResolvedValue({
				success: true,
				data: { code: "abc123", visibility, listed },
			});
			actions.getShareViewers.mockResolvedValue({ success: true, data: [] });
			render(<ShareButton shareCode="abc123" />);
			await openDialog();
			await settleOwnerCheck();
		}

		it("shows an unchecked checkbox for a public unlisted radar", async () => {
			await openOwner("public", false);
			const box = screen.getByLabelText("List in gallery") as HTMLInputElement;
			expect(box.checked).toBe(false);
		});

		it("shows a checked checkbox for a public listed radar", async () => {
			await openOwner("public", true);
			const box = screen.getByLabelText("List in gallery") as HTMLInputElement;
			expect(box.checked).toBe(true);
		});

		it("does not render the checkbox for a private radar", async () => {
			await openOwner("private", false);
			expect(screen.queryByLabelText("List in gallery")).toBeNull();
		});

		it("does not render the checkbox for a non-owner", async () => {
			actions.getMyShareCode.mockResolvedValue({
				success: true,
				data: { code: "mine", visibility: "public", listed: true },
			});
			render(<ShareButton shareCode="theirs" />);
			await openDialog();
			await settleOwnerCheck();
			expect(screen.queryByLabelText("List in gallery")).toBeNull();
		});

		it("lists the radar when ticked", async () => {
			await openOwner("public", false);
			actions.setShareListed.mockResolvedValue({ success: true });
			await userEvent.click(screen.getByLabelText("List in gallery"));
			expect(actions.setShareListed).toHaveBeenCalledWith(true);
			await waitFor(() =>
				expect(
					(screen.getByLabelText("List in gallery") as HTMLInputElement)
						.checked,
				).toBe(true),
			);
		});

		it("leaves the checkbox unchanged and shows the error on failure", async () => {
			await openOwner("public", false);
			actions.setShareListed.mockResolvedValue({
				success: false,
				error: "boom",
			});
			await userEvent.click(screen.getByLabelText("List in gallery"));
			expect(await screen.findByText("boom")).toBeTruthy();
			expect(
				(screen.getByLabelText("List in gallery") as HTMLInputElement).checked,
			).toBe(false);
		});

		it("resets when switching to private and back to public", async () => {
			await openOwner("public", true);
			actions.setShareVisibility.mockResolvedValue({ success: true });
			await userEvent.click(screen.getByRole("button", { name: "Private" }));
			await waitFor(() =>
				expect(screen.queryByLabelText("List in gallery")).toBeNull(),
			);
			await userEvent.click(screen.getByRole("button", { name: "Public" }));
			const box = (await screen.findByLabelText(
				"List in gallery",
			)) as HTMLInputElement;
			expect(box.checked).toBe(false);
		});

		it("disables the checkbox while a request is pending", async () => {
			await openOwner("public", false);
			let resolve: (v: unknown) => void = () => {};
			actions.setShareListed.mockImplementation(
				() => new Promise((r) => { resolve = r; }),
			);
			await userEvent.click(screen.getByLabelText("List in gallery"));
			expect(
				(screen.getByLabelText("List in gallery") as HTMLInputElement).disabled,
			).toBe(true);
			await act(async () => {
				resolve({ success: true });
			});
			expect(
				(screen.getByLabelText("List in gallery") as HTMLInputElement).disabled,
			).toBe(false);
		});
	});
});
