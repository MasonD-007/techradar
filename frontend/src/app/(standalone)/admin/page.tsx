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
		</div>
	);
}
