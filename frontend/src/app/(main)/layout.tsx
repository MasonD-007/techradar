import { ThemeToggle } from "@/components/light-dark-button";
import SideBar from "@/components/navigation/side-bar";
import { Button } from "@/components/ui/button";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<SideBar />
			<ThemeToggle />
			{children}
		</div>
	);
}
