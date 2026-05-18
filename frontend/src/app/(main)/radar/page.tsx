import QuadrantData from "@/components/radar-page/quadrants";
import Radar from "@/components/radar-page/radar";
import RadarTitle from "@/components/radar-page/radar-title";
import RingData from "@/components/radar-page/rings";
import { Card, CardContent } from "@/components/ui/card";

export default function RadarPage() {
	return (
		<Card className="min-h-screen bg-background px-4 py-6 text-card-foreground shadow-none ring-0 sm:px-6 lg:px-8">
			<CardContent className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-5">
				<RadarTitle />

				<div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_280px]">
					<Radar />

					<CardContent className="grid gap-4 self-start bg-transparent p-0 shadow-none ring-0">
						<QuadrantData />
						<RingData />
					</CardContent>
				</div>
			</CardContent>
		</Card>
	);
}
