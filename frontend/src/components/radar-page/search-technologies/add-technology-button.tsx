"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addTechnologyToUser, type Technology } from "@/lib/actions";

export default function AddTechnologyButton({
	userId,
	tech,
	selected,
}: {
	userId: string;
	// TODO: make typesafe
	tech: Technology;
	selected?: boolean;
}) {
	const [isAdding, setIsAdding] = useState(false);

	const addTechnology = async () => {
		if (selected || isAdding || !tech.id) {
			return;
		}

		setIsAdding(true);
		try {
			await addTechnologyToUser(userId, tech.id);
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<Button
			type="button"
			variant={selected ? "secondary" : "outline"}
			className="flex w-full justify-between p-2 text-sm"
			onClick={() => void addTechnology()}
			disabled={selected || isAdding || !tech.id}
		>
			<p className="font-medium">{tech.name}</p>
			<p className="text-muted-foreground">
				{selected || isAdding
					? "Added"
					: `Quadrant: ${tech.quadrant_id ?? "-"}`}
			</p>
		</Button>
	);
}
