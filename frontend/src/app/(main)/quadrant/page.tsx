// import { ThemeToggle } from "@/components/light-dark-button";

export default function QuadrantPage() {
	// TODO: use quadrant/[quadrantId] and fetch data for the quadrant
	return (
		<main className="flex min-h-screen flex-col items-center gap-10 bg-background">
			<h1 className="font-bold text-4xl">Technologies Quadrant</h1>
			<div className="w-1/2 bg-accent p-5" />
			<div className="flex items-center gap-10">
				{/* RADAR QUADRANT */}
				<div className="h-100 w-100 overflow-hidden">
					<div className="h-200 w-200 rounded-full bg-accent" />
				</div>
				{/* Blip info (might change to be under radar) */}
				<div className="size-100 bg-accent" />
			</div>
		</main>
	);
}
