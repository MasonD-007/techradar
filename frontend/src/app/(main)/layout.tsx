import { ThemeToggle } from "@/components/light-dark-button";
import { Button } from "@/components/ui/button";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<ThemeToggle />
			{children}
		</div>
	);
}
