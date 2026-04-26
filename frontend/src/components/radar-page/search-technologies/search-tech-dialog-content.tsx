"use client";

import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import AddTechnologyButton from "./add-technology-button";

type Technology = {
	id: string;
	name: string;
	quadrant_id?: number;
};

type RadarClient = {
	GET(
		path: "/technologies",
		init: Record<string, never>,
	): Promise<{
		data?: Technology[];
		error?: unknown;
		response?: Response;
	}>;
};

export default function SearchTechnologiesDialogContent() {
	const [search, setSearch] = useState("");
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTechnologies = async () => {
			setIsLoading(true);
			setError(null);

			const client = api as unknown as RadarClient;
			const technologiesResult = await client.GET("/technologies", {});

			if (
				technologiesResult.error ||
				(technologiesResult.response && !technologiesResult.response.ok)
			) {
				setError("Failed to load technologies");
				setTechnologies([]);
				setIsLoading(false);
				return;
			}

			setTechnologies(technologiesResult.data || []);
			setIsLoading(false);
		};

		void fetchTechnologies();
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
							<AddTechnologyButton tech={tech} key={tech.id} />
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
