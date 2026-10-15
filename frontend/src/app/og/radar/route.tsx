import { ImageResponse } from "next/og";
import { layoutDots } from "@/lib/og-radar";
import { isPlausibleShareCode } from "@/lib/share-meta";

export const runtime = "nodejs";

const API_BASE = process.env.API_URL || "http://localhost:8080";
const SIZE = 480;
const COLORS = ["#2563eb", "#16a34a", "#d97706", "#db2777"];

async function loadItems(code: string) {
	try {
		const response = await fetch(
			`${API_BASE}/share-codes/${encodeURIComponent(code)}`,
			{ cache: "no-store" },
		);
		if (response.status !== 200) return null;
		const body = (await response.json()) as {
			username?: string;
			radar?: { name: string; quadrant_id: number; ring_id: number }[];
		};
		return {
			username: body.username ?? "",
			radar: Array.isArray(body.radar) ? body.radar : [],
		};
	} catch {
		return null;
	}
}

export async function GET(request: Request) {
	const code = new URL(request.url).searchParams.get("share") ?? "";
	const data = isPlausibleShareCode(code) ? await loadItems(code) : null;
	const dots = data ? layoutDots(data.radar, SIZE) : [];
	const title = data ? `${data.username}'s tech radar` : "Private radar";
	const subtitle = data ? `${data.radar.length} technologies` : "TechRadar";

	return new ImageResponse(
		(
			<div style={{ display: "flex", width: "100%", height: "100%", background: "#0f172a", color: "#f8fafc", alignItems: "center", padding: 60 }}>
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					<div style={{ fontSize: 64, fontWeight: 700 }}>{title}</div>
					<div style={{ fontSize: 36, color: "#94a3b8", marginTop: 16 }}>{subtitle}</div>
				</div>
				<div style={{ display: "flex", position: "relative", width: SIZE, height: SIZE }}>
					{[1, 0.75, 0.5, 0.25].map((scale) => (
						<div
							key={scale}
							style={{
								position: "absolute",
								left: (SIZE * (1 - scale)) / 2,
								top: (SIZE * (1 - scale)) / 2,
								width: SIZE * scale,
								height: SIZE * scale,
								borderRadius: "50%",
								border: "2px solid #334155",
							}}
						/>
					))}
					{dots.map((dot, i) => (
						<div
							key={i}
							style={{
								position: "absolute",
								left: dot.x - 7,
								top: dot.y - 7,
								width: 14,
								height: 14,
								borderRadius: "50%",
								background: COLORS[dot.quadrant - 1],
							}}
						/>
					))}
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
			headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600" },
		},
	);
}
