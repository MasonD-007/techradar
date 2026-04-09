import { ThemeToggle } from "@/components/light-dark-button";

export default function QuadrantPage() {
	// TODO: use quadrant/[quadrantId] and fetch data for the quadrant
	return (
		<main className="min-h-screen flex flex-col items-center bg-background gap-10">
			<ThemeToggle />
			<h1 className="text-4xl font-bold">Technologies Quadrant</h1>
			<div className="p-5 bg-accent w-1/2" />
			<div className="flex items-center gap-10">
				{/* RADAR QUADRANT */}
				<div className="w-100 h-100 overflow-hidden">
					<div className="w-200 h-200 bg-accent rounded-full" />
				</div>
				{/* Blip info (might change to be under radar) */}
				<div className="bg-accent size-100" />
			</div>
		</main>
	);
}
