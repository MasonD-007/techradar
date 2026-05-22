"use client";

import { positionedItems } from "./radar-data";

export default function RadarTitle() {
	return (
		<header className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 px-6 py-5 shadow-2xl shadow-slate-950/40 backdrop-blur">
			<div className="space-y-2">
				<h1 className="font-black text-3xl text-white tracking-tight sm:text-4xl">
					Your Tech radar
				</h1>
			</div>
			<div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-300 text-xs">
				<span className="h-2 w-2 rounded-full bg-cyan-300" />
				{positionedItems.length} blips
			</div>
		</header>
	);
}
