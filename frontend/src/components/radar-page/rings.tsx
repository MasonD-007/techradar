"use client";

import { positionedItems, ringLabels } from "./radar-data";

export default function RingData() {
	const ringStats = ringLabels.map((ring) => ({
		...ring,
		count: positionedItems.filter((item) => item.ring === ring.key).length,
	}));

	return (
		<div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-5 shadow-slate-950/30 shadow-xl backdrop-blur">
			<p className="font-semibold text-slate-400 text-xs uppercase tracking-[0.3em]">
				Rings
			</p>
			<div className="mt-4 space-y-3">
				{ringStats.map((ring) => (
					<div
						key={ring.key}
						className="rounded-2xl border border-white/10 bg-white/5 p-3"
					>
						<div className="flex items-center justify-between gap-3">
							<p className="font-semibold text-white">{ring.title}</p>
							<span className="rounded-full border border-white/10 bg-slate-900/60 px-2 py-1 text-slate-300 text-xs">
								{ring.count}
							</span>
						</div>
						<p className="mt-1 text-slate-400 text-sm">{ring.blurb}</p>
					</div>
				))}
			</div>
		</div>
	);
}
