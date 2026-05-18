"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

type QuadrantKey = "techniques" | "tools" | "platforms" | "languages";
type RingKey = "adopt" | "trial" | "assess" | "hold";

export type RadarItem = {
	id: string;
	title: string;
	quadrant: QuadrantKey;
	ring: RingKey;
	description: string;
	status: string;
};

type PositionedRadarItem = RadarItem & {
	x: number;
	y: number;
	quadrantIndex: number;
	ringIndex: number;
	angle: number;
	radius: number;
};

type QuadrantLabel = (typeof quadrantLabels)[number];

const RADAR_SIZE = 1000;
const CENTER = RADAR_SIZE / 2;
const ringLabels: Array<{ key: RingKey; title: string; blurb: string }> = [
	{ key: "adopt", title: "Adopt", blurb: "Stable, production-ready choices" },
	{ key: "trial", title: "Trial", blurb: "Use on active projects" },
	{ key: "assess", title: "Assess", blurb: "Worth evaluating in context" },
	{ key: "hold", title: "Hold", blurb: "Defer until the signal improves" },
];

const quadrantLabels: Array<{
	key: QuadrantKey;
	title: string;
	description: string;
	startAngle: number;
	endAngle: number;
}> = [
	{
		key: "techniques",
		title: "Techniques",
		description: "Implementation patterns, workflows, and delivery practices",
		startAngle: 0,
		endAngle: Math.PI / 2,
	},
	{
		key: "tools",
		title: "Tools",
		description: "Editor workflows, automation, and developer tooling",
		startAngle: Math.PI / 2,
		endAngle: Math.PI,
	},
	{
		key: "platforms",
		title: "Platforms",
		description: "Runtime, infra, and deployment foundations",
		startAngle: Math.PI,
		endAngle: (3 * Math.PI) / 2,
	},
	{
		key: "languages",
		title: "Languages & Frameworks",
		description: "Application stacks and adjacent frameworks",
		startAngle: (3 * Math.PI) / 2,
		endAngle: 2 * Math.PI,
	},
];

const quadrantOrder: QuadrantKey[] = [
	"tools",
	"techniques",
	"platforms",
	"languages",
];
const ringOrder: RingKey[] = ["adopt", "trial", "assess", "hold"];
const outerRadius = 420;
const ringRatios = [0.24, 0.48, 0.74, 1];
const blipRadius = 7;

