import { act, render, screen, waitFor } from "@testing-library/react";
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

import ImportDialog from "./import-dialog";

const item = (id: string, name: string, ring: string) => ({
	technology_id: id,
	name,
	quadrant_id: 1,
	quadrant_name: "Tools",
	ring_id: 1,
	ring_name: ring,
});

const items = [
	item("t1", "React", "Adopt"),
	item("t2", "Go", "Trial"),
	item("t3", "Rust", "Assess"),
];

beforeEach(() => {
	for (const fn of [
		...Object.values(actions),
		...Object.values(discovery),
	])
		fn.mockReset();
	actions.getRadarGraphByCode.mockResolvedValue({
		success: true,
		data: { radar: items },
	});
	actions.getMyRadarGraph.mockResolvedValue({
		success: true,
		data: { radar: [item("t2", "Go", "Trial")] },
	});
});

function setup(
	source: { shareCode: string } | { templateSlug: string } = {
		shareCode: "abc123",
	},
) {
	const onOpenChange = vi.fn();
	const onImported = vi.fn();
	render(
		<ImportDialog
			open
			onOpenChange={onOpenChange}
			source={source}
			onImported={onImported}
		/>,
	);
	return { onOpenChange, onImported };
}

describe("ImportDialog", () => {
	it("lists technologies with rings and marks owned ones", async () => {
		setup();
		await screen.findByText("React");
		expect(screen.getByText("Adopt")).toBeTruthy();
		expect(screen.getByText("Assess")).toBeTruthy();
		await waitFor(() =>
			expect(screen.getByText("already on your radar")).toBeTruthy(),
		);
		const go = screen.getByLabelText("Go") as HTMLInputElement;
		expect(go.checked).toBe(false);
		expect(go.disabled).toBe(true);
		expect((screen.getByLabelText("React") as HTMLInputElement).checked).toBe(
			true,
		);
		expect((screen.getByLabelText("Rust") as HTMLInputElement).checked).toBe(
			true,
		);
	});

	it("shows the selected count and toggles select none/all", async () => {
		setup();
		await screen.findByText("2 selected");
		await userEvent.click(screen.getByLabelText("React"));
		expect(screen.getByText("1 selected")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Select none" }));
		expect(screen.getByText("0 selected")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Select all" }));
		expect(screen.getByText("2 selected")).toBeTruthy();
		expect((screen.getByLabelText("Go") as HTMLInputElement).checked).toBe(
			false,
		);
	});

	it("shows an empty state for a source with no technologies", async () => {
		actions.getRadarGraphByCode.mockResolvedValue({
			success: true,
			data: { radar: [] },
		});
		setup();
		expect(
			await screen.findByText("This radar has no technologies yet."),
		).toBeTruthy();
		expect(screen.queryByText("0 selected")).toBeNull();
		const confirm = screen.getByRole("button", { name: /^Copy 0/ });
		expect((confirm as HTMLButtonElement).disabled).toBe(true);
	});

	it("disables confirm when nothing is selected", async () => {
		setup();
		await screen.findByText("2 selected");
		await userEvent.click(screen.getByRole("button", { name: "Select none" }));
		const confirm = screen.getByRole("button", { name: /^Copy 0/ });
		expect((confirm as HTMLButtonElement).disabled).toBe(true);
	});

	it("imports checked ids, reports and closes", async () => {
		discovery.importRadar.mockResolvedValue({
			success: true,
			data: { added: 2, skipped: 0 },
		});
		const { onOpenChange, onImported } = setup();
		await screen.findByText("2 selected");
		await userEvent.click(screen.getByLabelText("Rust"));
		await userEvent.click(screen.getByRole("button", { name: /^Copy 1/ }));
		expect(discovery.importRadar).toHaveBeenCalledWith({ shareCode: "abc123" }, [
			"t1",
		]);
		await waitFor(() =>
			expect(onImported).toHaveBeenCalledWith({ added: 2, skipped: 0 }),
		);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("loads a template source", async () => {
		discovery.getTemplate.mockResolvedValue({
			success: true,
			data: { slug: "web", radar: items },
		});
		discovery.importRadar.mockResolvedValue({
			success: true,
			data: { added: 2, skipped: 0 },
		});
		setup({ templateSlug: "web" });
		await screen.findByText("2 selected");
		expect(discovery.getTemplate).toHaveBeenCalledWith("web");
		expect(actions.getRadarGraphByCode).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: /^Copy 2/ }));
		expect(discovery.importRadar).toHaveBeenCalledWith({ templateSlug: "web" }, [
			"t1",
			"t3",
		]);
	});

	it("treats a failed own-radar load as empty", async () => {
		actions.getMyRadarGraph.mockResolvedValue({ success: false, error: "x" });
		setup();
		await screen.findByText("3 selected");
	});

	it("shows an error when loading fails", async () => {
		actions.getRadarGraphByCode.mockResolvedValue({
			success: false,
			error: "Sign in to view this radar",
		});
		setup();
		expect(await screen.findByText("Sign in to view this radar")).toBeTruthy();
	});

	it("keeps the dialog open on import failure and retries", async () => {
		discovery.importRadar.mockResolvedValueOnce({
			success: false,
			error: "boom",
		});
		discovery.importRadar.mockResolvedValueOnce({
			success: true,
			data: { added: 2, skipped: 0 },
		});
		const { onOpenChange, onImported } = setup();
		await screen.findByText("2 selected");
		await userEvent.click(screen.getByRole("button", { name: /^Copy 2/ }));
		expect(await screen.findByText("boom")).toBeTruthy();
		expect(onOpenChange).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(discovery.importRadar).toHaveBeenCalledTimes(2);
		await waitFor(() => expect(onImported).toHaveBeenCalled());
	});

	it("blocks double submit while importing", async () => {
		let resolve: (v: unknown) => void = () => {};
		discovery.importRadar.mockImplementation(
			() => new Promise((r) => { resolve = r; }),
		);
		setup();
		await screen.findByText("2 selected");
		const confirm = screen.getByRole("button", { name: /^Copy 2/ });
		await userEvent.click(confirm);
		expect((confirm as HTMLButtonElement).disabled).toBe(true);
		await userEvent.click(confirm);
		expect(discovery.importRadar).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolve({ success: true, data: { added: 2, skipped: 0 } });
		});
	});

	it("ignores close requests while importing", async () => {
		let resolve: (v: unknown) => void = () => {};
		discovery.importRadar.mockImplementation(
			() => new Promise((r) => { resolve = r; }),
		);
		const { onOpenChange, onImported } = setup();
		await screen.findByText("2 selected");
		await userEvent.click(screen.getByRole("button", { name: /^Copy 2/ }));
		await userEvent.keyboard("{Escape}");
		expect(onOpenChange).not.toHaveBeenCalled();
		await act(async () => {
			resolve({ success: true, data: { added: 2, skipped: 0 } });
		});
		expect(onImported).toHaveBeenCalledWith({ added: 2, skipped: 0 });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
