"use client";

import NavigationTab from "@/components/admin-page/navigation-tab";

import { ThemeToggle } from "@/components/light-dark-button";

export default function AdminPage() {
	// const handleDelete = async () => {
	// 	if (!deleteTarget || !deleteTarget.id) return;
	// 	if (deleteTarget.type === "technology") {
	// 		const result = await deleteTechnology(deleteTarget.id);
	// 		if (result.success) {
	// 			setTechnologies(technologies.filter((t) => t.id !== deleteTarget.id));
	// 		}
	// 	} else if (deleteTarget.type === "blip") {
	// 		const result = await deleteBlip(Number(deleteTarget.id));
	// 		if (result.success) {
	// 			setBlips(blips.filter((b) => b.id !== Number(deleteTarget.id)));
	// 		}
	// 	} else if (deleteTarget.type === "user") {
	// 		const result = await deleteUser(deleteTarget.id);
	// 		if (result.success) {
	// 			setUsers(users.filter((u) => u.id !== deleteTarget.id));
	// 		}
	// 	}
	// 	setIsDeleteOpen(false);
	// 	setDeleteTarget(null);
	// };

	return (
		<div className="min-h-screen space-y-6 bg-background p-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-3xl">Admin Dashboard</h1>
				<ThemeToggle className="size-10 cursor-pointer rounded-full" />
			</div>

			<NavigationTab />

			{/* <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
			</AlertDialog> */}
		</div>
	);
}
