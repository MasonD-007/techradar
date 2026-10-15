"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getMyRadarGraph, getRadarGraphByCode } from "@/lib/actions";
import {
	getTemplate,
	type ImportItem,
	type ImportSourceArg,
	importRadar,
} from "@/lib/discovery-actions";

type ImportDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	source: ImportSourceArg;
	onImported: (result: { added: number; skipped: number }) => void;
};

type Status = "loading" | "ready" | "error";

export default function ImportDialog({
	open,
	onOpenChange,
	source,
	onImported,
}: ImportDialogProps) {
	const [status, setStatus] = useState<Status>("loading");
	const [loadError, setLoadError] = useState<string | null>(null);
	const [items, setItems] = useState<ImportItem[]>([]);
	const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [importing, setImporting] = useState(false);
	const [importError, setImportError] = useState<string | null>(null);

	// Incremented on open/close/source change/unmount so stale loads are dropped.
	const generation = useRef(0);
	const submitting = useRef(false);

	const shareCode = "shareCode" in source ? source.shareCode : null;
	const templateSlug = "templateSlug" in source ? source.templateSlug : null;

	useEffect(() => {
		generation.current += 1;
		if (!open) return;
		const gen = generation.current;
		setStatus("loading");
		setLoadError(null);
		setImportError(null);
		setItems([]);

		const load = async () => {
			try {
				const [sourceResult, mine] = await Promise.all([
					shareCode !== null
						? getRadarGraphByCode(shareCode).then((r) => ({
								success: r.success,
								error: r.error,
								items: (r.data?.radar ?? []) as unknown as ImportItem[],
							}))
						: getTemplate(templateSlug ?? "").then((r) => ({
								success: r.success,
								error: r.error,
								items: r.data?.radar ?? [],
							})),
					getMyRadarGraph().catch(() => null),
				]);
				if (gen !== generation.current) return;
				if (!sourceResult.success) {
					setLoadError(sourceResult.error ?? "Failed to load radar");
					setStatus("error");
					return;
				}
				const owned = new Set<string>();
				if (mine?.success) {
					for (const entry of (mine.data?.radar ?? []) as unknown as {
						technology_id: string;
					}[]) {
						owned.add(entry.technology_id);
					}
				}
				setItems(sourceResult.items);
				setOwnedIds(owned);
				setSelected(
					new Set(
						sourceResult.items
							.map((i) => i.technology_id)
							.filter((id) => !owned.has(id)),
					),
				);
				setStatus("ready");
			} catch {
				if (gen !== generation.current) return;
				setLoadError("Failed to load radar");
				setStatus("error");
			}
		};
		void load();

		return () => {
			generation.current += 1;
		};
	}, [open, shareCode, templateSlug]);

	const selectableIds = items
		.map((i) => i.technology_id)
		.filter((id) => !ownedIds.has(id));

	const toggle = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const confirm = async () => {
		if (submitting.current || selected.size === 0) return;
		submitting.current = true;
		const gen = generation.current;
		setImporting(true);
		setImportError(null);
		try {
			const result = await importRadar(source, [...selected]);
			if (gen !== generation.current) return;
			if (result.success && result.data) {
				onImported(result.data);
				onOpenChange(false);
			} else {
				setImportError(result.error ?? "Failed to import");
			}
		} catch {
			if (gen === generation.current) setImportError("Failed to import");
		} finally {
			submitting.current = false;
			setImporting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (submitting.current) return;
				onOpenChange(next);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Copy to my radar</DialogTitle>
					<DialogDescription>
						Choose the technologies to add to your radar.
					</DialogDescription>
				</DialogHeader>

				{status === "loading" && (
					<p className="text-muted-foreground text-sm">Loading...</p>
				)}
				{status === "error" && (
					<p role="alert" className="text-destructive text-sm">
						{loadError}
					</p>
				)}
				{status === "ready" && (
					<>
						<div className="flex items-center justify-between text-sm">
							<span>{selected.size} selected</span>
							<span className="flex gap-1">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={importing}
									onClick={() => setSelected(new Set(selectableIds))}
								>
									Select all
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={importing}
									onClick={() => setSelected(new Set())}
								>
									Select none
								</Button>
							</span>
						</div>
						<ul className="max-h-80 overflow-y-auto">
							{items.map((item) => {
								const owned = ownedIds.has(item.technology_id);
								return (
									<li
										key={item.technology_id}
										className="flex items-center gap-2 py-1"
									>
										<input
											type="checkbox"
											id={`import-${item.technology_id}`}
											checked={selected.has(item.technology_id)}
											disabled={owned || importing}
											onChange={() => toggle(item.technology_id)}
										/>
										<label
											htmlFor={`import-${item.technology_id}`}
											className="flex-1"
										>
											{item.name}
										</label>
										<Badge variant="secondary">{item.ring_name}</Badge>
										{owned && (
											<span className="text-muted-foreground text-xs">
												already on your radar
											</span>
										)}
									</li>
								);
							})}
						</ul>
						{importError && (
							<p role="alert" className="text-destructive text-sm">
								{importError}
							</p>
						)}
						<Button
							type="button"
							disabled={selected.size === 0 || importing}
							onClick={() => void confirm()}
						>
							{importError ? "Retry" : `Copy ${selected.size} technologies`}
						</Button>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
