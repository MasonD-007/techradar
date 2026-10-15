import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
	getRadarGraphByCode: vi.fn(),
	getMyRadarGraph: vi.fn(),
}));
const discovery = vi.hoisted(() => ({
	getTemplates: vi.fn(),
	getTemplate: vi.fn(),
	importRadar: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/lib/actions", () => actions);
vi.mock("@/lib/discovery-actions", () => discovery);

import TemplatePicker from "./template-picker";

beforeEach(() => {
	toastMock.success.mockReset();
	for (const fn of [...Object.values(actions), ...Object.values(discovery)])
		fn.mockReset();
	actions.getMyRadarGraph.mockResolvedValue({ success: true, data: { radar: [] } });
});

describe("TemplatePicker", () => {
	it("lists templates and imports after preview", async () => {
		discovery.getTemplates.mockResolvedValue({
			success: true,
			data: [
				{ slug: "web", name: "Web", description: "Web stack", technology_count: 3 },
			],
		});
		discovery.getTemplate.mockResolvedValue({
			success: true,
			data: {
				slug: "web",
				radar: [
					{ technology_id: "t1", name: "React", quadrant_id: 1, quadrant_name: "Q", ring_id: 1, ring_name: "Adopt" },
				],
			},
		});
		discovery.importRadar.mockResolvedValue({ success: true, data: { added: 1, skipped: 3 } });
		const onDone = vi.fn();
		render(<TemplatePicker onDone={onDone} />);
		expect(await screen.findByText("Web stack")).toBeTruthy();
		expect(screen.getByText("3 technologies")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Preview" }));
		await userEvent.click(await screen.findByRole("button", { name: /^Copy 1/ }));
		expect(discovery.importRadar).toHaveBeenCalledWith({ templateSlug: "web" }, ["t1"]);
		await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
		expect(toastMock.success).toHaveBeenCalledWith("Added 1, skipped 3");
	});

	it("renders nothing when there are no templates", async () => {
		discovery.getTemplates.mockResolvedValue({ success: true, data: [] });
		const { container } = render(<TemplatePicker onDone={() => {}} />);
		await vi.waitFor(() => expect(discovery.getTemplates).toHaveBeenCalled());
		await new Promise((r) => setTimeout(r, 0));
		expect(container.innerHTML).toBe("");
	});

	it("shows an error when templates fail to load", async () => {
		discovery.getTemplates.mockResolvedValue({ success: false, error: "x" });
		render(<TemplatePicker onDone={() => {}} />);
		expect(await screen.findByText("Couldn't load templates")).toBeTruthy();
	});
});