const radarItems: RadarItem[] = [
	{
		id: "typescript-5",
		title: "TypeScript 5",
		quadrant: "languages",
		ring: "adopt",
		description: "Strong defaults for large app surfaces and shared types.",
		status: "Core",
	},
	{
		id: "nextjs-app-router",
		title: "Next.js App Router",
		quadrant: "languages",
		ring: "trial",
		description: "A good fit for server-first page composition.",
		status: "Current",
	},
	{
		id: "react-server-components",
		title: "React Server Components",
		quadrant: "languages",
		ring: "adopt",
		description: "Keeps data-heavy surfaces thin and responsive.",
		status: "Core",
	},
	{
		id: "tailwindcss-4",
		title: "Tailwind CSS 4",
		quadrant: "languages",
		ring: "trial",
		description: "Fast iteration for layout-heavy product work.",
		status: "Active",
	},
	{
		id: "openapi-codegen",
		title: "OpenAPI code generation",
		quadrant: "tools",
		ring: "trial",
		description: "Keeps the contract between frontend and backend tight.",
		status: "Shared",
	},
	{
		id: "vitest",
		title: "Vitest",
		quadrant: "tools",
		ring: "adopt",
		description: "Fast feedback for component and utility coverage.",
		status: "Core",
	},
	{
		id: "d3-layouts",
		title: "D3 radial layouts",
		quadrant: "tools",
		ring: "adopt",
		description: "Useful when the UI needs precise polar geometry.",
		status: "Core",
	},
	{
		id: "storybook",
		title: "Storybook",
		quadrant: "tools",
		ring: "assess",
		description: "Handy for isolated design review and edge cases.",
		status: "Evaluate",
	},
	{
		id: "postgres-rls",
		title: "PostgreSQL row-level security",
		quadrant: "platforms",
		ring: "adopt",
		description: "Matches the schema-driven ownership model well.",
		status: "Core",
	},
	{
		id: "docker-compose",
		title: "Docker Compose",
		quadrant: "platforms",
		ring: "trial",
		description: "Good local parity for cross-service workflows.",
		status: "Active",
	},
	{
		id: "k3s",
		title: "k3s deployment",
		quadrant: "platforms",
		ring: "assess",
		description: "Solid if lightweight cluster parity is the goal.",
		status: "Infra",
	},
	{
		id: "go-migrations",
		title: "Go migrations",
		quadrant: "platforms",
		ring: "hold",
		description: "Use only when app-level migrations are required.",
		status: "Deferred",
	},
	{
		id: "design-systems",
		title: "Design systems",
		quadrant: "techniques",
		ring: "adopt",
		description: "Shared UI language pays off on wide product surfaces.",
		status: "Core",
	},
	{
		id: "data-contracts",
		title: "Data contracts",
		quadrant: "techniques",
		ring: "trial",
		description: "Keeps backend and frontend changes synchronized.",
		status: "Shared",
	},
	{
		id: "playwright",
		title: "Playwright flows",
		quadrant: "techniques",
		ring: "assess",
		description: "Best used for critical end-to-end journeys only.",
		status: "Evaluate",
	},
	{
		id: "manual-sql",
		title: "Manual SQL edits",
		quadrant: "techniques",
		ring: "hold",
		description: "Avoid unless a schema migration really needs it.",
		status: "Deferred",
	},
];

function hashToUnit(input: string) {
	let hash = 0;
	for (let index = 0; index < input.length; index += 1) {
		hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
	}

	return (hash % 1000) / 1000;
}

function polarToCartesian(angle: number, radius: number) {
	return {
		x: CENTER + Math.sin(angle) * radius,
		y: CENTER - Math.cos(angle) * radius,
	};
}

function polarToRelative(angle: number, radius: number) {
	return {
		x: Math.sin(angle) * radius,
		y: -Math.cos(angle) * radius,
	};
}

function buildPositionedItems(items: RadarItem[]): PositionedRadarItem[] {
	const quadrantMap = new Map(
		quadrantLabels.map((quadrant) => [quadrant.key, quadrant]),
	);
	const quadrantIndexMap = new Map(
		quadrantOrder.map((quadrant, index) => [quadrant, index]),
	);
	const ringIndexMap = new Map(ringOrder.map((ring, index) => [ring, index]));

	return items.map((item) => {
		const quadrant = quadrantMap.get(item.quadrant);
		const quadrantIndex = quadrantIndexMap.get(item.quadrant) ?? 0;
		const ringIndex = ringIndexMap.get(item.ring) ?? 0;

		if (!quadrant) {
			return {
				...item,
				x: CENTER,
				y: CENTER,
				quadrantIndex,
				ringIndex,
				angle: 0,
				radius: 0,
			};
		}

		const quadrantStart = quadrantIndex * (Math.PI / 2);
		const quadrantEnd = quadrantStart + Math.PI / 2;
		const anglePadding = 0.16;
		const radiusStart =
			ringIndex === 0 ? 22 : ringRatios[ringIndex - 1] * outerRadius;
		const radiusEnd = ringRatios[ringIndex] * outerRadius - 18;
		const angle = d3.interpolateNumber(
			quadrantStart + anglePadding,
			quadrantEnd - anglePadding,
		)(hashToUnit(item.id));
		const radius = d3.interpolateNumber(
			radiusStart,
			radiusEnd,
		)(hashToUnit(`${item.id}:${item.ring}`));
		const point = polarToCartesian(angle, radius);

		return {
			...item,
			x: point.x,
			y: point.y,
			quadrantIndex,
			ringIndex,
			angle,
			radius,
		};
	});
}

