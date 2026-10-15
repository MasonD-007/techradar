import type { Metadata } from "next";

const API_BASE = process.env.API_URL || "http://localhost:8080";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const MAX_SHARE_CODE_LENGTH = 64;

export type ShareSummary = {
	username: string;
	count: number;
	top: string[];
} | null;

export function isPlausibleShareCode(code: string | undefined): code is string {
	return !!code && code.length <= MAX_SHARE_CODE_LENGTH;
}

// Anonymous fetch: only radars viewable without credentials return 200.
export async function fetchPublicShareSummary(code: string): Promise<ShareSummary> {
	if (!isPlausibleShareCode(code)) return null;
	try {
		const response = await fetch(
			`${API_BASE}/share-codes/${encodeURIComponent(code)}`,
			{ cache: "no-store", signal: AbortSignal.timeout(3000) },
		);
		if (response.status !== 200) return null;
		const body = (await response.json()) as {
			username?: string;
			radar?: { name: string }[];
		};
		const radar = Array.isArray(body.radar) ? body.radar : [];
		return {
			username: body.username ?? "Someone",
			count: radar.length,
			top: radar.slice(0, 3).map((item) => item.name),
		};
	} catch {
		return null;
	}
}

export function buildShareMetadata(
	code: string | undefined,
	summary: ShareSummary,
): Metadata {
	if (!code) return { title: "TechRadar" };
	if (!isPlausibleShareCode(code) || !summary) {
		const genericImage = `${SITE_URL}/og/radar`;
		return {
			title: "Private radar | TechRadar",
			description: "This radar is private or no longer available.",
			openGraph: {
				title: "Private radar | TechRadar",
				images: [{ url: genericImage, width: 1200, height: 630 }],
			},
			twitter: { card: "summary_large_image" },
		};
	}
	const image = `${SITE_URL}/og/radar?share=${encodeURIComponent(code)}`;
	const title = `${summary.username}'s tech radar | TechRadar`;
	const description =
		summary.count === 0
			? "No technologies yet."
			: `${summary.count} ${summary.count === 1 ? "technology" : "technologies"}${summary.top.length ? `, including ${summary.top.join(", ")}` : ""}.`;
	return {
		title,
		description,
		openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
		twitter: { card: "summary_large_image", title, description },
	};
}
