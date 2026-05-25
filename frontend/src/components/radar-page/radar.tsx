"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getCurrentUserId,
	getTechnologies,
	getTechnologiesByUser,
	type Technology,
} from "@/lib/actions";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import {
	blipRadius,
	CENTER,
	outerRadius,
	polarToRelative,
	type QuadrantKey,
	type QuadrantLabel,
	quadrantLabels,
	RADAR_SIZE,
	ringPaths,
} from "./radar-data";
import SearchTechnologiesDialog from "./search-technologies/search-technologies-dialog";

type RadarTechnology = {
	id: string;
	title: string;
};

type PositionedRadarTechnology = RadarTechnology & {
	x: number;
	y: number;
	angle: number;
	radius: number;
	colorKey: QuadrantKey;
};

const blipColorKeys: QuadrantKey[] = [
	"tools",
	"techniques",
	"platforms",
	"languages",
];

// D3 Color scales
const quadrantColor = d3
	.scaleOrdinal<QuadrantKey, string>()
	.domain(["tools", "techniques", "platforms", "languages"])
	.range([
		"color-mix(in oklab, var(--chart-1) 18%, transparent)",
		"color-mix(in oklab, var(--chart-2) 18%, transparent)",
		"color-mix(in oklab, var(--chart-3) 18%, transparent)",
		"color-mix(in oklab, var(--primary) 18%, transparent)",
	]);

const quadrantStroke = d3
	.scaleOrdinal<QuadrantKey, string>()
	.domain(["tools", "techniques", "platforms", "languages"])
	.range([
		"color-mix(in oklab, var(--chart-1) 40%, transparent)",
		"color-mix(in oklab, var(--chart-2) 40%, transparent)",
		"color-mix(in oklab, var(--chart-3) 40%, transparent)",
		"color-mix(in oklab, var(--primary) 40%, transparent)",
	]);

const quadrantArc = d3
	.arc<{ startAngle: number; endAngle: number }>()
	.innerRadius(0)
	.outerRadius(outerRadius);

function buildRandomPositionedTechnologies(
	technologies: RadarTechnology[],
): PositionedRadarTechnology[] {
	const minRadius = 72;
	const maxRadius = outerRadius - 36;

	return technologies.map((technology, index) => {
		const angle = Math.random() * Math.PI * 2;
		const radius = minRadius + Math.random() * (maxRadius - minRadius);
		const point = {
			x: CENTER + Math.sin(angle) * radius,
			y: CENTER - Math.cos(angle) * radius,
		};

		return {
			...technology,
			x: point.x,
			y: point.y,
			angle,
			radius,
			colorKey: blipColorKeys[index % blipColorKeys.length],
		};
	});
}

function toRadarTechnology(technology: Technology): RadarTechnology | null {
	if (!technology.id) {
		return null;
	}

	return {
		id: technology.id,
		title: technology.name ?? "Untitled technology",
	};
}

