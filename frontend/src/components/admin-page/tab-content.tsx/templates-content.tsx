"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { type Technology, getTechnologies } from "@/lib/actions";
import {
	type TemplateInput,
	type TemplateSummary,
	createTemplate,
	deleteTemplate,
	getTemplate,
	getTemplates,
	updateTemplate,
} from "@/lib/discovery-actions";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_ITEMS = 100;

const rings = [
	{ value: 1, label: "Adopt" },
	{ value: 2, label: "Trial" },
	{ value: 3, label: "Assess" },
	{ value: 4, label: "Hold" },
];

const selectClass =
	"h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type Item = { technology_id: string; ring_id: number };
type FormErrors = { slug?: string; name?: string; description?: string };

export default function TemplatesContent() {
	const [templates, setTemplates] = useState<TemplateSummary[]>([]);
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [listError, setListError] = useState<string | null>(null);

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const [slug, setSlug] = useState("");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [items, setItems] = useState<Item[]>([]);
	const [errors, setErrors] = useState<FormErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [pickTech, setPickTech] = useState("");
	const [pickRing, setPickRing] = useState("1");

	const [deleteTarget, setDeleteTarget] = useState<TemplateSummary | null>(
		null,
	);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const result = await getTemplates();
		if (result.success) {
			setTemplates(result.data ?? []);
			setListError(null);
		} else {
			setListError(result.error ?? "Failed to load templates");
		}
		setLoaded(true);
	}, []);

	useEffect(() => {
		refresh();
		getTechnologies().then((result) => {
			setTechnologies(result.success ? (result.data ?? []) : []);
		});
	}, [refresh]);

	const techName = (id: string) =>
		technologies.find((t) => String(t.id) === id)?.name ?? id;

	const resetForm = () => {
		setSlug("");
		setName("");
		setDescription("");
		setItems([]);
		setErrors({});
		setFormError(null);
		setPickTech("");
		setPickRing("1");
	};

	const openNew = () => {
		resetForm();
		setEditing(false);
		setIsFormOpen(true);
	};

	const openEdit = async (template: TemplateSummary) => {
		const result = await getTemplate(template.slug);
		if (!result.success || !result.data) {
			setListError(result.error ?? "Failed to load template");
			return;
		}
		resetForm();
		setEditing(true);
		setSlug(result.data.slug);
		setName(result.data.name);
		setDescription(result.data.description ?? "");
		setItems(
			(result.data.radar ?? []).map((i) => ({
				technology_id: i.technology_id,
				ring_id: i.ring_id,
			})),
		);
		setIsFormOpen(true);
	};

	const addItem = () => {
		if (!pickTech) return;
		if (items.some((i) => i.technology_id === pickTech)) return;
		if (items.length >= MAX_ITEMS) {
			setFormError(`A template can have at most ${MAX_ITEMS} technologies`);
			return;
		}
		setItems([...items, { technology_id: pickTech, ring_id: Number(pickRing) }]);
		setPickTech("");
		setFormError(null);
	};

	const validate = (): FormErrors => {
		const next: FormErrors = {};
		if (!editing) {
			if (!slug) {
				next.slug = "Slug is required";
			} else if (slug.length > 64 || !SLUG_PATTERN.test(slug)) {
				next.slug =
					"Slug must use lowercase letters, numbers and hyphens (max 64 characters)";
			}
		}
		if (!name.trim()) next.name = "Name is required";
		else if (name.length > 80) next.name = "Name must be 80 characters or fewer";
		if (description.length > 500)
			next.description = "Description must be 500 characters or fewer";
		return next;
	};

	const handleSave = async () => {
		const found = validate();
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		const input: TemplateInput = {
			slug,
			name: name.trim(),
			description,
			items,
		};
		setSaving(true);
		setFormError(null);
		try {
			const result = editing
				? await updateTemplate(input)
				: await createTemplate(input);
			if (!result.success) {
				setFormError(
					result.status === 409
						? "A template with that slug already exists"
						: (result.error ?? "Failed to save template"),
				);
				return;
			}
			setIsFormOpen(false);
			resetForm();
			await refresh();
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		const result = await deleteTemplate(deleteTarget.slug);
		if (result.success) {
			setDeleteError(null);
			await refresh();
		} else {
			setDeleteError(result.error ?? "Failed to delete template");
		}
		setDeleteTarget(null);
	};

	return (
		<>
			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete {deleteTarget?.name}? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
						<DialogDescription>
							Templates are starter sets of technologies users can copy to their
							radar.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="template-slug">Slug *</Label>
							<Input
								id="template-slug"
								value={slug}
								disabled={editing}
								onChange={(e) => setSlug(e.target.value)}
								placeholder="frontend-starter"
							/>
							{errors.slug && (
								<p className="text-red-500 text-sm">{errors.slug}</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="template-name">Name *</Label>
							<Input
								id="template-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Template name"
							/>
							{errors.name && (
								<p className="text-red-500 text-sm">{errors.name}</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="template-description">Description</Label>
							<textarea
								id="template-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Short description"
								className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							/>
							{errors.description && (
								<p className="text-red-500 text-sm">{errors.description}</p>
							)}
						</div>
						<div className="grid gap-2">
							<span className="font-medium text-sm">
								Technologies ({items.length}/{MAX_ITEMS})
							</span>
							<div className="flex gap-2">
								<select
									aria-label="Technology"
									className={`${selectClass} min-w-0 flex-1`}
									value={pickTech}
									onChange={(e) => setPickTech(e.target.value)}
								>
									<option value="">Select technology</option>
									{technologies.map((t) => (
										<option key={String(t.id)} value={String(t.id)}>
											{t.name}
										</option>
									))}
								</select>
								<select
									aria-label="Ring"
									className={selectClass}
									value={pickRing}
									onChange={(e) => setPickRing(e.target.value)}
								>
									{rings.map((r) => (
										<option key={r.value} value={String(r.value)}>
											{r.label}
										</option>
									))}
								</select>
								<Button type="button" variant="outline" onClick={addItem}>
									Add
								</Button>
							</div>
							<ul className="max-h-48 space-y-1 overflow-y-auto">
								{items.map((item) => (
									<li
										key={item.technology_id}
										className="flex items-center justify-between rounded-md border px-3 py-1 text-sm"
									>
										<span>
											{techName(item.technology_id)} {"–"}{" "}
											{rings.find((r) => r.value === item.ring_id)?.label}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											aria-label={`Remove ${techName(item.technology_id)}`}
											onClick={() =>
												setItems(
													items.filter(
														(i) => i.technology_id !== item.technology_id,
													),
												)
											}
										>
											<X className="h-4 w-4" />
										</Button>
									</li>
								))}
							</ul>
						</div>
						{formError && (
							<p role="alert" className="text-red-500 text-sm">
								{formError}
							</p>
						)}
					</div>
					<DialogFooter>
						<Button onClick={handleSave} disabled={saving}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<TabsContent value="templates">
				<div className="space-y-4">
					<div className="flex justify-end">
						<Button onClick={openNew}>
							<Plus className="mr-2 h-4 w-4" /> New template
						</Button>
					</div>
					{listError && (
						<p role="alert" className="text-red-500 text-sm">
							{listError}
						</p>
					)}
					{deleteError && (
						<p role="alert" className="text-red-500 text-sm">
							{deleteError}
						</p>
					)}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Technologies</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loaded && templates.length === 0 && (
								<TableRow>
									<TableCell colSpan={4} className="text-muted-foreground">
										No templates yet.
									</TableCell>
								</TableRow>
							)}
							{templates.map((template) => (
								<TableRow key={template.slug}>
									<TableCell className="font-medium">{template.name}</TableCell>
									<TableCell>{template.slug}</TableCell>
									<TableCell>{template.technology_count}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="icon"
												aria-label={`Edit ${template.name}`}
												onClick={() => openEdit(template)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												aria-label={`Delete ${template.name}`}
												onClick={() => setDeleteTarget(template)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</TabsContent>
		</>
	);
}
