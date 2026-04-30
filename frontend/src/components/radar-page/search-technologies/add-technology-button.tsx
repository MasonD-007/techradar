"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addTechnologyToUser, type Technology } from "@/lib/actions";

export default function AddTechnologyButton({
	userId,
	tech,
	selected,
}: {
	userId: string | null;
	tech: Technology;
	selected?: boolean;
}) {
	const [isAdding, setIsAdding] = useState(false);

	const addTechnology = async () => {
		if (!userId || selected || isAdding || !tech.id) {
			return;
		}

		setIsAdding(true);
		try {
			await addTechnologyToUser(userId, tech.id);
		} finally {
			setIsAdding(false);
		}
	};

	const isLoggedIn = !!userId;

	return (
		<Button
			type="button"
			variant={selected ? "secondary" : "outline"}
			className="flex w-full justify-between p-2 text-sm"
			onClick={() => void addTechnology()}
			disabled={selected || isAdding || !tech.id || !isLoggedIn}
		>
			<p className="font-medium">{tech.name}</p>
			<p className="text-muted-foreground">
				{selected || isAdding
					? "Added"
					: !isLoggedIn
						? "Sign in to add"
						: `Quadrant: ${tech.quadrant_id ?? "-"}`}
			</p>
		</Button>
	);
}
