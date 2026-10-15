"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginUrlForShare } from "@/lib/share-access";
import ImportDialog from "./import-dialog";

type Props = {
	shareCode: string;
	signedIn: boolean;
	isOwnRadar?: boolean;
};

export default function CopyRadarButton({
	shareCode,
	signedIn,
	isOwnRadar = false,
}: Props) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	if (!shareCode || isOwnRadar) return null;

	if (!signedIn) {
		return (
			<Button asChild variant="outline" size="sm">
				<a href={loginUrlForShare(shareCode)}>Sign in to copy to your radar</a>
			</Button>
		);
	}

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				Copy to my radar
			</Button>
			{message && (
				<span role="status" className="text-muted-foreground text-sm">
					{message}
				</span>
			)}
			<ImportDialog
				open={open}
				onOpenChange={setOpen}
				source={{ shareCode }}
				onImported={({ added, skipped }) => {
					setMessage(`Added ${added}, skipped ${skipped}`);
					window.location.assign("/radar");
				}}
			/>
		</>
	);
}
