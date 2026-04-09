import { ThemeToggle } from "@/components/light-dark-button";

export default function LogInPage() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-background gap-10">
			<ThemeToggle />
			<div className="size-100 bg-accent" />
		</main>
	);
}