const positionedItems = buildPositionedItems(radarItems);
const ringPaths = ringLabels.map((ring, index) => ({
	key: ring.key,
	title: ring.title,
	blurb: ring.blurb,
	radius: ringRatios[index] * outerRadius,
}));

const quadrantColor = d3
	.scaleOrdinal<QuadrantKey, string>()
	.domain(quadrantOrder)
	.range([
		"rgba(56, 189, 248, 0.14)",
		"rgba(16, 185, 129, 0.14)",
		"rgba(245, 158, 11, 0.14)",
		"rgba(168, 85, 247, 0.14)",
	]);

const quadrantStroke = d3
	.scaleOrdinal<QuadrantKey, string>()
	.domain(quadrantOrder)
	.range([
		"rgba(56, 189, 248, 0.38)",
		"rgba(16, 185, 129, 0.38)",
		"rgba(245, 158, 11, 0.38)",
		"rgba(168, 85, 247, 0.38)",
	]);

const quadrantArc = d3
	.arc<{ startAngle: number; endAngle: number }>()
	.innerRadius(0)
	.outerRadius(outerRadius);

function Radar() {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [activeItemId, setActiveItemId] = useState(radarItems[0]?.id ?? "");

	useEffect(() => {
		const svgNode = svgRef.current;
		if (!svgNode) {
			return;
		}

		const svg = d3.select(svgNode);
		svg.selectAll("*").remove();

		svg
			.attr("viewBox", `0 0 ${RADAR_SIZE} ${RADAR_SIZE}`)
			.attr("role", "img")
			.attr(
				"aria-label",
				"A four quadrant tech radar with concentric rings showing technology placement and status.",
			)
			.attr("preserveAspectRatio", "xMidYMid meet");

		const defs = svg.append("defs");

		const backgroundGradient = defs
			.append("radialGradient")
			.attr("id", "radar-background-gradient")
			.attr("cx", "50%")
			.attr("cy", "42%")
			.attr("r", "72%");

		backgroundGradient
			.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", "#0f172a");
		backgroundGradient
			.append("stop")
			.attr("offset", "55%")
			.attr("stop-color", "#111827");
		backgroundGradient
			.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "#020617");

		const glowGradient = defs
			.append("radialGradient")
			.attr("id", "radar-glow")
			.attr("cx", "50%")
			.attr("cy", "50%")
			.attr("r", "50%");

		glowGradient
			.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", "rgba(56, 189, 248, 0.18)");
		glowGradient
			.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "rgba(56, 189, 248, 0)");

		defs
			.append("pattern")
			.attr("id", "radar-grid")
			.attr("width", 56)
			.attr("height", 56)
			.attr("patternUnits", "userSpaceOnUse")
			.append("path")
			.attr("d", "M56 0H0V56")
			.attr("fill", "none")
			.attr("stroke", "rgba(148, 163, 184, 0.05)")
			.attr("stroke-width", 1);

		defs
			.append("filter")
			.attr("id", "radar-soft-glow")
			.attr("x", "-30%")
			.attr("y", "-30%")
			.attr("width", "160%")
			.attr("height", "160%")
			.append("feGaussianBlur")
			.attr("stdDeviation", 4);

		svg
			.append("rect")
			.attr("width", RADAR_SIZE)
			.attr("height", RADAR_SIZE)
			.attr("fill", "url(#radar-background-gradient)");
		svg
			.append("rect")
			.attr("width", RADAR_SIZE)
			.attr("height", RADAR_SIZE)
			.attr("fill", "url(#radar-grid)");

		svg
			.append("circle")
			.attr("cx", CENTER)
			.attr("cy", CENTER)
			.attr("r", 240)
			.attr("fill", "url(#radar-glow)");

		const root = svg
			.append("g")
			.attr("transform", `translate(${CENTER},${CENTER})`);

		root
			.append("circle")
			.attr("r", 24)
			.attr("fill", "rgba(2, 6, 23, 0.9)")
			.attr("stroke", "rgba(148, 163, 184, 0.15)")
			.attr("stroke-width", 1.2)
			.attr("filter", "url(#radar-soft-glow)");

		root
			.append("text")
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("fill", "rgba(248, 250, 252, 0.98)")
			.attr("font-size", 11)
			.attr("font-weight", 700)
			.text("Radar");

		const quadrantGroups = root
			.selectAll<
				SVGGElement,
				{
					key: QuadrantKey;
					title: string;
					description: string;
					startAngle: number;
					endAngle: number;
				}
			>("g.quadrant")
			.data(quadrantLabels)
			.join("g")
			.attr("class", "quadrant");

		quadrantGroups
			.append("path")
			.attr(
				"d",
				(d) =>
					quadrantArc({ startAngle: d.startAngle, endAngle: d.endAngle }) ?? "",
			)
			.attr("fill", (d) => quadrantColor(d.key))
			.attr("stroke", (d) => quadrantStroke(d.key))
			.attr("stroke-width", 1.5);

		quadrantGroups
			.append("path")
			.attr(
				"d",
				(d) =>
					quadrantArc({ startAngle: d.startAngle, endAngle: d.endAngle }) ?? "",
			)
			.attr("fill", "none")
			.attr("stroke", "rgba(255,255,255,0.04)")
			.attr("stroke-width", 1);

		root
			.selectAll<
				SVGCircleElement,
				{ key: string; title: string; blurb: string; radius: number }
			>("circle.ring")
			.data(ringPaths)
			.join("circle")
			.attr("class", "ring")
			.attr("r", (radius) => radius.radius)
			.attr("fill", "none")
			.attr("stroke", (_radius, index) =>
				index === ringPaths.length - 1
					? "rgba(226, 232, 240, 0.24)"
					: "rgba(226, 232, 240, 0.16)",
			)
			.attr("stroke-width", (_radius, index) =>
				index === ringPaths.length - 1 ? 2 : 1,
			);

		root
			.selectAll<SVGLineElement, number>("line.divider")
			.data([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
			.join("line")
			.attr("class", "divider")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", (angle) => Math.sin(angle) * outerRadius)
			.attr("y2", (angle) => -Math.cos(angle) * outerRadius)
			.attr("stroke", "rgba(226, 232, 240, 0.18)")
			.attr("stroke-width", 1.3);

		root
			.selectAll<SVGTextElement, QuadrantLabel>("text.quadrant-label")
			.data(quadrantLabels)
			.join("text")
			.attr("class", "quadrant-label")
			.attr("fill", "rgba(248, 250, 252, 0.95)")
			.attr("font-size", 22)
			.attr("font-weight", 800)
			.attr("dominant-baseline", "middle")
			.attr("text-anchor", (d) => {
				const mid = (d.startAngle + d.endAngle) / 2;
				const x = polarToRelative(mid, 1).x;
				if (x > 0.1) return "start";
				if (x < -0.1) return "end";
				return "middle";
			})
			.each(function (d) {
				const mid = (d.startAngle + d.endAngle) / 2;
				const pos = polarToRelative(mid, outerRadius + 36);
				const el = d3.select(this);
				el.attr("x", pos.x).attr("y", pos.y);
				el.selectAll("tspan").remove();
				if (d.key === "languages") {
					el.append("tspan")
						.attr("x", pos.x)
						.attr("dy", "-8")
						.text("Languages &");
					el.append("tspan")
						.attr("x", pos.x)
						.attr("dy", "20")
						.text("Frameworks");
				} else {
					el.append("tspan").attr("x", pos.x).attr("dy", "6").text(d.title);
				}
			});

		// quadrant descriptions are intentionally not rendered — removed per UX request

		root
			.selectAll<
				SVGTextElement,
				{ key: string; title: string; blurb: string; radius: number }
			>("text.ring-label")
			.data(ringPaths)
			.join("text")
			.attr("class", "ring-label")
			.attr("x", 0)
			.attr("y", (d, index) => (index === 0 ? -8 : -d.radius + 16))
			.attr("fill", "rgba(203, 213, 225, 0.82)")
			.attr("font-size", 10)
			.attr("font-weight", 600)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.text((d) => d.title);

		root
			.selectAll<
				SVGTextElement,
				{ key: string; title: string; blurb: string; radius: number }
			>("text.ring-blurb")
			.data(ringPaths)
			.join("text")
			.attr("class", "ring-blurb")
			.attr("x", 0)
			.attr("y", (d, index) => (index === 0 ? 8 : -d.radius + 30))
			.attr("fill", "rgba(148, 163, 184, 0.68)")
			.attr("font-size", 8)
			.attr("font-weight", 500)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.text((d) => d.blurb);

		const blip = root
			.selectAll<SVGGElement, PositionedRadarItem>("g.blip")
			.data(positionedItems)
			.join("g")
			.attr("class", "blip")
			.attr("role", "button")
			.attr("tabindex", 0)
			.attr(
				"aria-label",
				(d: PositionedRadarItem) => `${d.title}, ${d.status}, ${d.description}`,
			)
			.attr(
				"transform",
				(d: PositionedRadarItem) =>
					`translate(${d.x - CENTER},${d.y - CENTER})`,
			)
			.style("cursor", "pointer")
			.on("mouseenter", (_event: MouseEvent, datum: PositionedRadarItem) => {
				setActiveItemId(datum.id);
			})
			.on("focus", (_event: FocusEvent, datum: PositionedRadarItem) => {
				setActiveItemId(datum.id);
			})
			.on("click", (_event: MouseEvent, datum: PositionedRadarItem) => {
				setActiveItemId(datum.id);
			});

		blip
			.append("circle")
			.attr("r", (d: PositionedRadarItem) =>
				d.id === activeItemId ? 11 : blipRadius,
			)
			.attr("fill", (d: PositionedRadarItem) => quadrantStroke(d.quadrant))
			.attr("stroke", "rgba(2, 6, 23, 0.96)")
			.attr("stroke-width", 2);

		blip
			.append("circle")
			.attr("r", (d: PositionedRadarItem) => (d.id === activeItemId ? 16 : 11))
			.attr("fill", "none")
			.attr("stroke", (d: PositionedRadarItem) => quadrantStroke(d.quadrant))
			.attr("stroke-opacity", (d: PositionedRadarItem) =>
				d.id === activeItemId ? 0.9 : 0.48,
			)
			.attr("stroke-width", (d: PositionedRadarItem) =>
				d.id === activeItemId ? 2.5 : 1.2,
			);

		blip
			.append("text")
			.attr("x", 18)
			.attr("y", 4)
			.attr("fill", "rgba(248, 250, 252, 0.96)")
			.attr("font-size", 12)
			.attr("font-weight", (d: PositionedRadarItem) =>
				d.id === activeItemId ? 800 : 600,
			)
			.attr("paint-order", "stroke")
			.attr("stroke", "rgba(2, 6, 23, 0.92)")
			.attr("stroke-width", 3)
			.text((d: PositionedRadarItem) => d.title);

		blip
			.append("title")
			.text(
				(d: PositionedRadarItem) =>
					`${d.title} • ${d.status} • ${d.description}`,
			);
	}, [activeItemId]);

	const quadrantStats = quadrantLabels.map((quadrant) => ({
		...quadrant,
		count: positionedItems.filter((item) => item.quadrant === quadrant.key)
			.length,
	}));

	const ringStats = ringLabels.map((ring) => ({
		...ring,
		count: positionedItems.filter((item) => item.ring === ring.key).length,
	}));

	return (
		<section className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_35%),linear-gradient(180deg,#020617_0%,#030712_55%,#020617_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-5">
				<header className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 px-6 py-5 shadow-2xl shadow-slate-950/40 backdrop-blur">
					<div className="space-y-2">
						{/* <p className="font-semibold text-cyan-300/90 text-xs uppercase tracking-[0.4em]">
							Thoughtworks-inspired radar
						</p> */}
						<h1 className="font-black text-3xl text-white tracking-tight sm:text-4xl">
							Your Tech radar
						</h1>
						{/* <p className="max-w-3xl text-slate-300 text-sm leading-6 sm:text-base">
							Four quadrants, four rings, and a D3 layout that follows the
							reference radar structure while keeping the current colors and
							typography.
						</p> */}
					</div>
					<div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-300 text-xs">
						<span className="h-2 w-2 rounded-full bg-cyan-300" />
						{positionedItems.length} blips
					</div>
				</header>

				<div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_280px]">
					<div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-slate-950/35 backdrop-blur">
						<div className="flex items-center justify-between border-white/5 border-b px-5 py-4">
							<div>
								<p className="font-semibold text-slate-400 text-sm uppercase tracking-[0.3em]">
									Radar canvas
								</p>
								<p className="mt-1 text-slate-300 text-sm">
									Hover or tab a blip to inspect it.
								</p>
							</div>
							<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-slate-300 text-xs">
								SVG + D3 geometry
							</div>
						</div>

						<div className="relative aspect-square w-full">
							<svg ref={svgRef} className="block h-full w-full" />
						</div>
					</div>

					<aside className="grid gap-4 self-start">
						{/* <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-5 shadow-slate-950/30 shadow-xl backdrop-blur">
							<p className="font-semibold text-cyan-300/90 text-xs uppercase tracking-[0.3em]">
								Selected
							</p>
							<h2 className="mt-3 font-bold text-2xl text-white">
								{activeItem?.title}
							</h2>
							<p className="mt-2 text-slate-300 text-sm leading-6">
								{activeItem?.description}
							</p>
							<div className="mt-4 space-y-3 text-sm">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
									<p className="text-[11px] text-slate-400 uppercase tracking-[0.3em]">
										Quadrant
									</p>
									<p className="mt-1 font-semibold text-white">
										{
											quadrantLabels.find(
												(quadrant) => quadrant.key === activeItem?.quadrant,
											)?.title
										}
									</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
									<p className="text-[11px] text-slate-400 uppercase tracking-[0.3em]">
										Ring
									</p>
									<p className="mt-1 font-semibold text-white">
										{
											ringLabels.find((ring) => ring.key === activeItem?.ring)
												?.title
										}
									</p>
								</div>
							</div>
							<div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-slate-300 text-xs">
								Status: {activeItem?.status}
							</div>
						</div> */}

						<div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-5 shadow-slate-950/30 shadow-xl backdrop-blur">
							<p className="font-semibold text-slate-400 text-xs uppercase tracking-[0.3em]">
								Quadrants
							</p>
							<div className="mt-4 space-y-3">
								{quadrantStats.map((quadrant) => (
									<div
										key={quadrant.key}
										className="rounded-2xl border border-white/10 bg-white/5 p-3"
									>
										<div className="flex items-center justify-between gap-3">
											<p className="font-semibold text-white">
												{quadrant.title}
											</p>
											<span className="rounded-full border border-white/10 bg-slate-900/60 px-2 py-1 text-slate-300 text-xs">
												{quadrant.count}
											</span>
										</div>
										<p className="mt-1 text-slate-400 text-sm">
											{quadrant.description}
										</p>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-5 shadow-slate-950/30 shadow-xl backdrop-blur">
							<p className="font-semibold text-slate-400 text-xs uppercase tracking-[0.3em]">
								Rings
							</p>
							<div className="mt-4 space-y-3">
								{ringStats.map((ring) => (
									<div
										key={ring.key}
										className="rounded-2xl border border-white/10 bg-white/5 p-3"
									>
										<div className="flex items-center justify-between gap-3">
											<p className="font-semibold text-white">{ring.title}</p>
											<span className="rounded-full border border-white/10 bg-slate-900/60 px-2 py-1 text-slate-300 text-xs">
												{ring.count}
											</span>
										</div>
										<p className="mt-1 text-slate-400 text-sm">{ring.blurb}</p>
									</div>
								))}
							</div>
						</div>
					</aside>
				</div>
			</div>
		</section>
	);
}

export default Radar;
