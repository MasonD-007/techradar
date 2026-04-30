import { getCurrentUser } from "@/lib/actions";
import SideBarApp from "@/components/navigation/side-bar-app";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await getCurrentUser();

	return (
		<div>
			<SidebarProvider>
				<SideBarApp user={user} />
				<main className="w-full">
					<SidebarTrigger className="size-10 cursor-pointer" />
					{children}
				</main>
			</SidebarProvider>
		</div>
	);
}