function Radar() {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [activeItemId, setActiveItemId] = useState("");
	const [positionedTechnologies, setPositionedTechnologies] = useState<
		PositionedRadarTechnology[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadTechnologies = async () => {
			setIsLoading(true);
			setError(null);

			const currentUserId = await getCurrentUserId();

			if (cancelled) {
				return;
			}

			setUserId(currentUserId);

			if (!currentUserId) {
				setPositionedTechnologies([]);
				setActiveItemId("");
				setIsLoading(false);
				return;
			}

			const [technologiesResult, userTechnologiesResult] = await Promise.all([
				getTechnologies(),
				getTechnologiesByUser(currentUserId),
			]);

			console.log("Technologies result:", technologiesResult);

			if (cancelled) {
				return;
			}

			if (!technologiesResult.success) {
				setError(technologiesResult.error || "Failed to load technologies");
				setPositionedTechnologies([]);
				setActiveItemId("");
				setIsLoading(false);
				return;
			}

			if (!userTechnologiesResult.success) {
				setError(
					userTechnologiesResult.error || "Failed to load user technologies",
				);
				setPositionedTechnologies([]);
				setActiveItemId("");
				setIsLoading(false);
				return;
			}

			const technologyMap = new Map(
				(technologiesResult.data || [])
					.map((technology) => toRadarTechnology(technology))
					.filter(
						(technology): technology is RadarTechnology => technology !== null,
					)
					.map((technology) => [technology.id, technology]),
			);

			const selectedTechnologies = (userTechnologiesResult.data || [])
				.map((userTechnology) => userTechnology.technology_id)
				.filter((technologyId): technologyId is string => Boolean(technologyId))
				.map((technologyId) => technologyMap.get(technologyId))
				.filter((technology): technology is RadarTechnology =>
					Boolean(technology),
				);

			const positioned =
				buildRandomPositionedTechnologies(selectedTechnologies);
			setPositionedTechnologies(positioned);
			setActiveItemId(positioned[0]?.id ?? "");
			setIsLoading(false);
		};

		void loadTechnologies();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (positionedTechnologies.length === 0) {
			if (activeItemId) {
				setActiveItemId("");
			}

			return;
		}

		if (!activeItemId) {
			setActiveItemId(positionedTechnologies[0]?.id ?? "");
			return;
		}

		const hasActiveItem = positionedTechnologies.some(
			(technology) => technology.id === activeItemId,
		);

		if (!hasActiveItem) {
			setActiveItemId(positionedTechnologies[0]?.id ?? "");
		}
	}, [activeItemId, positionedTechnologies]);

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
			.attr("stop-color", "var(--background-900)");
		backgroundGradient
			.append("stop")
			.attr("offset", "55%")
			.attr("stop-color", "var(--background-950)");
		backgroundGradient
			.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "var(--background)");

		const glowGradient = defs
			.append("radialGradient")
			.attr("id", "radar-glow")
			.attr("cx", "50%")
			.attr("cy", "50%")
			.attr("r", "50%");

		glowGradient
			.append("stop")
			.attr("offset", "0%")
			.attr(
				"stop-color",
				"color-mix(in oklab, var(--primary) 18%, transparent)",
			);
		glowGradient
			.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "transparent");

		defs
			.append("pattern")
			.attr("id", "radar-grid")
			.attr("width", 56)
			.attr("height", 56)
			.attr("patternUnits", "userSpaceOnUse")
			.append("path")
			.attr("d", "M56 0H0V56")
			.attr("fill", "none")
			.attr("stroke", "color-mix(in oklab, var(--border) 15%, transparent)")
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
			.attr("fill", "var(--background)");
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
			.attr("fill", "transparent");

		const root = svg
			.append("g")
			.attr("transform", `translate(${CENTER},${CENTER})`);

		root
			.append("circle")
			.attr("r", 24)
			.attr("fill", "var(--background)")
			.attr("stroke", "color-mix(in oklab, var(--border) 35%, transparent)")
			.attr("stroke-width", 1.2)
			.attr("filter", "url(#radar-soft-glow)");

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
			.attr("stroke", "color-mix(in oklab, var(--foreground) 4%, transparent)")
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
					? "color-mix(in oklab, var(--foreground) 24%, transparent)"
					: "color-mix(in oklab, var(--foreground) 16%, transparent)",
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
			.attr("stroke", "color-mix(in oklab, var(--foreground) 18%, transparent)")
			.attr("stroke-width", 1.3);

		root
			.selectAll<SVGTextElement, QuadrantLabel>("text.quadrant-label")
			.data(quadrantLabels)
			.join("text")
			.attr("class", "quadrant-label")
			.attr("fill", "var(--foreground)")
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

		root
			.selectAll<
				SVGTextElement,
				{ key: string; title: string; blurb: string; radius: number }
			>("text.ring-label")
			.data(ringPaths)
			.join("text")
			.attr("class", "ring-label")
			.attr("x", 0)
			.attr("y", (d) => -d.radius + 16)
			.attr("fill", "color-mix(in oklab, var(--foreground) 82%, transparent)")
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
			.attr("y", (d) => -d.radius + 30)
			.attr(
				"fill",
				"color-mix(in oklab, var(--muted-foreground) 68%, transparent)",
			)
			.attr("font-size", 8)
			.attr("font-weight", 500)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.text((d) => d.blurb);

		const blip = root
			.selectAll<SVGGElement, PositionedRadarTechnology>("g.blip")
			.data(positionedTechnologies)
			.join("g")
			.attr("class", "blip")
			.attr("role", "button")
			.attr("tabindex", 0)
			.attr("aria-label", (d: PositionedRadarTechnology) => d.title)
			.attr(
				"transform",
				(d: PositionedRadarTechnology) =>
					`translate(${d.x - CENTER},${d.y - CENTER})`,
			)
			.style("cursor", "pointer")
			.on(
				"mouseenter",
				(_event: MouseEvent, datum: PositionedRadarTechnology) => {
					console.log("Technology hovered:", datum.title);
					setActiveItemId(datum.id);
				},
			)
			.on("focus", (_event: FocusEvent, datum: PositionedRadarTechnology) => {
				setActiveItemId(datum.id);
			})
			.on("click", (_event: MouseEvent, datum: PositionedRadarTechnology) => {
				console.log("Technology clicked:", datum.title);
				setActiveItemId(datum.id);
			});

		blip
			.append("circle")
			.attr("r", (d: PositionedRadarTechnology) =>
				d.id === activeItemId ? 11 : blipRadius,
			)
			.attr("fill", (d: PositionedRadarTechnology) =>
				quadrantStroke(d.colorKey),
			)
			.attr("stroke", "var(--background)")
			.attr("stroke-width", 2);

		blip
			.append("circle")
			.attr("r", (d: PositionedRadarTechnology) =>
				d.id === activeItemId ? 16 : 11,
			)
			.attr("fill", "none")
			.attr("stroke", (d: PositionedRadarTechnology) =>
				quadrantStroke(d.colorKey),
			)
			.attr("stroke-opacity", (d: PositionedRadarTechnology) =>
				d.id === activeItemId ? 0.9 : 0.48,
			)
			.attr("stroke-width", (d: PositionedRadarTechnology) =>
				d.id === activeItemId ? 2.5 : 1.2,
			);

		blip
			.append("text")
			.attr("x", 0)
			.attr("y", 1)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("fill", "var(--foreground)")
			.attr("font-size", (d: PositionedRadarTechnology) =>
				d.id === activeItemId ? 10 : 8,
			)
			.attr("font-weight", 700)
			.attr("paint-order", "stroke")
			.attr("stroke", "var(--background)")
			.attr("stroke-width", 2)
			.text((_d: PositionedRadarTechnology, i: number) => `${i + 1}`);

		blip.append("title").text((d: PositionedRadarTechnology) => d.title);
	}, [activeItemId, positionedTechnologies]);

	return (
		<Card className="gap-0 overflow-hidden border-border bg-card/80 shadow-2xl shadow-foreground/10 backdrop-blur">
			<CardHeader className="border-border border-b px-5 py-4">
				<CardTitle className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.3em]">
					Radar canvas
				</CardTitle>
				<CardDescription className="text-muted-foreground text-sm">
					Your selected technologies, placed on the radar.
				</CardDescription>
				<CardAction>
					<Badge
						variant="secondary"
						className="border-border bg-background/60 text-foreground"
					>
						SVG + D3 geometry
					</Badge>
				</CardAction>
				<div className="col-span-2 pt-2">
					<SearchTechnologiesDialog />
				</div>
			</CardHeader>

			<CardContent className="relative m-0 px-0 py-0">
				<svg ref={svgRef} className="mt-5 block aspect-square w-full" />
				{(isLoading || error || positionedTechnologies.length === 0) && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
						<p className="text-muted-foreground text-sm">
							{isLoading
								? "Loading your selected technologies..."
								: error
									? error
									: userId
										? "Select technologies in your account to populate the radar."
										: "Sign in to see your radar."}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default Radar;
