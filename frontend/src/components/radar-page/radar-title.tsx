"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { positionedItems } from "./radar-data";

export default function RadarTitle() {
	return (
		<Card className="border-border bg-card/80 shadow-2xl shadow-foreground/10 backdrop-blur">
			<CardHeader className="border-border border-b px-6 py-5">
				<CardTitle className="font-black text-3xl text-card-foreground tracking-tight sm:text-4xl">
					Your Tech radar
				</CardTitle>
				<CardDescription className="max-w-2xl text-muted-foreground text-sm">
					A curated snapshot of the stack, delivery practices, and supporting
					platforms.
				</CardDescription>
				<CardAction>
					<Badge
						variant="secondary"
						className="border-primary/20 bg-primary/10 text-primary"
					>
						{positionedItems.length} blips
					</Badge>
				</CardAction>
			</CardHeader>
		</Card>
	);
}
