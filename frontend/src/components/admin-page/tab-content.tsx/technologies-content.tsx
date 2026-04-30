import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import type { Technology } from "@/lib/actions";
import { createTechnology, deleteTechnology } from "@/lib/actions";

const quadrantOptions = [
	{ value: "1", label: "Tools" },
	{ value: "2", label: "Techniques" },
	{ value: "3", label: "Platforms" },
	{ value: "4", label: "Languages" },
];

export default function TechnologiesContent({
	blips,
	technologies,
	setTechnologies,
}: {
	blips: Record<string, unknown>[];
	technologies: Technology[];
	setTechnologies: (technologies: Technology[]) => void;
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [quadrantFilter, setQuadrantFilter] = useState("all");
	const [isAddTechnologyOpen, setIsAddTechnologyOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string | number;
		name: string;
	} | null>(null);
	const [newTechnology, setNewTechnology] = useState({
		name: "",
		quadrant_id: "",
		blip_id: "",
	});
	const [techFormErrors, setTechFormErrors] = useState<{
		name?: string;
		quadrant_id?: string;
	}>({});

	const handleAddTechnology = async () => {
		const errors: { name?: string; quadrant_id?: string } = {};
		if (!newTechnology.name.trim()) {
			errors.name = "Name is required";
		}
		if (!newTechnology.quadrant_id) {
			errors.quadrant_id = "Quadrant is required";
		}
		if (Object.keys(errors).length > 0) {
			setTechFormErrors(errors);
			return;
		}

		const formData = new FormData();
		formData.set("name", newTechnology.name);
		formData.set("quadrant_id", newTechnology.quadrant_id);
		if (newTechnology.blip_id) {
			formData.set("blip_id", newTechnology.blip_id);
		}
		const result = await createTechnology(formData);
		if (result.success && result.data) {
			setTechnologies([...technologies, result.data]);
			setIsAddTechnologyOpen(false);
			setNewTechnology({ name: "", quadrant_id: "", blip_id: "" });
			setTechFormErrors({});
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget?.id) return;
		const result = await deleteTechnology(String(deleteTarget.id));
		if (result.success) {
			setTechnologies(
				technologies.filter((t) => String(t.id) !== String(deleteTarget.id)),
			);
		}
		setIsDeleteOpen(false);
		setDeleteTarget(null);
	};

	const filteredTechnologies = technologies.filter((tech: Technology) => {
		const techName = tech.name || "";
		const matchesSearch =
			searchTerm === "" ||
			techName.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesQuadrant =
			quadrantFilter === "all" || String(tech.quadrant_id) === quadrantFilter;
		return matchesSearch && matchesQuadrant;
	});
	return (
		<>
			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
			<TabsContent value="technologies">
				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="relative max-w-sm flex-1">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search technologies..."
								className="pl-10"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						<Select value={quadrantFilter} onValueChange={setQuadrantFilter}>
							<SelectTrigger className="w-45">
								<SelectValue placeholder="Filter by quadrant" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Quadrants</SelectItem>
								{quadrantOptions.map((q) => (
									<SelectItem key={q.value} value={q.value}>
										{q.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Dialog
							open={isAddTechnologyOpen}
							onOpenChange={setIsAddTechnologyOpen}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className="mr-2 h-4 w-4" /> Add Technology
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add Technology</DialogTitle>
									<DialogDescription>
										Add a new technology to the radar
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="name">Name *</Label>
										<Input
											id="name"
											value={newTechnology.name}
											onChange={(e) => {
												setNewTechnology({
													...newTechnology,
													name: e.target.value,
												});
												if (techFormErrors.name) {
													setTechFormErrors({
														...techFormErrors,
														name: undefined,
													});
												}
											}}
											placeholder="Technology name"
										/>
										{techFormErrors.name && (
											<p className="text-red-500 text-sm">
												{techFormErrors.name}
											</p>
										)}
									</div>
									<div className="grid gap-2">
										<Label htmlFor="quadrant">Quadrant *</Label>
										<Select
											value={newTechnology.quadrant_id}
											onValueChange={(v) => {
												setNewTechnology({
													...newTechnology,
													quadrant_id: v,
												});
												if (techFormErrors.quadrant_id) {
													setTechFormErrors({
														...techFormErrors,
														quadrant_id: undefined,
													});
												}
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select quadrant" />
											</SelectTrigger>
											<SelectContent>
												{quadrantOptions.map((q) => (
													<SelectItem key={q.value} value={q.value}>
														{q.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{techFormErrors.quadrant_id && (
											<p className="text-red-500 text-sm">
												{techFormErrors.quadrant_id}
											</p>
										)}
									</div>
									<div className="grid gap-2">
										<Label htmlFor="blip">Blip (Optional)</Label>
										<Select
											value={newTechnology.blip_id}
											onValueChange={(v) =>
												setNewTechnology({
													...newTechnology,
													blip_id: v,
												})
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select blip" />
											</SelectTrigger>
											<SelectContent>
												{blips.map((b: Record<string, unknown>) => (
													<SelectItem key={String(b.id)} value={String(b.id)}>
														Blip {String(b.id)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button onClick={handleAddTechnology}>Save</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Quadrant</TableHead>
								<TableHead>Blip</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredTechnologies.map((tech) => (
								<TableRow key={String(tech.id)}>
									<TableCell className="font-medium">{tech.name}</TableCell>
									<TableCell>
										{
											quadrantOptions.find(
												(q) => Number(q.value) === tech.quadrant_id,
											)?.label
										}
									</TableCell>
									<TableCell>{tech.blip_id || "-"}</TableCell>
									<TableCell>{tech.created_at}</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setDeleteTarget({
														id: tech.id,
														name: tech.name,
													});
													setIsDeleteOpen(true);
												}}
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
