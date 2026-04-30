"use client";

import NavigationTab from "@/components/admin-page/navigation-tab";

import { ThemeToggle } from "@/components/light-dark-button";

export default function AdminPage() {
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
