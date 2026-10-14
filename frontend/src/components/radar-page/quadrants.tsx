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
import { Separator } from "@/components/ui/separator";
import {
	getCurrentUserId,
	getRadarGraphByCode,
	getTechnologies,
	getTechnologiesByUser,
	type Technology,
} from "@/lib/actions";
import { type QuadrantKey, quadrantLabels } from "./radar-data";

function createEmptyQuadrantCounts(): Record<QuadrantKey, number> {
	return quadrantLabels.reduce(
		(counts, quadrant) => {
			counts[quadrant.key] = 0;
			return counts;
		},
		{} as Record<QuadrantKey, number>,
	);
}

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

type QuadrantDataProps = {
	userId?: string | null;
	shareCode?: string | null;
};

export default function QuadrantData({ userId, shareCode }: QuadrantDataProps) {
	const [quadrantCounts, setQuadrantCounts] = useState<
		Record<QuadrantKey, number>
	>(createEmptyQuadrantCounts);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const loadQuadrantCounts = async () => {
			setIsLoading(true);

			if (shareCode) {
				const radarGraphResult = await getRadarGraphByCode(shareCode);
				if (!radarGraphResult.success) {
					setQuadrantCounts(createEmptyQuadrantCounts());
					setIsLoading(false);
					return;
				}

				const nextCounts = createEmptyQuadrantCounts();
				for (const item of radarGraphResult.data?.radar || []) {
					const quadrantKey = mapQuadrantIdToKey(item.quadrant_id ?? 0);
					if (quadrantKey) {
						nextCounts[quadrantKey] += 1;
					}
				}

				setQuadrantCounts(nextCounts);
				setIsLoading(false);
				return;
			}

			const currentUserId = userId ?? (await getCurrentUserId());
			if (cancelled) {
				return;
			}

			if (!currentUserId) {
				setQuadrantCounts(createEmptyQuadrantCounts());
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

			if (!technologiesResult.success || !userTechnologiesResult.success) {
				setQuadrantCounts(createEmptyQuadrantCounts());
				setIsLoading(false);
				return;
			}

			const technologyMap = new Map<string, Technology>(
				(technologiesResult.data || [])
					.filter((technology): technology is Technology =>
						Boolean(technology.id),
					)
					.map((technology) => [technology.id as string, technology]),
			);

			const nextCounts = createEmptyQuadrantCounts();
			for (const userTechnology of userTechnologiesResult.data || []) {
				const technologyId = userTechnology.technology_id;
				const technology = technologyId
					? technologyMap.get(technologyId)
					: null;
				if (!technology?.quadrant_id) {
					continue;
				}

				const quadrantKey = mapQuadrantIdToKey(technology.quadrant_id);
				if (quadrantKey) {
					nextCounts[quadrantKey] += 1;
				}
			}

			setQuadrantCounts(nextCounts);
			setIsLoading(false);
		};

		void loadQuadrantCounts();

		return () => {
			cancelled = true;
		};
	}, [shareCode, userId]);

	const quadrantStats = quadrantLabels.map((quadrant) => ({
		...quadrant,
		count: quadrantCounts[quadrant.key],
	}));

	return (
		<Card className="border-border bg-card/75 shadow-foreground/10 shadow-xl backdrop-blur">
			<CardHeader className="px-5 py-5">
				<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.3em]">
					Quadrants
				</CardTitle>
				<CardDescription className="text-muted-foreground text-sm">
					How the radar is split across product and delivery concerns.
				</CardDescription>
			</CardHeader>
			<Separator className="bg-border" />
			<CardContent className="space-y-3 px-5 py-5">
				{quadrantStats.map((quadrant) => (
					<Card
						key={quadrant.key}
						size="sm"
						className="border-border bg-background/40 shadow-none"
					>
						<CardHeader className="px-4 py-3">
							<CardTitle className="font-semibold text-base text-card-foreground">
								{quadrant.title}
							</CardTitle>
							<CardDescription className="text-muted-foreground text-sm">
								{quadrant.description}
							</CardDescription>
							<CardAction>
								<Badge
									variant="secondary"
									className="border-border bg-background/60 text-foreground"
								>
									{isLoading ? "..." : quadrant.count}
								</Badge>
							</CardAction>
						</CardHeader>
					</Card>
				))}
			</CardContent>
		</Card>
	);
}
