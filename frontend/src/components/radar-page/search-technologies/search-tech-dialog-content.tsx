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
} from "@/lib/actions";
import { useEffect, useState } from "react";
import AddTechnologyButton from "./add-technology-button";

export default function SearchTechnologiesDialogContent() {
	const [search, setSearch] = useState("");
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [selectedTechnologyIds, setSelectedTechnologyIds] = useState<string[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const userId = "demo-user"; // TODO: get from auth context

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
			const userTechnologiesResult = await getTechnologiesByUser(userId);

			if (!userTechnologiesResult.success) {
				setError(
					userTechnologiesResult.error || "Failed to load user technologies",
				);
				setSelectedTechnologyIds([]);
				return;
			}

			const selectedIds = (userTechnologiesResult.data || [])
				.map((item) => item.id)
				.filter((id): id is string => Boolean(id));

			setSelectedTechnologyIds(selectedIds);
		};

		void fetchUserTechnologies();
	}, []);

	const filtered = technologies.filter((tech) => {
		const name = tech.name || "";
		return name.toLowerCase().includes(search.toLowerCase());
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Search Technologies</DialogTitle>
				<DialogDescription>
					Find technologies available in the radar.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-3">
				<Input
					placeholder="Search by technology name"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>

				{isLoading && (
					<p className="text-muted-foreground text-sm">Loading...</p>
				)}
				{error && <p className="text-destructive text-sm">{error}</p>}

				{!isLoading && !error && (
					<div className="max-h-72 space-y-2 overflow-y-auto">
						{filtered.map((tech) => (
							<AddTechnologyButton
								userId={userId}
								tech={tech}
								selected={selectedTechnologyIds.includes(tech.id ?? "")}
								key={tech.id}
							/>
						))}
						{filtered.length === 0 && (
							<p className="text-muted-foreground text-sm">
								No technologies found.
							</p>
						)}
					</div>
				)}
			</div>
		</DialogContent>
	);
}
