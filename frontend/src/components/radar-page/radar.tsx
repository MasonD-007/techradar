"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
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
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
	getBlip,
	getCurrentUserId,
	getTechnologies,
	getTechnologiesByUser,
	type Technology,
} from "@/lib/actions";
import {
	CENTER,
	outerRadius,
	polarToCartesian,
	polarToRelative,
	type QuadrantKey,
	type QuadrantLabel,
	quadrantLabels,
	RADAR_SIZE,
	type RingKey,
	ringPaths,
	ringRatios,
} from "./radar-data";
import SearchTechnologiesDialog from "./search-technologies/search-technologies-dialog";

export type RadarTechnology = {
	id: string;
	title: string;
	quadrant: QuadrantKey;
	ring: RingKey;
	blipId: number | null;
	intro: string | null;
	iconUrl?: string;
};

export type PositionedRadarTechnology = RadarTechnology & {
	x: number;
	y: number;
	angle: number;
	radius: number;
	colorKey: QuadrantKey;
};

type RadarProps = {
	onTechnologySelect?: (technology: RadarTechnology) => void;
};

const quadrantBoundsByKey: Record<
	QuadrantKey,
	{ startAngle: number; endAngle: number }
> = quadrantLabels.reduce(
	(bounds, quadrant) => {
		bounds[quadrant.key] = {
			startAngle: quadrant.startAngle,
			endAngle: quadrant.endAngle,
		};
		return bounds;
	},
	{} as Record<QuadrantKey, { startAngle: number; endAngle: number }>,
);

const ringIndexByKey: Record<RingKey, number> = {
	adopt: 0,
	trial: 1,
	assess: 2,
	hold: 3,
};

const quadrantLabelByKey = quadrantLabels.reduce(
	(labels, quadrant) => {
		labels[quadrant.key] = quadrant.title;
		return labels;
	},
	{} as Record<QuadrantKey, string>,
);

const ringLabelByKey = ringPaths.reduce(
	(labels, ring) => {
		labels[ring.key] = ring.title;
		return labels;
	},
	{} as Record<RingKey, string>,
);

function mapQuadrantIdToKey(quadrantId: number): QuadrantKey | null {
	switch (quadrantId) {
		case 1:
			return "techniques";
		case 2:
			return "tools";
		case 3:
			return "platforms";
		case 4:
			return "languages";
		default:
			return null;
	}
}

function mapRingIdToKey(ringId: number): RingKey | null {
	switch (ringId) {
		case 1:
			return "adopt";
		case 2:
			return "trial";
		case 3:
			return "assess";
		case 4:
			return "hold";
		default:
			return null;
	}
}

function extractBlipIntro(context: unknown): string | null {
	if (!context || typeof context !== "object" || Array.isArray(context)) {
		return null;
	}

	const record = context as Record<string, unknown>;
	const intro = record.intro ?? record.description ?? record.summary;

	if (typeof intro !== "string") {
		return null;
	}

	const trimmedIntro = intro.trim();
	return trimmedIntro.length > 0 ? trimmedIntro : null;
}

function toRadarTechnology(
	technology: Technology,
	ringId: number | undefined,
	blipIntroById: Map<number, string | null>,
): RadarTechnology | null {
	if (!technology.id || !technology.quadrant_id || !ringId) {
		return null;
	}

	const quadrant = mapQuadrantIdToKey(technology.quadrant_id);
	const ring = mapRingIdToKey(ringId);

	if (!quadrant || !ring) {
		return null;
	}

	return {
		id: technology.id,
		title: technology.name ?? "Untitled technology",
		quadrant,
		ring,
		blipId: technology.blip_id ?? null,
		intro: technology.blip_id
			? (blipIntroById.get(technology.blip_id) ?? null)
			: null,
		iconUrl: technology.icon_url ?? undefined,
	};
}

function sampleRadarPosition(technology: RadarTechnology) {
	const quadrantBounds = quadrantBoundsByKey[technology.quadrant];
	const ringIndex = ringIndexByKey[technology.ring];
	const anglePadding = 0.16;
	const minRadius =
		ringIndex === 0 ? 22 : ringRatios[ringIndex - 1] * outerRadius;
	const maxRadius = ringRatios[ringIndex] * outerRadius - 18;
	const angleStart = quadrantBounds.startAngle + anglePadding;
	const angleEnd = quadrantBounds.endAngle - anglePadding;
	const angle = angleStart + Math.random() * (angleEnd - angleStart);
	const radius = minRadius + Math.random() * (maxRadius - minRadius);
	const point = polarToCartesian(angle, radius);

	return {
		...technology,
		x: point.x,
		y: point.y,
		angle,
		radius,
		colorKey: technology.quadrant,
	};
}

