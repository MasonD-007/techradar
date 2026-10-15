import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ getGallery: vi.fn() }));
vi.mock("@/lib/discovery-actions", () => actions);

// Radix Select needs pointer APIs jsdom lacks; use a native select instead.
vi.mock("@/components/ui/select", () => ({
	Select: ({
		value,
		onValueChange,
		children,
	}: {
		value: string;
		onValueChange: (v: string) => void;
		children: ReactNode;
	}) => (
		<select
			aria-label="Quadrant"
			value={value}
			onChange={(e) => onValueChange(e.target.value)}
		>
			{children}
		</select>
	),
	SelectTrigger: () => null,
	SelectValue: () => null,
	SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
	SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
		<option value={value}>{children}</option>
	),
}));

import Gallery from "./gallery";

const entry = (code: string, username: string) => ({
	code,
	username,
	blip_count: 7,
	top_technologies: ["Go", "React"],
	updated_at: "2026-01-01T00:00:00Z",
});
const ok = (radars: ReturnType<typeof entry>[], has_more = false, page = 1) => ({
	success: true,
	data: { radars, page, has_more },
});

beforeEach(() => {
	actions.getGallery.mockReset();
});

describe("Gallery", () => {
	it("renders a card per radar linking to the share view", async () => {
		actions.getGallery.mockResolvedValue(ok([entry("abc", "alice")]));
		render(<Gallery />);
		expect(await screen.findByText("alice")).toBeInTheDocument();
		expect(screen.getByText("7 technologies")).toBeInTheDocument();
		expect(screen.getByText("Go")).toBeInTheDocument();
		expect(screen.getByText("React")).toBeInTheDocument();
		expect(screen.getByRole("link")).toHaveAttribute("href", "/radar?share=abc");
	});

	it("hides a thumbnail that fails to load", async () => {
		actions.getGallery.mockResolvedValue(ok([entry("abc", "alice")]));
		const { container } = render(<Gallery />);
		await screen.findByText("alice");
		const img = container.querySelector("img") as HTMLImageElement;
		img.dispatchEvent(new Event("error"));
		await waitFor(() => expect(img.style.display).toBe("none"));
	});

	it("renders the empty state", async () => {
		actions.getGallery.mockResolvedValue(ok([]));
		render(<Gallery />);
		expect(
			await screen.findByText("No radars have been shared yet."),
		).toBeInTheDocument();
	});

	it("renders an error and retries", async () => {
		actions.getGallery.mockResolvedValueOnce({ success: false, error: "boom" });
		render(<Gallery />);
		expect(await screen.findByText("boom")).toBeInTheDocument();
		actions.getGallery.mockResolvedValueOnce(ok([entry("abc", "alice")]));
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("alice")).toBeInTheDocument();
		expect(actions.getGallery).toHaveBeenCalledTimes(2);
	});

	it("searches from page 1", async () => {
		actions.getGallery.mockResolvedValue(ok([entry("abc", "alice")]));
		render(<Gallery />);
		await screen.findByText("alice");
		await userEvent.type(screen.getByRole("searchbox"), "go{Enter}");
		await waitFor(() =>
			expect(actions.getGallery).toHaveBeenLastCalledWith({
				q: "go",
				quadrant: undefined,
				page: 1,
			}),
		);
	});

	it("filters by quadrant", async () => {
		actions.getGallery.mockResolvedValue(ok([entry("abc", "alice")]));
		render(<Gallery />);
		await screen.findByText("alice");
		await userEvent.selectOptions(screen.getByLabelText("Quadrant"), "2");
		await waitFor(() =>
			expect(actions.getGallery).toHaveBeenLastCalledWith(
				expect.objectContaining({ quadrant: 2, page: 1 }),
			),
		);
	});

	it("shows Load more only when more pages exist and appends", async () => {
		actions.getGallery.mockResolvedValueOnce(ok([entry("a", "alice")], true));
		render(<Gallery />);
		await screen.findByText("alice");
		actions.getGallery.mockResolvedValueOnce(ok([entry("b", "bob")], false, 2));
		await userEvent.click(screen.getByRole("button", { name: "Load more" }));
		expect(await screen.findByText("bob")).toBeInTheDocument();
		expect(screen.getByText("alice")).toBeInTheDocument();
		expect(actions.getGallery).toHaveBeenLastCalledWith(
			expect.objectContaining({ page: 2 }),
		);
		expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
	});

	it("ignores a late response from an older query", async () => {
		let resolveFirst: (v: unknown) => void = () => {};
		actions.getGallery.mockReturnValueOnce(
			new Promise((r) => {
				resolveFirst = r;
			}),
		);
		actions.getGallery.mockResolvedValueOnce(ok([entry("n", "newer")]));
		render(<Gallery />);
		await userEvent.selectOptions(screen.getByLabelText("Quadrant"), "1");
		expect(await screen.findByText("newer")).toBeInTheDocument();
		resolveFirst(ok([entry("o", "older")]));
		await new Promise((r) => setTimeout(r, 20));
		expect(screen.queryByText("older")).toBeNull();
		expect(screen.getByText("newer")).toBeInTheDocument();
	});
});
