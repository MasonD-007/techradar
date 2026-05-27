import { Download, Upload } from "lucide-react";
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
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { createTechnology, type Technology } from "@/lib/actions";

type ImportTechnology = {
	name: string;
	description: string;
	quadrant_id: string | number;
};

export default function ImportContent({
	technologies,
	setTechnologies,
}: {
	technologies: Technology[];
	setTechnologies: (technologies: Technology[]) => void;
}) {
	
	const [importPreview, setImportPreview] = useState<
		ImportTechnology[] | null
	>(null);
	const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

	const handleExport = () => {
		const data = {
			technologies: technologies.map((t) => ({
				name: t.name,
				description: "",
				quadrant_id: t.quadrant_id,
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
		
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);
				if (data.technologies) {
					const technologiesToImport = data.technologies as ImportTechnology[];
					setImportPreview(technologiesToImport);
					const hasConflicts = technologiesToImport.some((t: { name: string }) =>
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

	const handleConfirmImport = async () => {
		if (!importPreview) return;
		const importedTechnologies: Technology[] = [];

		for (const technology of importPreview) {
			if (technologies.some((existing) => existing.name === technology.name)) {
				continue;
			}

			const formData = new FormData();
			formData.set("name", technology.name);
			formData.set("description", technology.description);
			formData.set("quadrant_id", String(technology.quadrant_id));

			const result = await createTechnology(formData);
			if (result.success && result.data) {
				importedTechnologies.push(result.data);
			}
		}

		setTechnologies([...technologies, ...importedTechnologies]);
		
		setImportPreview(null);
		setConflictDialogOpen(false);
	};
	return (
		<>
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
			<TabsContent value="import">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Export</CardTitle>
							<CardDescription>Export all technologies as JSON</CardDescription>
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
								Import technologies from JSON file with name, description, and quadrant_id
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
												<TableHead>Description</TableHead>
												<TableHead>Quadrant</TableHead>
											</TableRow>
											</TableHeader>
											<TableBody>
												{importPreview.map((tech, idx) => (
											<TableRow key={idx}>
												<TableCell>{tech.name}</TableCell>
												<TableCell>{tech.description}</TableCell>
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
		</>
	);
}
