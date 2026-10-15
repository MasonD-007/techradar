"use client";

import { Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	addShareViewer,
	getMyShareCode,
	getShareViewers,
	removeShareViewer,
	setShareListed,
	setShareVisibility,
} from "@/lib/actions";

type ShareButtonProps = {
	shareCode: string;
};

export default function ShareButton({ shareCode }: ShareButtonProps) {
	const [copied, setCopied] = useState(false);
	const [open, setOpen] = useState(false);
	// The share code the current viewer was verified as owner of; the owner
	// controls only show while this matches the shareCode prop.
	const [ownerOf, setOwnerOf] = useState<string | null>(null);
	const isOwner = open && ownerOf === shareCode;
	const [visibility, setVisibility] = useState<"public" | "private">("private");
	const [listed, setListed] = useState(false);
	const [viewers, setViewers] = useState<string[]>([]);
	const [username, setUsername] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	// Incremented whenever the dialog's owner session changes (open, close,
	// shareCode change, unmount) so late responses can be discarded.
	const generation = useRef(0);

	const refreshViewers = async () => {
		const gen = generation.current;
		const result = await getShareViewers();
		if (gen !== generation.current) return;
		if (result.success) setViewers(result.data ?? []);
		else setError(result.error ?? "Failed to load viewers");
	};

	useEffect(() => {
		generation.current += 1;
		if (!open) return;
		const gen = generation.current;
		const load = async () => {
			try {
				const mine = await getMyShareCode();
				if (gen !== generation.current) return;
				const owner = mine.success && mine.data?.code === shareCode;
				if (!owner) return;
				setError(null);
				setViewers([]);
				setVisibility(
					mine.data?.visibility === "public" ? "public" : "private",
				);
				setListed(mine.data?.listed === true);
				setOwnerOf(shareCode);
				await refreshViewers();
			} catch {
				// Leave owner controls hidden when ownership cannot be verified.
			}
		};
		void load();
		return () => {
			generation.current += 1;
		};
	}, [open, shareCode]);

	const handleOpenChange = (next: boolean) => {
		setOwnerOf(null);
		setViewers([]);
		setVisibility("private");
		setListed(false);
		setError(null);
		setUsername("");
		setOpen(next);
	};

	const handleVisibility = async (next: "public" | "private") => {
		if (pending) return;
		setError(null);
		setPending(true);
		try {
			const result = await setShareVisibility(next);
			if (result.success) {
				setVisibility(next);
				// The server clears the listing when going private; public->public keeps it.
				if (next === "private") setListed(false);
			} else setError(result.error ?? "Failed to update visibility");
		} finally {
			setPending(false);
		}
	};

	const handleListed = async (next: boolean) => {
		if (pending) return;
		setError(null);
		setPending(true);
		try {
			const result = await setShareListed(next);
			if (result.success) setListed(next);
			else setError(result.error ?? "Failed to update gallery listing");
		} finally {
			setPending(false);
		}
	};

	const handleAdd = async () => {
		const name = username.trim();
		if (!name) return;
		setError(null);
		const result = await addShareViewer(name);
		if (!result.success) {
			setError(result.error ?? "Failed to add viewer");
			return;
		}
		setUsername("");
		await refreshViewers();
	};

	const handleRemove = async (name: string) => {
		setError(null);
		const result = await removeShareViewer(name);
		if (!result.success) {
			setError(result.error ?? "Failed to remove viewer");
			return;
		}
		await refreshViewers();
	};

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
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Share
					aria-label="Share tech radar"
					role="button"
					size={20}
					className="mb-1 cursor-pointer self-end text-muted-foreground hover:text-foreground"
				/>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Share tech radar</DialogTitle>
					<DialogDescription>
						Share this URL or share code. Who can open it depends on the
						visibility setting.
					</DialogDescription>
				</DialogHeader>
				<div className="flex w-full flex-col gap-4 overflow-hidden">
					{isOwner && (
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Who can view
								</span>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant={visibility === "public" ? "default" : "outline"}
										disabled={pending}
										onClick={() => handleVisibility("public")}
									>
										Public
									</Button>
									<Button
										size="sm"
										variant={visibility === "private" ? "default" : "outline"}
										disabled={pending}
										onClick={() => handleVisibility("private")}
									>
										Private
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									{visibility === "public"
										? 'Anyone with the link can view, no account needed. Tick "List in gallery" to also let people discover it.'
										: "Only the people below can view, and they must be signed in."}
								</p>
								{visibility === "public" && (
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={listed}
											disabled={pending}
											onChange={(e) => void handleListed(e.target.checked)}
										/>
										List in gallery
									</label>
								)}
							</div>
							{visibility === "private" && (
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<Input
											placeholder="Username"
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") void handleAdd();
											}}
										/>
										<Button variant="outline" size="sm" onClick={handleAdd}>
											Add
										</Button>
									</div>
									<ul className="flex flex-col gap-1">
										{viewers.map((name) => (
											<li
												key={name}
												className="flex items-center justify-between text-sm"
											>
												<span>{name}</span>
												<Button
													variant="ghost"
													size="sm"
													aria-label={`Remove ${name}`}
													onClick={() => handleRemove(name)}
												>
													Remove
												</Button>
											</li>
										))}
									</ul>
								</div>
							)}
							{error && <p className="text-destructive text-xs">{error}</p>}
						</div>
					)}
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
