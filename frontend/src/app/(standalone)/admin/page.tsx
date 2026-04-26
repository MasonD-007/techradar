"use client";

import { KeyValueBuilder } from "@/components/key-value-builder";
import { ThemeToggle } from "@/components/light-dark-button";
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
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Blip,
	createBlip,
	createTechnology,
	deleteBlip,
	deleteTechnology,
	deleteUser,
	getBlips,
	getTechnologies,
	getUsers,
	type Technology,
	type User as UserType,
} from "@/lib/actions";
import {
	AlertCircle,
	Download,
	Eye,
	Plus,
	Search,
	Trash2,
	Upload,
	UserMinus,
	UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

const mockActivity = [
	{
		id: "1",
		action_type: "Technology Created",
		description: "Added React to tools quadrant",
		user: "Admin",
		created_at: "2026-04-15 10:30",
	},
	{
		id: "2",
		action_type: "User Created",
		description: "Created user John Doe",
		user: "Admin",
		created_at: "2026-04-15 09:15",
	},
	{
		id: "3",
		action_type: "Technology Updated",
		description: "Updated TypeScript quadrant",
		user: "Admin",
		created_at: "2026-04-14 16:45",
	},
	{
		id: "4",
		action_type: "Blip Deleted",
		description: "Removed old blip data",
		user: "Admin",
		created_at: "2026-04-14 14:20",
	},
	{
		id: "5",
		action_type: "Bulk Import",
		description: "Imported 10 technologies",
		user: "Admin",
		created_at: "2026-04-13 11:00",
	},
	{
		id: "6",
		action_type: "Technology Created",
		description: "Added Docker to tools",
		user: "Admin",
		created_at: "2026-04-13 09:30",
	},
	{
		id: "7",
		action_type: "User Deleted",
		description: "Removed user test@example.com",
		user: "Admin",
		created_at: "2026-04-12 15:00",
	},
	{
		id: "8",
		action_type: "Technology Created",
		description: "Added Kubernetes to platforms",
		user: "Admin",
		created_at: "2026-04-12 11:45",
	},
];

const quadrantOptions = [
	{ value: "1", label: "Tools" },
	{ value: "2", label: "Techniques" },
	{ value: "3", label: "Platforms" },
	{ value: "4", label: "Languages" },
];

function getActionIcon(actionType: string) {
	switch (actionType) {
		case "Technology Created":
			return <Plus className="h-4 w-4 text-green-500" />;
		case "Technology Updated":
			return <Eye className="h-4 w-4 text-blue-500" />;
		case "Technology Deleted":
			return <Trash2 className="h-4 w-4 text-red-500" />;
		case "Blip Created":
			return <Plus className="h-4 w-4 text-green-500" />;
		case "Blip Deleted":
			return <Trash2 className="h-4 w-4 text-red-500" />;
		case "User Created":
			return <UserPlus className="h-4 w-4 text-green-500" />;
		case "User Deleted":
			return <UserMinus className="h-4 w-4 text-red-500" />;
		case "Bulk Import":
			return <Upload className="h-4 w-4 text-purple-500" />;
		case "Bulk Export":
			return <Download className="h-4 w-4 text-purple-500" />;
		default:
			return <AlertCircle className="h-4 w-4 text-gray-500" />;
	}
}

export default function AdminPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [quadrantFilter, setQuadrantFilter] = useState("all");
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [blips, setBlips] = useState<Blip[]>([]);
	const [users, setUsers] = useState<UserType[]>([]);
	const [isAddTechnologyOpen, setIsAddTechnologyOpen] = useState(false);
	const [isAddBlipOpen, setIsAddBlipOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{
		type: string;
		id?: string;
		name?: string;
	} | null>(null);
	const [newTechnology, setNewTechnology] = useState({
		name: "",
		quadrant_id: "",
		blip_id: "",
	});
	const [newBlipContext, setNewBlipContext] = useState<Record<string, string>>(
		{},
	);
	const [blipFormErrors, setBlipFormErrors] = useState<{ context?: string }>(
		{},
	);
	const [techFormErrors, setTechFormErrors] = useState<{
		name?: string;
		quadrant_id?: string;
	}>({});
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importPreview, setImportPreview] = useState<
		{ name: string; quadrant_id: string }[] | null
	>(null);
	const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

	useEffect(() => {
		async function loadData() {
			const [techs, bips, usrs] = await Promise.all([
				getTechnologies(),
				getBlips(),
				getUsers(),
			]);
			setTechnologies(techs.success ? (techs.data ?? []) : []);
			setBlips(bips as typeof blips);
			setUsers(usrs);
		}
		loadData();
	}, []);

	const stats = {
		totalTechnologies: technologies.length,
		totalUsers: users.length,
		totalBlips: blips.length,
		quadrants: {
			tools: technologies.filter((t) => t.quadrant_id === 1).length,
			techniques: technologies.filter((t) => t.quadrant_id === 2).length,
			platforms: technologies.filter((t) => t.quadrant_id === 3).length,
			languages: technologies.filter((t) => t.quadrant_id === 4).length,
		},
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
		if (result.success) {
			setTechnologies([...technologies, result.data!]);
			setIsAddTechnologyOpen(false);
			setNewTechnology({ name: "", quadrant_id: "", blip_id: "" });
			setTechFormErrors({});
		}
	};

	const handleAddBlip = async () => {
		const errors: { context?: string } = {};
		if (Object.keys(newBlipContext).length === 0) {
			errors.context = "At least one field is required";
		}
		if (Object.keys(errors).length > 0) {
			setBlipFormErrors(errors);
			return;
		}

		try {
			const formData = new FormData();
			formData.set("context", JSON.stringify(newBlipContext));
			const result = await createBlip(formData);
			if (result.success) {
				setBlips([...blips, result.data!]);
				setIsAddBlipOpen(false);
				setNewBlipContext({});
				setBlipFormErrors({});
			}
		} catch {
			setBlipFormErrors({ context: "Invalid JSON format" });
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget || !deleteTarget.id) return;
		if (deleteTarget.type === "technology") {
			const result = await deleteTechnology(deleteTarget.id);
			if (result.success) {
				setTechnologies(technologies.filter((t) => t.id !== deleteTarget.id));
			}
		} else if (deleteTarget.type === "blip") {
			const result = await deleteBlip(Number(deleteTarget.id));
			if (result.success) {
				setBlips(blips.filter((b) => b.id !== Number(deleteTarget.id)));
			}
		} else if (deleteTarget.type === "user") {
			const result = await deleteUser(deleteTarget.id);
			if (result.success) {
				setUsers(users.filter((u) => u.id !== deleteTarget.id));
			}
		}
		setIsDeleteOpen(false);
		setDeleteTarget(null);
	};

	const handleExport = () => {
		const data = {
			technologies: technologies.map((t) => ({
				name: t.name,
				quadrant_id: t.quadrant_id,
				blip_id: t.blip_id,
			})),
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "technologies.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImportFile = (file: File) => {
		setImportFile(file);
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);
				if (data.technologies) {
					setImportPreview(data.technologies);
					const hasConflicts = data.technologies.some((t: { name: string }) =>
						technologies.some((existing) => existing.name === t.name),
					);
					if (hasConflicts) {
						setConflictDialogOpen(true);
					}
				}
			} catch {
				alert("Invalid JSON file");
			}
		};
		reader.readAsText(file);
	};

	const handleConfirmImport = () => {
		if (!importPreview) return;
		const newTechs = importPreview.map((t, idx) => ({
			id: String(technologies.length + idx + 1),
			name: t.name,
			quadrant_id: Number(t.quadrant_id),
			blip_id: undefined,
			created_at: new Date().toISOString().split("T")[0],
		}));
		setTechnologies([...technologies, ...newTechs]);
		setImportFile(null);
		setImportPreview(null);
		setConflictDialogOpen(false);
	};

	return (
		<div className="min-h-screen space-y-6 bg-background p-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-3xl">Admin Dashboard</h1>
				<ThemeToggle className="size-10 cursor-pointer rounded-full" />
			</div>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="technologies">Technologies</TabsTrigger>
					<TabsTrigger value="blips">Blips</TabsTrigger>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="import">Import/Export</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Total Technologies
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">
										{stats.totalTechnologies}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Total Users
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">{stats.totalUsers}</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Total Blips
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">{stats.totalBlips}</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Recent Activities
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">
										{mockActivity.length}
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Tools Quadrant
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">
										{stats.quadrants.tools}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Techniques Quadrant
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">
										{stats.quadrants.techniques}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Platforms Quadrant
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">
										{stats.quadrants.platforms}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Languages Quadrant
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-bold text-2xl">
										{stats.quadrants.languages}
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle>Recent Technologies</CardTitle>
									<CardDescription>Last 5 technologies added</CardDescription>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Name</TableHead>
												<TableHead>Quadrant</TableHead>
												<TableHead>Created</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{technologies
												.slice(0, 5)
												.map((tech: Record<string, unknown>) => (
													<TableRow key={String(tech.id)}>
														<TableCell className="font-medium">
															{String(tech.name || "")}
														</TableCell>
														<TableCell>
															{String(tech.quadrant_id || "-")}
														</TableCell>
														<TableCell>
															{String(tech.created_at || "-")}
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Recent Users</CardTitle>
									<CardDescription>Last 5 users created</CardDescription>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Name</TableHead>
												<TableHead>Email</TableHead>
												<TableHead>Created</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{users
												.slice(0, 5)
												.map((user: Record<string, unknown>) => (
													<TableRow key={String(user.id)}>
														<TableCell className="font-medium">
															{String(user.name || "")}
														</TableCell>
														<TableCell>{String(user.email || "")}</TableCell>
														<TableCell>
															{String(user.created_at || "-")}
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Activity Log</CardTitle>
								<CardDescription>Recent admin actions</CardDescription>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Time</TableHead>
											<TableHead>Action</TableHead>
											<TableHead>Description</TableHead>
											<TableHead>User</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{mockActivity.map((activity) => (
											<TableRow key={String(activity.id)}>
												<TableCell>{activity.created_at}</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														{getActionIcon(activity.action_type)}
														{activity.action_type}
													</div>
												</TableCell>
												<TableCell>{activity.description}</TableCell>
												<TableCell>{activity.user}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

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
								<SelectTrigger className="w-[180px]">
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
															type: "technology",
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

				<TabsContent value="blips">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="relative max-w-sm flex-1">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input placeholder="Search blips..." className="pl-10" />
							</div>
							<Dialog open={isAddBlipOpen} onOpenChange={setIsAddBlipOpen}>
								<DialogTrigger asChild>
									<Button>
										<Plus className="mr-2 h-4 w-4" /> Add Blip
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add Blip</DialogTitle>
										<DialogDescription>
											Add a new blip context with key-value pairs
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<KeyValueBuilder
											label="Context Fields"
											onChange={setNewBlipContext}
											initialValue={newBlipContext}
										/>
										{blipFormErrors.context && (
											<p className="text-red-500 text-sm">
												{blipFormErrors.context}
											</p>
										)}
									</div>
									<DialogFooter>
										<Button onClick={handleAddBlip}>Save</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Context Preview</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead>Updated At</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{blips.map((blip) => (
									<TableRow key={blip.id}>
										<TableCell className="font-medium">{blip.id}</TableCell>
										<TableCell className="font-mono text-xs">
											{JSON.stringify(blip.context).slice(0, 50)}...
										</TableCell>
										<TableCell>{blip.created_at}</TableCell>
										<TableCell>{blip.updated_at}</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setDeleteTarget({
															type: "blip",
															id: String(blip.id),
															name: `Blip ${blip.id}`,
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

				<TabsContent value="users">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="relative max-w-sm flex-1">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input placeholder="Search users..." className="pl-10" />
							</div>
						</div>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Last Login</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => (
									<TableRow key={String(user.id)}>
										<TableCell className="font-medium">{user.name}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>{user.username}</TableCell>
										<TableCell>{user.last_logged_in}</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setDeleteTarget({
															type: "user",
															id: user.id,
															name: user.name,
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

				<TabsContent value="import">
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Export</CardTitle>
								<CardDescription>
									Export all technologies as JSON
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button onClick={handleExport}>
									<Download className="mr-2 h-4 w-4" /> Export Technologies
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Import</CardTitle>
								<CardDescription>
									Import technologies from JSON file
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center">
										<Upload className="mx-auto h-12 w-12 text-gray-400" />
										<p className="mt-2 text-gray-600 text-sm">
											Drag and drop a JSON file here, or click to select
										</p>
										<input
											type="file"
											accept=".json"
											className="hidden"
											id="import-file"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) handleImportFile(file);
											}}
										/>
										<Label
											htmlFor="import-file"
											className="mt-4 inline-block cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
										>
											Select File
										</Label>
									</div>
									{importPreview && (
										<div>
											<h3 className="mb-2 font-medium">
												Preview ({importPreview.length} technologies)
											</h3>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Quadrant</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{importPreview.map((tech, idx) => (
														<TableRow key={idx}>
															<TableCell>{tech.name}</TableCell>
															<TableCell>{tech.quadrant_id}</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
											<Button className="mt-4" onClick={handleConfirmImport}>
												Confirm Import
											</Button>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteTarget?.type === "blip" &&
								`This blip is used by ${technologies.filter((t) => t.blip_id === Number(deleteTarget?.id)).length} technologies. Deleting it may affect data. `}
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

			<AlertDialog
				open={conflictDialogOpen}
				onOpenChange={setConflictDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Conflicts Detected</AlertDialogTitle>
						<AlertDialogDescription>
							Some technologies already exist. How would you like to handle
							them?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmImport}>
							Skip Existing
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
