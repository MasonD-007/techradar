"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	addTechnologyToUser,
	deleteTechnologyFromUser,
	type Technology,
	type UserTechnology,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

export default function AddTechnologyButton({
	userId,
	tech,
	userTechnologyId,
	setUserTechnologies,
	setSelected,
	isSelected,
}: {
	userId: string | null;
	tech: Technology;
	userTechnologyId: string | null;
	setSelected: React.Dispatch<React.SetStateAction<string[]>>;
	setUserTechnologies: React.Dispatch<React.SetStateAction<UserTechnology[]>>;
	isSelected: boolean;
}) {
	const [isAdding, setIsAdding] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		console.log(userTechnologyId);
	});

	const addTechnology = async () => {
		if (!userId || isSelected || isAdding || !tech.id) {
			return;
		}

		setIsAdding(true);
		try {
			const result = await addTechnologyToUser(userId, tech.id);
			console.log("Attempting to add technology with ID:", tech.id);
			if (result.success) {
				setSelected((prev) => [...prev, tech.id ?? ""]);
				if (result.data) {
					setUserTechnologies((prev) => [...prev, result.data]);
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

	return (
		<Button
			type="button"
			variant={isSelected ? "default" : "outline"}
			className={cn("flex w-full justify-between p-2 text-sm")}
			onClick={() =>
				isSelected ? void deleteTechnology() : void addTechnology()
			}
			disabled={isAdding || isDeleting || !tech.id || !isLoggedIn}
		>
			{isAdding || isDeleting ? (
				<p className="text-muted-foreground">
					{isAdding && "Adding..."}
					{isDeleting && "Deleting..."}
				</p>
			) : (
				<p className="font-medium">{tech.name}</p>
			)}
		</Button>
	);
}
