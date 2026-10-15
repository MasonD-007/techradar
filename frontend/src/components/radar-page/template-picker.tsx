"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getTemplates, type TemplateSummary } from "@/lib/discovery-actions";
import ImportDialog from "./import-dialog";

type Props = { onDone: () => void };

export default function TemplatePicker({ onDone }: Props) {
	const [templates, setTemplates] = useState<TemplateSummary[]>([]);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [slug, setSlug] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const result = await getTemplates();
				if (cancelled) return;
				if (result.success) {
					setTemplates(result.data ?? []);
					setStatus("ready");
				} else {
					setStatus("error");
				}
			} catch {
				if (!cancelled) setStatus("error");
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, []);

	if (status === "loading") {
		return <p className="text-muted-foreground text-sm">Loading templates...</p>;
	}
	if (status === "error") {
		return (
			<p className="text-muted-foreground text-sm">Couldn&apos;t load templates</p>
		);
	}
	if (templates.length === 0) return null;

	return (
		<div className="grid gap-3 p-4 sm:grid-cols-2">
			{templates.map((template) => (
				<Card key={template.slug}>
					<CardHeader>
						<CardTitle>{template.name}</CardTitle>
						<CardDescription>{template.description}</CardDescription>
						<p className="text-muted-foreground text-xs">
							{template.technology_count} technologies
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSlug(template.slug)}
						>
							Preview
						</Button>
					</CardHeader>
				</Card>
			))}
			{slug && (
				<ImportDialog
					open
					onOpenChange={(next) => {
						if (!next) setSlug(null);
					}}
					source={{ templateSlug: slug }}
					onImported={({ added, skipped }) => {
						toast.success(`Added ${added}, skipped ${skipped}`);
						onDone();
					}}
				/>
			)}
		</div>
	);
}
