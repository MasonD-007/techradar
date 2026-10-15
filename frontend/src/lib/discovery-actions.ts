"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, apiFetch, readError } from "./api-fetch";

export type GalleryEntry = {
	code: string;
	username: string;
	blip_count: number;
	top_technologies: string[];
	updated_at: string;
};
export type GalleryPage = {
	radars: GalleryEntry[];
	page: number;
	has_more: boolean;
};
export type TemplateSummary = {
	slug: string;
	name: string;
	description: string;
	technology_count: number;
};
export type ImportItem = {
	technology_id: string;
	name: string;
	quadrant_id: number;
	quadrant_name: string;
	ring_id: number;
	ring_name: string;
	icon_url?: string;
	description?: string;
};
export type TemplateDetail = {
	slug: string;
	name: string;
	description: string;
	radar: ImportItem[];
};
export type ImportSourceArg = { shareCode: string } | { templateSlug: string };
export type TemplateInput = {
	slug: string;
	name: string;
	description: string;
	items: { technology_id: string; ring_id: number }[];
};

async function getJson<T>(
	path: string,
	fallback: string,
): Promise<ActionResult<T>> {
	try {
		const response = await apiFetch(path);
		if (!response.ok) {
			return { success: false, status: response.status, error: fallback };
		}
		return { success: true, data: (await response.json()) as T };
	} catch {
		return { success: false, error: fallback };
	}
}

export async function getGallery(params: {
	q?: string;
	quadrant?: number;
	page?: number;
}): Promise<ActionResult<GalleryPage>> {
	const search = new URLSearchParams();
	if (params.q) search.set("q", params.q);
	if (params.quadrant) search.set("quadrant", String(params.quadrant));
	if (params.page && params.page > 1) search.set("page", String(params.page));
	const qs = search.toString();
	return getJson<GalleryPage>(
		`/gallery${qs ? `?${qs}` : ""}`,
		"Failed to load gallery",
	);
}

export async function getTemplates(): Promise<ActionResult<TemplateSummary[]>> {
	return getJson<TemplateSummary[]>("/templates", "Failed to load templates");
}

export async function getTemplate(
	slug: string,
): Promise<ActionResult<TemplateDetail>> {
	return getJson<TemplateDetail>(
		`/templates/${encodeURIComponent(slug)}`,
		"Failed to load template",
	);
}

export async function importRadar(
	source: ImportSourceArg,
	technologyIds?: string[],
): Promise<ActionResult<{ added: number; skipped: number }>> {
	try {
		const body: Record<string, unknown> = { source };
		if (technologyIds) body.technologyIds = technologyIds;
		const response = await apiFetch("/radar/import", {
			method: "POST",
			body: JSON.stringify(body),
		});
		if (!response.ok) {
			const error =
				response.status === 401
					? "Sign in to copy technologies"
					: response.status === 404
						? "Radar not found or not shared with you"
						: await readError(response, "Failed to copy technologies");
			return { success: false, status: response.status, error };
		}
		revalidatePath("/radar");
		return { success: true, data: await response.json() };
	} catch {
		return { success: false, error: "Failed to copy technologies" };
	}
}

async function sendTemplate(
	method: "POST" | "PUT",
	path: string,
	input: TemplateInput,
	fallback: string,
): Promise<ActionResult> {
	try {
		const response = await apiFetch(path, {
			method,
			body: JSON.stringify(input),
		});
		if (!response.ok) {
			return {
				success: false,
				status: response.status,
				error: await readError(response, fallback),
			};
		}
		return { success: true };
	} catch {
		return { success: false, error: fallback };
	}
}

export async function createTemplate(
	input: TemplateInput,
): Promise<ActionResult> {
	return sendTemplate("POST", "/templates", input, "Failed to create template");
}

export async function updateTemplate(
	input: TemplateInput,
): Promise<ActionResult> {
	return sendTemplate(
		"PUT",
		`/templates/${encodeURIComponent(input.slug)}`,
		input,
		"Failed to update template",
	);
}

export async function deleteTemplate(slug: string): Promise<ActionResult> {
	try {
		const response = await apiFetch(`/templates/${encodeURIComponent(slug)}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			return {
				success: false,
				status: response.status,
				error: await readError(response, "Failed to delete template"),
			};
		}
		return { success: true };
	} catch {
		return { success: false, error: "Failed to delete template" };
	}
}
