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
import { positionedItems, ringLabels } from "./radar-data";

export default function RingData() {
	const ringStats = ringLabels.map((ring) => ({
		...ring,
		count: positionedItems.filter((item) => item.ring === ring.key).length,
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
									{ring.count}
								</Badge>
							</CardAction>
						</CardHeader>
					</Card>
				))}
			</CardContent>
		</Card>
	);
}
