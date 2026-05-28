"use client";

import QuadrantData from "@/components/radar-page/quadrants";
import type { RadarTechnology } from "@/components/radar-page/radar";
import Radar from "@/components/radar-page/radar";
import RadarTitle from "@/components/radar-page/radar-title";
import RingData from "@/components/radar-page/rings";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import TechnologyData from "../../../components/radar-page/technology";

export default function RadarPage() {
	const [activeTab, setActiveTab] = useState("quadrants");
	const [selectedTechnology, setSelectedTechnology] =
		useState<RadarTechnology | null>(null);

	return (
		<Card className="min-h-screen bg-background px-4 py-6 text-card-foreground shadow-none ring-0 sm:px-6 lg:px-8">
			<CardContent className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-5">
				<RadarTitle />
				<div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)] xl:items-start">
					<Radar
						onTechnologySelect={(technology) => {
							setSelectedTechnology(technology);
							setActiveTab("technology");
						}}
					/>

					<Card className="border-border bg-card/80 shadow-2xl shadow-foreground/10 backdrop-blur xl:sticky xl:top-6">
						<CardContent className="grid gap-4 p-4 sm:p-5">
							<Tabs
								value={activeTab}
								onValueChange={setActiveTab}
								className="w-full gap-4"
							>
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="quadrants">Quadrants</TabsTrigger>
									<TabsTrigger value="rings">Rings</TabsTrigger>
									<TabsTrigger value="technology">Technology</TabsTrigger>
								</TabsList>
								<TabsContent value="quadrants" className="mt-0">
									<QuadrantData />
								</TabsContent>
								<TabsContent value="rings" className="mt-0">
									<RingData />
								</TabsContent>
								<TabsContent value="technology" className="mt-0">
									<TechnologyData technology={selectedTechnology} />
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</CardContent>
		</Card>
	);
}
