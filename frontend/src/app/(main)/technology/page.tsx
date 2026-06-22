"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	getBlip,
	getTechnologies,
	type Technology,
} from "@/lib/actions";

const QUADRANT_LABELS: Record<number, string> = {
	1: "Techniques",
	2: "Tools",
	3: "Platforms",
	4: "Languages & Frameworks",
};

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

export default function TechnologyPage() {
	const [technologyId, setTechnologyId] = useQueryState("id", parseAsString);
	const [search, setSearch] = useState("");
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [blipCache, setBlipCache] = useState<Map<number, string | null>>(
		new Map(),
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
		null,
	);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			setError(null);

			const techsResult = await getTechnologies();
			if (!techsResult.success) {
				setError(techsResult.error || "Failed to load technologies");
				setTechnologies([]);
				setIsLoading(false);
				return;
			}

			const techs = techsResult.data || [];
			setTechnologies(techs);

			const blipIds = techs
				.map((t) => t.blip_id)
				.filter((id): id is number => typeof id === "number");
			const uniqueBlipIds = [...new Set(blipIds)];

			const blips = new Map<number, string | null>();
			const results = await Promise.all(
				uniqueBlipIds.map(async (blipId) => ({
					blipId,
					result: await getBlip(blipId),
				})),
			);
			for (const { blipId, result } of results) {
				if (result.success) {
					blips.set(blipId, extractBlipIntro(result.data?.context));
				}
			}
			setBlipCache(blips);
			setIsLoading(false);
		};

		void fetchData();
	}, []);

	const filtered = technologies.filter((tech) =>
		(tech.name ?? "").toLowerCase().includes(search.toLowerCase()),
	);

	const virtualizer = useVirtualizer({
		count: filtered.length,
		getScrollElement: () => scrollElement,
		estimateSize: () => 108,
		overscan: 3,
	});

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		virtualizer.scrollToOffset(0, { behavior: "smooth" });
	};

	return (
		<Card className="min-h-screen bg-background px-4 py-6 text-card-foreground shadow-none ring-0 sm:px-6 lg:px-8">
			<CardContent className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-5">
				<div className="flex flex-col gap-2">
					<h1 className="font-semibold text-2xl text-card-foreground">
						Technologies
					</h1>
					<p className="text-muted-foreground text-sm">
						Browse all technologies and their blips across the radar.
					</p>
				</div>

				<Input
					placeholder="Search technologies..."
					value={search}
					onChange={handleSearchChange}
				/>

				{isLoading && (
					<p className="text-muted-foreground text-sm">Loading...</p>
				)}
				{error && <p className="text-destructive text-sm">{error}</p>}

				{!isLoading && !error && (
					<div
						ref={setScrollElement}
						className="flex-1 overflow-y-auto rounded-2xl border border-border"
						style={{ contain: "layout paint", minHeight: 400 }}
					>
						{filtered.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								No technologies found.
							</p>
						) : (
							<div
								style={{
									height: `${virtualizer.getTotalSize()}px`,
									position: "relative",
									width: "100%",
								}}
							>
								{virtualizer.getVirtualItems().map((virtualItem) => {
									const tech = filtered[virtualItem.index];
									const blipIntro = tech.blip_id
										? (blipCache.get(tech.blip_id) ?? null)
										: null;
									const quadrantLabel = tech.quadrant_id
										? (QUADRANT_LABELS[tech.quadrant_id] ?? "Unknown")
										: "Unknown";

									return (
										<button
											key={virtualItem.key}
											data-index={virtualItem.index}
											ref={virtualizer.measureElement}
											style={{
												position: "absolute",
												top: 0,
												left: 0,
												width: "100%",
												transform: `translateY(${virtualItem.start}px)`,
											}}
											type="button"
											onClick={() =>
												setTechnologyId(
													tech.id === technologyId ? null : tech.id ?? null,
												)
											}
											className={`flex w-full items-start gap-4 border-b border-border p-4 text-left transition-colors hover:bg-accent/50 ${
												technologyId === tech.id ? "bg-accent" : ""
											}`}
										>
											<div className="min-w-0 flex-1">
												<p className="font-medium text-card-foreground">
													{tech.name ?? "Untitled"}
												</p>
												<div className="mt-1.5 flex flex-wrap gap-2">
													<Badge
														variant="secondary"
														className="border-border bg-background/60 text-foreground text-xs"
													>
														{quadrantLabel}
													</Badge>
													{tech.icon_url && (
														<Badge
															variant="outline"
															className="border-border text-muted-foreground text-xs"
														>
															Has icon
														</Badge>
													)}
													{blipIntro && (
														<Badge
															variant="outline"
															className="border-border text-muted-foreground text-xs"
														>
															Has blip
														</Badge>
													)}
												</div>
												{blipIntro && (
													<p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-5">
														{blipIntro}
													</p>
												)}
											</div>
											{tech.icon_url && (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={tech.icon_url}
													alt=""
													className="mt-1 size-8 shrink-0 rounded-md object-contain"
												/>
											)}
										</button>
									);
								})}
							</div>
						)}
					</div>
				)}

				{technologyId && (
					<div className="rounded-2xl border border-border p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
							Selected Technology ID
						</p>
						<p className="mt-1 font-mono text-card-foreground text-sm">
							{technologyId}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
