"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type GalleryEntry, getGallery } from "@/lib/discovery-actions";

const QUADRANTS = [
	{ value: "all", label: "All" },
	{ value: "1", label: "Techniques" },
	{ value: "2", label: "Tools" },
	{ value: "3", label: "Platforms" },
	{ value: "4", label: "Languages & Frameworks" },
];

export default function Gallery() {
	const [query, setQuery] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [quadrant, setQuadrant] = useState<number | null>(null);
	const [radars, setRadars] = useState<GalleryEntry[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [error, setError] = useState("");
	const requestId = useRef(0);

	const fetchPage = useCallback(
		async (nextPage: number) => {
			const id = ++requestId.current;
			const result = await getGallery({
				q: appliedQuery || undefined,
				quadrant: quadrant ?? undefined,
				page: nextPage,
			});
			return { stale: id !== requestId.current, result, nextPage };
		},
		[appliedQuery, quadrant],
	);

	const apply = useCallback(
		(
			outcome: Awaited<ReturnType<typeof fetchPage>>,
			replace: boolean,
		) => {
			if (outcome.stale) return;
			const { result, nextPage } = outcome;
			if (!result.success || !result.data) {
				setError(result.error ?? "Failed to load gallery");
				setStatus("error");
				return;
			}
			const data = result.data;
			setRadars((prev) => (replace ? data.radars : [...prev, ...data.radars]));
			setPage(nextPage);
			setHasMore(data.has_more);
			setStatus("ready");
		},
		[],
	);

	const reload = () => {
		setStatus("loading");
		void fetchPage(1).then((o) => apply(o, true));
	};

	useEffect(() => {
		void fetchPage(1).then((o) => apply(o, true));
	}, [fetchPage, apply]);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<form
					className="flex flex-1 gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						const next = query.trim();
						if (next === appliedQuery) return;
						setStatus("loading");
						setAppliedQuery(next);
					}}
				>
					<Input
						type="search"
						placeholder="Search by username or technology..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<Button type="submit">Search</Button>
				</form>
				<Select
					value={quadrant === null ? "all" : String(quadrant)}
					onValueChange={(v) => {
						const next = v === "all" ? null : Number(v);
						if (next === quadrant) return;
						setStatus("loading");
						setQuadrant(next);
					}}
				>
					<SelectTrigger aria-label="Quadrant">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{QUADRANTS.map((q) => (
							<SelectItem key={q.value} value={q.value}>
								{q.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{status === "loading" && (
				<p className="text-muted-foreground text-sm">Loading radars...</p>
			)}

			{status === "error" && (
				<div className="flex flex-col items-start gap-2">
					<p className="text-destructive text-sm">{error}</p>
					<Button variant="outline" onClick={reload}>
						Try again
					</Button>
				</div>
			)}

			{status === "ready" && radars.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No radars have been shared yet.
				</p>
			)}

			{status === "ready" && radars.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{radars.map((entry) => (
						<a key={entry.code} href={`/radar?share=${encodeURIComponent(entry.code)}`}>
							<Card className="h-full transition-colors hover:bg-accent/30">
								<CardContent className="flex flex-col gap-2">
									{/* biome-ignore lint/performance/noImgElement: dynamic, pre-sized route */}
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={`/og/radar?share=${encodeURIComponent(entry.code)}`}
										alt=""
										loading="lazy"
										className="aspect-[1200/630] w-full rounded-md border border-border object-cover"
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
									<p className="font-medium">{entry.username}</p>
									<p className="text-muted-foreground text-xs">
										{entry.blip_count} technologies
									</p>
									<div className="flex flex-wrap gap-1">
										{entry.top_technologies.map((name) => (
											<Badge key={name} variant="secondary">
												{name}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						</a>
					))}
				</div>
			)}

			{status === "ready" && hasMore && (
				<Button
					variant="outline"
					className="self-center"
					onClick={() => void fetchPage(page + 1).then((o) => apply(o, false))}
				>
					Load more
				</Button>
			)}
		</div>
	);
}
