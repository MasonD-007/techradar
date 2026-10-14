"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import Radar from "@/components/radar-page/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ExplorePage() {
	const [shareCode, setShareCode] = useQueryState("share", parseAsString);
	const [inputValue, setInputValue] = useState(shareCode ?? "");

	const handleLoadRadar = () => {
		const trimmed = inputValue.trim();
		if (trimmed) {
			void setShareCode(trimmed);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleLoadRadar();
		}
	};

	const handleClear = () => {
		void setShareCode(null);
		setInputValue("");
	};

	return (
		<Card className="min-h-screen bg-background px-4 py-6 text-card-foreground shadow-none ring-0 sm:px-6 lg:px-8">
			<CardContent className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="font-semibold text-2xl text-card-foreground">
						Explore Radars
					</h1>
					<p className="text-muted-foreground text-sm">
						Enter a share code to load and explore someone else&apos;s tech
						radar.
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-1 flex-col gap-1.5">
						<label
							htmlFor="share-code"
							className="text-muted-foreground text-xs font-medium uppercase tracking-[0.24em]"
						>
							Share code
						</label>
						<Input
							id="share-code"
							placeholder="Paste share code here..."
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
						/>
					</div>
					<Button onClick={handleLoadRadar}>Explore</Button>
					{shareCode && (
						<Button variant="ghost" onClick={handleClear}>
							Clear
						</Button>
					)}
				</div>

				{shareCode && shareCode === inputValue.trim() && (
					<p className="-mt-3 text-muted-foreground text-xs">
						Exploring share code:{" "}
						<span className="font-mono text-foreground">{shareCode}</span>
					</p>
				)}

				{shareCode ? (
					<Radar shareCode={shareCode} isOwnRadar={false} />
				) : (
					<div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
						<p className="text-muted-foreground text-sm">
							Enter a share code above to explore someone&apos;s tech radar.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
