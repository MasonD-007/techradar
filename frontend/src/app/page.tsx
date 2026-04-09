import LandingPageHeader from "@/components/landing-page/landing-page-header";
import { ThemeToggle } from "@/components/light-dark-button";

export default function HomePage() {
	return (
		<main className="min-h-screen flex flex-col items-center bg-background">
			<ThemeToggle />
			<LandingPageHeader />
		</main>
	);
}
