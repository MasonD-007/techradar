"use client";

import Image from "next/image";
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
	updateTechnologyInUser,
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
	const [isUpdating, setIsUpdating] = useState(false);
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

	const updateSelectedTechnologyRing = (
		nextRingId: number,
		updatedRingId: number,
	) => {
		if (!userTechnologyId) {
			return;
		}

		setUserTechnologies((prev) =>
			prev.map((userTechnology) =>
				userTechnology.id === userTechnologyId
					? { ...userTechnology, ring_id: updatedRingId }
					: userTechnology,
			),
		);

		setRingId(String(nextRingId));
	};

	const handleRingChange = async (nextRingValue: string) => {
		setRingId(nextRingValue);

		if (!isSelected || !userId || !userTechnologyId || !tech.id) {
			return;
		}

		const nextRingId = Number.parseInt(nextRingValue, 10);
		if (Number.isNaN(nextRingId)) {
			return;
		}

		const currentRingValue = currentRingId ? String(currentRingId) : "";
		if (currentRingValue === nextRingValue) {
			return;
		}

		setIsUpdating(true);
		try {
			const result = await updateTechnologyInUser(
				userTechnologyId,
				userId,
				tech.id,
				nextRingId,
			);

			if (result.success) {
				updateSelectedTechnologyRing(
					nextRingId,
					result.data?.ring_id ?? nextRingId,
				);
			} else {
				setRingId(currentRingValue);
				console.log("Failed to update technology ring:", result.error);
			}
		} finally {
			setIsUpdating(false);
		}
	};

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
				<span className="flex items-center gap-2">
					{tech.icon_url && (
						<Image
							src={tech.icon_url}
							alt=""
							width={20}
							height={20}
							className="h-5 w-5 shrink-0"
						/>
					)}
					<p className="font-medium leading-none">{tech.name}</p>
				</span>
				{isSelected && (
					<Badge variant="outline" className="border-primary/20 text-primary">
						Selected
					</Badge>
				)}
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Select
					value={ringId}
					onValueChange={(value) => void handleRingChange(value)}
					disabled={!isLoggedIn || isAdding || isDeleting || isUpdating}
				>
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
						isUpdating ||
						!tech.id ||
						!isLoggedIn ||
						(!isSelected && !ringId)
					}
				>
					{isAdding || isDeleting ? (
						<p className="text-muted-foreground">
							{isAdding && "Adding..."}
							{isDeleting && "Deleting..."}
							{isUpdating && "Updating..."}
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
