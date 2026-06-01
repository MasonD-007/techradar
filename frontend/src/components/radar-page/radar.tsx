"use client";

import { useEffect, useState } from "react";
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
	outerRadius,
	polarToCartesian,
	type QuadrantKey,
	quadrantLabels,
	RADAR_SIZE,
	type RingKey,
	ringPaths,
	ringRatios,
} from "./radar-data";
import RadarSVG, { quadrantStroke } from "./radar-svg";
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
	userId?: string | null;
	currentUserId?: string | null;
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

function Radar({ userId, currentUserId, onTechnologySelect }: RadarProps) {
	const [viewedUserId, setViewedUserId] = useState<string | null>(null);
	const [loadedCurrentUserId, setLoadedCurrentUserId] = useState<string | null>(
		null,
	);
	const [activeItemId, setActiveItemId] = useState("");
	const [positionedTechnologies, setPositionedTechnologies] = useState<
		PositionedRadarTechnology[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isOwnRadar =
		viewedUserId !== null &&
		loadedCurrentUserId !== null &&
		viewedUserId === loadedCurrentUserId;

	useEffect(() => {
		let cancelled = false;

		const loadTechnologies = async () => {
			setIsLoading(true);
			setError(null);

			const resolvedUserId = currentUserId ?? (await getCurrentUserId());
			const targetUserId = userId ?? resolvedUserId;

			if (cancelled) {
				return;
			}

			setLoadedCurrentUserId(resolvedUserId);
			setViewedUserId(targetUserId);

			if (!targetUserId) {
				setPositionedTechnologies([]);
				setActiveItemId("");
				setIsLoading(false);
				return;
			}

			const [technologiesResult, userTechnologiesResult] = await Promise.all([
				getTechnologies(),
				getTechnologiesByUser(targetUserId),
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
	}, [currentUserId, userId]);

	const firstPositionedTechnologyId = positionedTechnologies[0]?.id ?? "";
	const hasActiveTechnology = positionedTechnologies.some(
		(technology) => technology.id === activeItemId,
	);

	useEffect(() => {
		if (!firstPositionedTechnologyId) {
			if (activeItemId) {
				setActiveItemId("");
			}

			return;
		}

		if (!activeItemId) {
			setActiveItemId(firstPositionedTechnologyId);
			return;
		}

		if (!hasActiveTechnology) {
			setActiveItemId(firstPositionedTechnologyId);
		}
	}, [activeItemId, firstPositionedTechnologyId, hasActiveTechnology]);

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
					{isOwnRadar && <SearchTechnologiesDialog />}
				</div>
			</CardHeader>

			<CardContent className="relative m-0 px-0! py-0!">
				<RadarSVG />
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
									: viewedUserId
										? isOwnRadar
											? "Select technologies in your account to populate the radar."
											: "This person has not populated their radar yet."
										: "Sign in to see your radar."}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default Radar;
