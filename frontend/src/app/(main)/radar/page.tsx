import QuadrantData from "@/components/radar-page/quadrants";
import Radar from "@/components/radar-page/radar";
import RadarTitle from "@/components/radar-page/radar-title";
import RingData from "@/components/radar-page/rings";

export default function RadarPage() {
	return (
		<section className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_35%),linear-gradient(180deg,#020617_0%,#030712_55%,#020617_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-5">
				<RadarTitle />

				<div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_280px]">
					<Radar />

					<aside className="grid gap-4 self-start">
						<QuadrantData />
						<RingData />
					</aside>
				</div>
			</div>
		</section>
	);
}
