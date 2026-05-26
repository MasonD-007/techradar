"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	addTechnologyToUser,
	deleteTechnologyFromUser,
	type Technology,
	type UserTechnology,
} from "@/lib/actions";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ringLabels } from "../radar-data";

export default function AddTechnologyButton({
	userId,
	tech,
	userTechnologyId,
	currentRingId,
	setUserTechnologies,
	setSelected,
	isSelected,
}: {
	userId: string | null;
	tech: Technology;
	userTechnologyId: string | null;
	currentRingId: number | null;
	setSelected: React.Dispatch<React.SetStateAction<string[]>>;
	setUserTechnologies: React.Dispatch<React.SetStateAction<UserTechnology[]>>;
	isSelected: boolean;
}) {
	const [isAdding, setIsAdding] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [ringId, setRingId] = useState("");

	useEffect(() => {
		if (currentRingId) {
			setRingId(String(currentRingId));
			return;
		}

		setRingId("");
	}, [currentRingId]);

	const ringOptions = ringLabels.map((ring, index) => ({
		label: ring.title,
		value: String(index + 1),
	}));

	const addTechnology = async () => {
		if (!userId || isSelected || isAdding || !tech.id || !ringId) {
			return;
		}

		const parsedRingId = Number.parseInt(ringId, 10);
		if (Number.isNaN(parsedRingId)) {
			return;
		}

		setIsAdding(true);
		try {
			const result = await addTechnologyToUser(userId, tech.id, parsedRingId);
			console.log("Attempting to add technology with ID:", tech.id);
			if (result.success) {
				setSelected((prev) => [...prev, tech.id ?? ""]);
				const addedTechnology = result.data;
				if (addedTechnology) {
					setUserTechnologies((prev) => [...prev, addedTechnology]);
				}
			} else {
				console.log("Failed to add technology:", result.error);
			}
		} finally {
			setIsAdding(false);
		}
	};

	const deleteTechnology = async () => {
		if (!userId || !isSelected || isDeleting || !userTechnologyId) {
			return;
		}
		console.log("Attempting to delete technology with ID:", userTechnologyId);
		// console.log("calling deleteTechnology after auth");
		setIsDeleting(true);
		try {
			const result = await deleteTechnologyFromUser(userTechnologyId);
			if (result.success) {
				setSelected((prev) => prev.filter((id) => id !== tech.id));
				setUserTechnologies((prev) =>
					prev.filter((ut) => ut.id !== userTechnologyId),
				);
				console.log("Deleted technology successfully");
			} else {
				console.log("Failed to delete technology:", result.error);
			}
		} finally {
			setIsDeleting(false);
		}
	};

	const isLoggedIn = !!userId;
	const selectedRingLabel = ringOptions.find(
		(ring) => ring.value === ringId,
	)?.label;

	return (
		<div
			className={cn(
				"flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm",
				isSelected && "border-primary/30 bg-primary/5",
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<p className="font-medium leading-none">{tech.name}</p>
				{isSelected && (
					<Badge variant="outline" className="border-primary/20 text-primary">
						Selected
					</Badge>
				)}
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Select value={ringId} onValueChange={setRingId} disabled={!isLoggedIn}>
					<SelectTrigger className="w-full sm:w-40">
						<SelectValue placeholder="Select ring" />
					</SelectTrigger>
					<SelectContent>
						{ringOptions.map((ring) => (
							<SelectItem key={ring.value} value={ring.value}>
								{ring.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					type="button"
					variant={isSelected ? "default" : "outline"}
					className={cn("w-full sm:w-auto")}
					onClick={() =>
						isSelected ? void deleteTechnology() : void addTechnology()
					}
					disabled={
						isAdding ||
						isDeleting ||
						!tech.id ||
						!isLoggedIn ||
						(!isSelected && !ringId)
					}
				>
					{isAdding || isDeleting ? (
						<p className="text-muted-foreground">
							{isAdding && "Adding..."}
							{isDeleting && "Deleting..."}
						</p>
					) : isSelected ? (
						<p>Remove</p>
					) : (
						<p>Add to {selectedRingLabel || "ring"}</p>
					)}
				</Button>
			</div>
		</div>
	);
}