function isPositionFarEnough(
	candidate: PositionedRadarTechnology,
	existingTechnologies: PositionedRadarTechnology[],
	minDistance: number,
) {
	const minDistanceSq = minDistance * minDistance;

	return existingTechnologies.every((existingTechnology) => {
		const dx = candidate.x - existingTechnology.x;
		const dy = candidate.y - existingTechnology.y;
		return dx * dx + dy * dy >= minDistanceSq;
	});
}

function buildRandomPositionedTechnologies(
	technologies: RadarTechnology[],
): PositionedRadarTechnology[] {
	const minSpacing = 46;
	const maxAttemptsPerTechnology = 120;
	const positionedTechnologies: PositionedRadarTechnology[] = [];

	for (const technology of technologies) {
		let bestCandidate: PositionedRadarTechnology | null = null;
		let bestClearance = -Infinity;

		for (let attempt = 0; attempt < maxAttemptsPerTechnology; attempt += 1) {
			const candidate = sampleRadarPosition(technology);
			const clearance = positionedTechnologies.reduce((smallest, existing) => {
				const dx = candidate.x - existing.x;
				const dy = candidate.y - existing.y;
				return Math.min(smallest, Math.sqrt(dx * dx + dy * dy));
			}, Number.POSITIVE_INFINITY);

			if (clearance > bestClearance) {
				bestCandidate = candidate;
				bestClearance = clearance;
			}

			if (isPositionFarEnough(candidate, positionedTechnologies, minSpacing)) {
				positionedTechnologies.push(candidate);
				bestCandidate = null;
				break;
			}
		}

		if (bestCandidate) {
			positionedTechnologies.push(bestCandidate);
		}
	}

	return positionedTechnologies;
}

const quadrantColor = d3
	.scaleOrdinal<QuadrantKey, string>()
	.domain(["tools", "techniques", "platforms", "languages"])
	.range([
		"color-mix(in oklab, #38bdf8 26%, transparent)",
		"color-mix(in oklab, #a78bfa 26%, transparent)",
		"color-mix(in oklab, #34d399 24%, transparent)",
		"color-mix(in oklab, #f59e0b 26%, transparent)",
	]);

const quadrantStroke = d3
	.scaleOrdinal<QuadrantKey, string>()
	.domain(["tools", "techniques", "platforms", "languages"])
	.range([
		"color-mix(in oklab, #38bdf8 62%, transparent)",
		"color-mix(in oklab, #a78bfa 62%, transparent)",
		"color-mix(in oklab, #34d399 58%, transparent)",
		"color-mix(in oklab, #f59e0b 62%, transparent)",
	]);

const quadrantArc = d3
	.arc<{ startAngle: number; endAngle: number }>()
	.innerRadius(0)
	.outerRadius(outerRadius);

