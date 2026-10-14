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
import { Separator } from "@/components/ui/separator";
import type { RadarTechnology } from "./radar";
import { quadrantLabels, ringPaths } from "./radar-data";

const quadrantLabelByKey = quadrantLabels.reduce(
	(labels, quadrant) => {
		labels[quadrant.key] = quadrant.title;
		return labels;
	},
	{} as Record<(typeof quadrantLabels)[number]["key"], string>,
);

const ringLabelByKey = ringPaths.reduce(
	(labels, ring) => {
		labels[ring.key] = ring.title;
		return labels;
	},
	{} as Record<(typeof ringPaths)[number]["key"], string>,
);

type TechnologyDataProps = {
	technology: RadarTechnology | null;
	isOwnRadar?: boolean;
};

export default function TechnologyData({
	technology,
	isOwnRadar = true,
}: TechnologyDataProps) {
	return (
		<Card className="border-border bg-card/75 shadow-foreground/10 shadow-xl backdrop-blur">
			<CardHeader className="px-5 py-5">
				<CardTitle className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.3em]">
					Technology
				</CardTitle>
				<CardDescription className="text-muted-foreground text-sm">
					Detailed information for the selected technology.
				</CardDescription>
				<CardAction>
					<Badge
						variant="secondary"
						className="border-border bg-background/60 text-foreground"
					>
						{technology ? "Selected" : isOwnRadar ? "Waiting" : "View only"}
					</Badge>
				</CardAction>
			</CardHeader>
			<Separator className="bg-border" />
			<CardContent className="space-y-4 px-5 py-5">
				{technology ? (
					<>
						<div className="space-y-1">
							<p className="font-semibold text-base text-card-foreground">
								{technology.title}
							</p>
							<p className="break-all text-muted-foreground text-sm">
								{technology.id}
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
							<Badge
								variant="secondary"
								className="border-border bg-background/60 text-foreground"
							>
								Blip: {technology.blipId ? `#${technology.blipId}` : "None"}
							</Badge>
						</div>

						<div className="rounded-2xl border border-border bg-background/40 p-4">
							<p className="mb-2 text-muted-foreground text-xs uppercase tracking-[0.24em]">
								Blip info
							</p>
							<p className="text-card-foreground/90 text-sm leading-6">
								{technology.intro ?? "No intro available for this blip."}
							</p>
						</div>
					</>
				) : (
					<div className="rounded-2xl border border-border border-dashed bg-background/30 p-5 text-center">
						<p className="text-muted-foreground text-sm">
							Click a technology node on the radar to inspect its quadrant,
							ring, and blip details here.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
