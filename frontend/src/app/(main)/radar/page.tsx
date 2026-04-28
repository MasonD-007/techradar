import SearchTechnologiesDialog from "@/components/radar-page/search-technologies/search-technologies-dialog";

export default function RadarPage() {
	return (
		<main className="flex min-h-screen flex-col items-center gap-10 bg-background">
			<h1 className="mt-5 font-bold text-4xl">Your Tech Radar</h1>
			{/* <CreateBlipDialog /> */}
			<SearchTechnologiesDialog />
		</main>
	);
}
