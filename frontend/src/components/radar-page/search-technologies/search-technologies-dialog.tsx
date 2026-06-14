"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { getCurrentUserId } from "@/lib/actions";
import { useEffect, useState } from "react";
import SearchTechnologiesDialogContent from "./search-tech-dialog-content";

export default function SearchTechnologiesDialog({
	onTechnologyChange,
}: {
	onTechnologyChange?: () => void;
}) {
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadUserId = async () => {
			const currentUserId = await getCurrentUserId();
			if (!cancelled) {
				setUserId(currentUserId);
			}
		};

		void loadUserId();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="w-full">
					Search Technologies
				</Button>
			</DialogTrigger>
			<SearchTechnologiesDialogContent
				userId={userId}
				onTechnologyChange={onTechnologyChange}
			/>
		</Dialog>
	);
}
