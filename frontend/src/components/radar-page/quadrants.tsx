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
import { positionedItems, quadrantLabels } from "./radar-data";

export default function QuadrantData() {
	const quadrantStats = quadrantLabels.map((quadrant) => ({
		...quadrant,
		count: positionedItems.filter((item) => item.quadrant === quadrant.key)
			.length,
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
									{quadrant.count}
								</Badge>
							</CardAction>
						</CardHeader>
					</Card>
				))}
			</CardContent>
		</Card>
	);
}
