import SideBarApp from "@/components/navigation/side-bar-app";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<SidebarProvider>
				<SideBarApp />
				<main className="w-full">
					<SidebarTrigger className="size-10 cursor-pointer" />
					{children}
				</main>
			</SidebarProvider>
		</div>
	);
}