function drawRadarGeometry(svgNode: SVGSVGElement) {
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
		.attr("stop-color", "color-mix(in oklab, #0f172a 74%, var(--background))");
	backgroundGradient
		.append("stop")
		.attr("offset", "55%")
		.attr("stop-color", "color-mix(in oklab, #111827 82%, var(--background))");
	backgroundGradient
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", "color-mix(in oklab, #020617 92%, var(--background))");

	const glowGradient = defs
		.append("radialGradient")
		.attr("id", "radar-glow")
		.attr("cx", "50%")
		.attr("cy", "50%")
		.attr("r", "50%");

	glowGradient
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", "color-mix(in oklab, #38bdf8 24%, transparent)");
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
		.attr("stroke", "color-mix(in oklab, #94a3b8 12%, transparent)")
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
		.attr("fill", "url(#radar-glow)")
		.attr("opacity", 0.9);
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
		.attr("fill", "color-mix(in oklab, var(--card) 70%, var(--background))")
		.attr("stroke", "color-mix(in oklab, #38bdf8 38%, transparent)")
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
		.attr("stroke", "color-mix(in oklab, #cbd5e1 5%, transparent)")
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
				? "color-mix(in oklab, #cbd5e1 26%, transparent)"
				: "color-mix(in oklab, #94a3b8 16%, transparent)",
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
		.attr("stroke", "color-mix(in oklab, #60a5fa 18%, transparent)")
		.attr("stroke-width", 1.3);

	root
		.selectAll<SVGTextElement, QuadrantLabel>("text.quadrant-label")
		.data(quadrantLabels)
		.join("text")
		.attr("class", "quadrant-label")
		.attr("fill", "#e2e8f0")
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
				el.append("tspan").attr("x", pos.x).attr("dy", "20").text("Frameworks");
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
		.attr("fill", "color-mix(in oklab, #94a3b8 72%, transparent)")
		.attr("font-size", 8)
		.attr("font-weight", 500)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "middle")
		.text((d) => d.blurb);
}

function Radar({ onTechnologySelect }: RadarProps) {
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
				(technologiesResult.data || []).map((technology) => [
					technology.id,
					technology,
				]),
			);

			const selectedTechnologySources = (userTechnologiesResult.data || [])
				.map((userTechnology) => {
					const technologyId = userTechnology.technology_id;
					const ringId = userTechnology.ring_id;
					if (!technologyId || !ringId) {
						return null;
					}

					const technology = technologyMap.get(technologyId);
					if (!technology) {
						return null;
					}

					return { technology, ringId };
				})
				.filter(
					(source): source is { technology: Technology; ringId: number } =>
						source !== null,
				);

			const uniqueBlipIds = [
				...new Set(
					selectedTechnologySources
						.map(({ technology }) => technology.blip_id)
						.filter((blipId): blipId is number => typeof blipId === "number"),
				),
			];

			const blipIntroById = new Map<number, string | null>();
			const blipResults = await Promise.all(
				uniqueBlipIds.map(async (blipId) => ({
					blipId,
					result: await getBlip(blipId),
				})),
			);

			for (const { blipId, result } of blipResults) {
				if (result.success) {
					const blipIntro = extractBlipIntro(result.data?.context);
					blipIntroById.set(blipId, blipIntro);
				}
			}

			const selectedTechnologies = selectedTechnologySources
				.map(({ technology, ringId }) => {
					return toRadarTechnology(technology, ringId, blipIntroById);
				})
				.filter(
					(technology): technology is RadarTechnology => technology !== null,
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
		const svgNode = svgRef.current;
		if (!svgNode) {
			return;
		}

		drawRadarGeometry(svgNode);
	}, []);

	return (
		<Card className="gap-0 overflow-hidden border-border bg-card/80 py-0 shadow-2xl shadow-foreground/10 backdrop-blur">
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

			<CardContent className="relative m-0 px-0! py-0!">
				<svg ref={svgRef} className="block aspect-square w-full" />
				<div className="pointer-events-none absolute inset-0 z-10">
					{positionedTechnologies.map((technology, index) => (
						<HoverCard key={technology.id} openDelay={80} closeDelay={80}>
							<HoverCardTrigger asChild>
								<button
									type="button"
									aria-label={`Preview ${technology.title}`}
									className={`pointer-events-auto absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform duration-150 hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${technology.id === activeItemId ? "scale-110" : ""}`}
									style={{
										left: `${(technology.x / RADAR_SIZE) * 100}%`,
										top: `${(technology.y / RADAR_SIZE) * 100}%`,
									}}
									onMouseEnter={() => setActiveItemId(technology.id)}
									onFocus={() => setActiveItemId(technology.id)}
									onClick={() => {
										setActiveItemId(technology.id);
										onTechnologySelect?.(technology);
									}}
								>
									{technology.iconUrl ? (
										<Image
											src={technology.iconUrl}
											alt=""
											width={32}
											height={32}
											className="pointer-events-none h-full w-full rounded-full object-contain p-0.5"
										/>
									) : (
										<svg
											viewBox="0 0 24 24"
											className="h-full w-full overflow-visible"
											aria-hidden="true"
										>
											<circle
												cx="12"
												cy="12"
												r={technology.id === activeItemId ? 7 : 5}
												fill={quadrantStroke(technology.colorKey)}
												stroke="color-mix(in oklab, var(--background) 82%, transparent)"
												strokeWidth="1.5"
											/>
											<circle
												cx="12"
												cy="12"
												r={technology.id === activeItemId ? 9 : 7}
												fill="none"
												stroke={quadrantStroke(technology.colorKey)}
												strokeOpacity={
													technology.id === activeItemId ? 0.9 : 0.48
												}
												strokeWidth={technology.id === activeItemId ? 2 : 1.25}
											/>
											<text
												x="12"
												y="13"
												textAnchor="middle"
												dominantBaseline="middle"
												fill="#f8fafc"
												fontSize={technology.id === activeItemId ? 8.5 : 7.25}
												fontWeight={700}
												paintOrder="stroke"
												stroke="color-mix(in oklab, var(--background) 88%, transparent)"
												strokeWidth="1.8"
											>
												{index + 1}
											</text>
										</svg>
									)}
								</button>
							</HoverCardTrigger>
							<HoverCardContent
								side="top"
								align="center"
								sideOffset={12}
								className="space-y-3"
							>
								<div className="space-y-1">
									<p className="font-semibold text-popover-foreground">
										{technology.title}
									</p>
									<p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
										Technology preview
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Badge
										variant="secondary"
										className="border-border bg-background/60 text-foreground"
									>
										Quadrant: {quadrantLabelByKey[technology.quadrant]}
									</Badge>
									<Badge
										variant="secondary"
										className="border-border bg-background/60 text-foreground"
									>
										Ring: {ringLabelByKey[technology.ring]}
									</Badge>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
										Intro
									</p>
									<p className="text-popover-foreground/90 text-sm">
										{technology.intro ?? "No intro available."}
									</p>
								</div>
							</HoverCardContent>
						</HoverCard>
					))}
				</div>
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
