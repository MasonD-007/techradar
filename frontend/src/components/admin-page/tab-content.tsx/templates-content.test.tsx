import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ getTechnologies: vi.fn() }));
const discovery = vi.hoisted(() => ({
	getTemplates: vi.fn(),
	getTemplate: vi.fn(),
	createTemplate: vi.fn(),
	updateTemplate: vi.fn(),
	deleteTemplate: vi.fn(),
}));
vi.mock("@/lib/actions", () => actions);
vi.mock("@/lib/discovery-actions", () => discovery);

import { Tabs } from "@/components/ui/tabs";
import TemplatesContent from "./templates-content";

const summary = {
	slug: "web",
	name: "Web Starter",
	description: "Web stack",
	technology_count: 2,
};

function setup() {
	return render(
		<Tabs defaultValue="templates">
			<TemplatesContent />
		</Tabs>,
	);
}

async function addTech(name: string, ring: string) {
	await userEvent.selectOptions(screen.getByLabelText("Technology"), name);
	await userEvent.selectOptions(screen.getByLabelText("Ring"), ring);
	await userEvent.click(screen.getByRole("button", { name: "Add" }));
}

beforeEach(() => {
	for (const fn of [...Object.values(actions), ...Object.values(discovery)])
		fn.mockReset();
	actions.getTechnologies.mockResolvedValue({
		success: true,
		data: [
			{ id: "t1", name: "React", quadrant_id: 1 },
			{ id: "t2", name: "Go", quadrant_id: 4 },
		],
	});
	discovery.getTemplates.mockResolvedValue({ success: true, data: [summary] });
});

describe("TemplatesContent", () => {
	it("lists templates with name, slug and count", async () => {
		setup();
		expect(await screen.findByText("Web Starter")).toBeTruthy();
		expect(screen.getByText("web")).toBeTruthy();
		expect(screen.getByText("2")).toBeTruthy();
	});

	it("shows the empty state", async () => {
		discovery.getTemplates.mockResolvedValue({ success: true, data: [] });
		setup();
		expect(await screen.findByText("No templates yet.")).toBeTruthy();
	});

	it("validates name and slug before creating", async () => {
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "New template" }));
		await userEvent.type(screen.getByLabelText(/Slug/), "Bad Slug");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(screen.getByText("Name is required")).toBeTruthy();
		expect(screen.getByText(/lowercase letters, numbers and hyphens/)).toBeTruthy();
		expect(discovery.createTemplate).not.toHaveBeenCalled();
	});

	it("creates a template with items and refreshes", async () => {
		discovery.createTemplate.mockResolvedValue({ success: true });
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "New template" }));
		await userEvent.type(screen.getByLabelText(/Slug/), "my-tpl");
		await userEvent.type(screen.getByLabelText(/Name/), "My Tpl");
		await userEvent.type(screen.getByLabelText(/Description/), "Desc");
		await addTech("React", "1");
		await addTech("Go", "3");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(discovery.createTemplate).toHaveBeenCalledWith({
			slug: "my-tpl",
			name: "My Tpl",
			description: "Desc",
			items: [
				{ technology_id: "t1", ring_id: 1 },
				{ technology_id: "t2", ring_id: 3 },
			],
		});
		await vi.waitFor(() =>
			expect(discovery.getTemplates).toHaveBeenCalledTimes(2),
		);
	});

	it("does not add duplicate technologies", async () => {
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "New template" }));
		await addTech("React", "1");
		await addTech("React", "2");
		expect(screen.getAllByRole("button", { name: "Remove React" })).toHaveLength(1);
	});

	it("shows a duplicate slug message on 409", async () => {
		discovery.createTemplate.mockResolvedValue({
			success: false,
			status: 409,
			error: "conflict",
		});
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "New template" }));
		await userEvent.type(screen.getByLabelText(/Slug/), "web");
		await userEvent.type(screen.getByLabelText(/Name/), "Web");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(
			await screen.findByText("A template with that slug already exists"),
		).toBeTruthy();
	});

	it("shows the server error text otherwise", async () => {
		discovery.createTemplate.mockResolvedValue({
			success: false,
			status: 400,
			error: "too many technologies",
		});
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "New template" }));
		await userEvent.type(screen.getByLabelText(/Slug/), "web");
		await userEvent.type(screen.getByLabelText(/Name/), "Web");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(await screen.findByText("too many technologies")).toBeTruthy();
	});

	it("edits a template with a disabled slug", async () => {
		discovery.getTemplate.mockResolvedValue({
			success: true,
			data: {
				slug: "web",
				name: "Web Starter",
				description: "Web stack",
				radar: [
					{ technology_id: "t1", name: "React", quadrant_id: 1, quadrant_name: "Q", ring_id: 2, ring_name: "Trial" },
				],
			},
		});
		discovery.updateTemplate.mockResolvedValue({ success: true });
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "Edit Web Starter" }));
		const slug = (await screen.findByLabelText(/Slug/)) as HTMLInputElement;
		expect(slug.disabled).toBe(true);
		expect(slug.value).toBe("web");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(discovery.getTemplate).toHaveBeenCalledWith("web");
		expect(discovery.updateTemplate).toHaveBeenCalledWith({
			slug: "web",
			name: "Web Starter",
			description: "Web stack",
			items: [{ technology_id: "t1", ring_id: 2 }],
		});
	});

	it("deletes only after confirmation", async () => {
		discovery.deleteTemplate.mockResolvedValue({ success: true });
		setup();
		await userEvent.click(await screen.findByRole("button", { name: "Delete Web Starter" }));
		expect(discovery.deleteTemplate).not.toHaveBeenCalled();
		const dialog = await screen.findByRole("alertdialog");
		await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
		expect(discovery.deleteTemplate).toHaveBeenCalledWith("web");
	});
});
