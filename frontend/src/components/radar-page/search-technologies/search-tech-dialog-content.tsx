"use client";

import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	getTechnologies,
	getTechnologiesByUser,
	type Technology,
	type UserTechnology,
} from "@/lib/actions";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AddTechnologyButton from "./add-technology-button";

interface SearchTechnologiesDialogContentProps {
	userId: string | null;
	onTechnologyChange?: () => void;
}

export default function SearchTechnologiesDialogContent({
	userId,
	onTechnologyChange,
}: SearchTechnologiesDialogContentProps) {
	const [search, setSearch] = useState("");
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [selectedTechnologyIds, setSelectedTechnologyIds] = useState<string[]>(
		[],
	);
	const [userTechnologies, setUserTechnologies] = useState<UserTechnology[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchTechnologies = async () => {
			setIsLoading(true);
			setError(null);

			const technologiesResult = await getTechnologies();

			if (!technologiesResult.success) {
				setError(technologiesResult.error || "Failed to load technologies");
				setTechnologies([]);
				setIsLoading(false);
				return;
			}

			setTechnologies(technologiesResult.data || []);
			setIsLoading(false);
		};

		void fetchTechnologies();
	}, []);

	useEffect(() => {
		const fetchUserTechnologies = async () => {
			if (!userId) {
				setSelectedTechnologyIds([]);
				setUserTechnologies([]);
				return;
			}
			const userTechResult = await getTechnologiesByUser(userId);
			if (!userTechResult.success) {
				setError(userTechResult.error || "Failed to load user technologies");
				setSelectedTechnologyIds([]);
				return;
			}
			const userTechs = userTechResult.data || [];
			const userTechIds = userTechs.map((ut) => ut.technology_id ?? "");
			setSelectedTechnologyIds(userTechIds);
			setUserTechnologies(userTechResult.data || []);
		};
		void fetchUserTechnologies();
	}, [userId]);

	const filtered = technologies.filter((tech) => {
		const name = tech.name || "";
		return name.toLowerCase().includes(search.toLowerCase());
	});

	const virtualizer = useVirtualizer({
		count: filtered.length,
		getScrollElement: () => scrollContainerRef.current,
		estimateSize: () => 88,
		overscan: 5,
	});

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		virtualizer.scrollToOffset(0, { behavior: "smooth" });
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Search Technologies</DialogTitle>
				<DialogDescription>
					Find technologies available in the radar.
					{!userId && (
						<span className="mt-2 block">
							<Link href="/login" className="underline">
								Sign in
							</Link>{" "}
							to add technologies to your radar.
						</span>
					)}
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-3">
				<Input
					placeholder="Search by technology name"
					value={search}
					onChange={handleSearchChange}
				/>

				{isLoading && (
					<p className="text-muted-foreground text-sm">Loading...</p>
				)}
				{error && <p className="text-destructive text-sm">{error}</p>}

				{!isLoading && !error && (
					<div
						ref={scrollContainerRef}
						className="max-h-72 overflow-y-auto"
						style={{ contain: "layout paint" }}
					>
						{filtered.length === 0 ? (
							<p className="text-muted-foreground py-4 text-center text-sm">
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
								{virtualizer.getVirtualItems().map((virtualItem) => (
									<div
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
										className="pb-2"
									>
										<AddTechnologyButton
											userId={userId}
											tech={filtered[virtualItem.index]}
											userTechnologyId={
												userTechnologies.find(
													(ut) =>
														ut.technology_id ===
														filtered[virtualItem.index]?.id,
												)?.id ?? null
											}
											currentRingId={
												userTechnologies.find(
													(ut) =>
														ut.technology_id ===
														filtered[virtualItem.index]?.id,
												)?.ring_id ?? null
											}
											setUserTechnologies={setUserTechnologies}
											setSelected={setSelectedTechnologyIds}
											isSelected={selectedTechnologyIds.includes(
												filtered[virtualItem.index]?.id ?? "",
											)}
											onTechnologyChange={onTechnologyChange}
										/>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</DialogContent>
	);
}
