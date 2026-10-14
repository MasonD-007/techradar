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
import { type RingKey, ringLabels } from "./radar-data";

function createEmptyRingCounts(): Record<RingKey, number> {
	return ringLabels.reduce(
		(counts, ring) => {
			counts[ring.key] = 0;
			return counts;
		},
		{} as Record<RingKey, number>,
	);
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

type RingDataProps = {
	userId?: string | null;
	shareCode?: string | null;
};

export default function RingData({ userId, shareCode }: RingDataProps) {
	const [ringCounts, setRingCounts] = useState<Record<RingKey, number>>(
		createEmptyRingCounts,
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const loadRingCounts = async () => {
			setIsLoading(true);

			if (shareCode) {
				const radarGraphResult = await getRadarGraphByCode(shareCode);
				if (!radarGraphResult.success) {
					setRingCounts(createEmptyRingCounts());
					setIsLoading(false);
					return;
				}

				const nextCounts = createEmptyRingCounts();
				for (const item of radarGraphResult.data?.radar || []) {
					const ringKey = mapRingIdToKey(item.ring_id ?? 0);
					if (ringKey) {
						nextCounts[ringKey] += 1;
					}
				}

				setRingCounts(nextCounts);
				setIsLoading(false);
				return;
			}

			const currentUserId = userId ?? (await getCurrentUserId());
			if (cancelled) {
				return;
			}

			if (!currentUserId) {
				setRingCounts(createEmptyRingCounts());
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
				setRingCounts(createEmptyRingCounts());
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

			const nextCounts = createEmptyRingCounts();
			for (const userTechnology of userTechnologiesResult.data || []) {
				const technologyId = userTechnology.technology_id;
				const technology = technologyId
					? technologyMap.get(technologyId)
					: null;
				if (!technology || !userTechnology.ring_id) {
					continue;
				}

				const ringKey = mapRingIdToKey(userTechnology.ring_id);
				if (ringKey) {
					nextCounts[ringKey] += 1;
				}
			}

			setRingCounts(nextCounts);
			setIsLoading(false);
		};

		void loadRingCounts();

		return () => {
			cancelled = true;
		};
	}, [shareCode, userId]);

	const ringStats = ringLabels.map((ring) => ({
		...ring,
		count: ringCounts[ring.key],
	}));

	return (
		<Card className="border-border bg-card/75 shadow-foreground/10 shadow-xl backdrop-blur">
			<CardHeader className="px-5 py-5">
				<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.3em]">
					Rings
				</CardTitle>
				<CardDescription className="text-muted-foreground text-sm">
					Each ring reflects confidence and how close a technology is to
					production use.
				</CardDescription>
			</CardHeader>
			<Separator className="bg-border" />
			<CardContent className="space-y-3 px-5 py-5">
				{ringStats.map((ring) => (
					<Card
						key={ring.key}
						size="sm"
						className="border-border bg-background/40 shadow-none"
					>
						<CardHeader className="px-4 py-3">
							<CardTitle className="font-semibold text-base text-card-foreground">
								{ring.title}
							</CardTitle>
							<CardDescription className="text-muted-foreground text-sm">
								{ring.blurb}
							</CardDescription>
							<CardAction>
								<Badge
									variant="secondary"
									className="border-border bg-background/60 text-foreground"
								>
									{isLoading ? "..." : ring.count}
								</Badge>
							</CardAction>
						</CardHeader>
					</Card>
				))}
			</CardContent>
		</Card>
	);
}
