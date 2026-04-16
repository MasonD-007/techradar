import CreateBlipDialog from "@/components/radar-page/create-blip/create-blip-dialog";

export default function RadarPage() {
	return (
		<main className="flex min-h-screen flex-col items-center gap-10 bg-background">
			<h1 className="mt-5 font-bold text-4xl">Your Tech Radar</h1>
			<CreateBlipDialog />
			<div className="w-1/2 bg-accent p-5" />
			<div className="flex items-center gap-10">
				{/* RADAR */}
				<div className="size-170 rounded-full bg-accent" />
				{/* Blip info (might change to be under radar) */}
				<div className="size-100 bg-accent" />
			</div>
		</main>
	);
}
