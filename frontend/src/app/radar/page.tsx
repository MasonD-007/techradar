import { ThemeToggle } from "@/components/light-dark-button";

export default function RadarPage() {
	return (
		<main className="min-h-screen flex flex-col items-center bg-background gap-10">
			<h1 className="text-4xl font-bold mt-5">Your Tech Radar</h1>
			<div className="p-5 bg-accent w-1/2" />
			<div className="flex items-center gap-10">
				{/* RADAR */}
				<div className="rounded-full bg-accent size-170" />
				{/* Blip info (might change to be under radar) */}
				<div className="bg-accent size-100" />
			</div>
		</main>
	);
}
