import LandingPageHeader from "@/components/landing-page/landing-page-header";
import { ThemeToggle } from "@/components/light-dark-button";

export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center bg-background">
			<ThemeToggle className="roudned-full fixed right-15 bottom-15 z-50 size-13 cursor-pointer p-0" />
			<LandingPageHeader />
		</main>
	);
}
