"use client";

import { Share } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type ShareButtonProps = {
	shareCode: string;
};

export default function ShareButton({ shareCode }: ShareButtonProps) {
	const [copied, setCopied] = useState(false);
	const [open, setOpen] = useState(false);

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/radar?share=${shareCode}`
			: null;

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Share
					size={20}
					className="mb-1 cursor-pointer self-end text-muted-foreground hover:text-foreground"
				/>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Share tech radar</DialogTitle>
					<DialogDescription>
						Share this URL or share code with others to let them view your tech
						radar.
					</DialogDescription>
				</DialogHeader>
				<div className="flex w-full flex-col gap-4 overflow-hidden">
					<div className="flex flex-col gap-1.5">
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							URL
						</span>
						<div className="flex items-center gap-2 overflow-hidden">
							<code className="block min-w-0 flex-1 truncate rounded-lg border bg-muted px-3 py-2 text-sm">
								{shareUrl}
							</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (shareUrl) handleCopy(shareUrl);
								}}
							>
								{copied ? "Copied" : "Copy"}
							</Button>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							Share code
						</span>
						<div className="flex items-center gap-2 overflow-hidden">
							<code className="block min-w-0 flex-1 truncate rounded-lg border bg-muted px-3 py-2 text-sm">
								{shareCode}
							</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleCopy(shareCode)}
							>
								{copied ? "Copied" : "Copy"}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
