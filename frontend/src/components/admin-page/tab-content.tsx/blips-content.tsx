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
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { type Blip, deleteBlip } from "@/lib/actions";
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import CreateBlipDialog from "../create-blip-form/create-blip-dialog";

export default function BlipsContent({
	blips,
	setBlips,
}: {
	blips: Blip[];
	setBlips: (blips: Blip[]) => void;
}) {
		const [isDeleteOpen, setIsDeleteOpen] = useState(false);
		const [deleteTarget, setDeleteTarget] = useState<{
			id: string;
			name: string;
		} | null>(null);

		const handleDelete = async () => {
		if (!deleteTarget?.id) return;
		const result = await deleteBlip(Number(deleteTarget.id));
		if (result.success) {
			setBlips(blips.filter((b) => b.id !== Number(deleteTarget.id)));
		}
			setIsDeleteOpen(false);
			setDeleteTarget(null);
		};

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
			<TabsContent value="blips">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
							<div className="relative max-w-sm flex-1">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input placeholder="Search blips..." className="pl-10" />
							</div>
							<CreateBlipDialog />
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
		</>
	);
}
