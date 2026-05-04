"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import AddTechnologyButton from "./add-technology-button";

interface SearchTechnologiesDialogContentProps {
	userId: string | null;
}

export default function SearchTechnologiesDialogContent({
	userId,
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
			// console.log("Fetched technologies:", technologiesResult.data);
			setIsLoading(false);
		};

		void fetchTechnologies();
	}, []);

	useEffect(() => {
		// console.log("User ID changed:", userId);
		const fetchUserTechnologies = async () => {
			if (!userId) {
				setSelectedTechnologyIds([]);
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
			// console.log("Fetched user technologies:", userTechIds);
		};
		void fetchUserTechnologies();
	}, [userId]);

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
								userTechnologyId={
									userTechnologies.find((ut) => ut.technology_id === tech.id)
										?.id ?? null
								}
								setUserTechnologies={setUserTechnologies}
								setSelected={setSelectedTechnologyIds}
								isSelected={selectedTechnologyIds.includes(tech.id ?? "")}
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
