import { Search, Trash2 } from "lucide-react";
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
import { deleteUser, type User as UserType } from "@/lib/actions";

export default function UsersContent({
	users,
	setUsers,
}: {
	users: UserType[];
	setUsers: (users: UserType[]) => void;
}) {
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const handleDelete = async () => {
		if (!deleteTarget?.id) return;
		const result = await deleteUser(deleteTarget.id);
		if (result.success) {
			setUsers(users.filter((u) => String(u.id) !== String(deleteTarget.id)));
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
														id: user.id?.toString() || "",
														name: user.name?.toString() || "",
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
