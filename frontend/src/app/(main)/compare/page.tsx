"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import Radar from "@/components/radar-page/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserId, getMyShareCode } from "@/lib/actions";

export default function ComparePage() {
	const [friendShareCode, setFriendShareCode] = useQueryState(
		"share",
		parseAsString,
	);
	const [inputValue, setInputValue] = useState(friendShareCode ?? "");
	const [myShareCode, setMyShareCode] = useState<string | null>(null);
	const [signedInUserId, setSignedInUserId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const init = async () => {
			const [userId, shareCodeResult] = await Promise.all([
				getCurrentUserId(),
				getMyShareCode(),
			]);

			if (cancelled) {
				return;
			}

			setSignedInUserId(userId);

			if (shareCodeResult.success && shareCodeResult.data?.code) {
				setMyShareCode(shareCodeResult.data.code);
			}
		};

		void init();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleLoadFriendRadar = () => {
		const trimmed = inputValue.trim();
		if (trimmed) {
			void setFriendShareCode(trimmed);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleLoadFriendRadar();
		}
	};

	const handleClearFriendRadar = () => {
		void setFriendShareCode(null);
		setInputValue("");
	};

	return (
		<Card className="min-h-screen bg-background px-4 py-6 text-card-foreground shadow-none ring-0 sm:px-6 lg:px-8">
			<CardContent className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="font-semibold text-2xl text-card-foreground">
						Compare Radars
					</h1>
					<p className="text-muted-foreground text-sm">
						View your radar side by side with a friend&apos;s. Enter their
						share code below to load their radar.
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-1 flex-col gap-1.5">
						<label
							htmlFor="friend-share-code"
							className="text-muted-foreground text-xs font-medium uppercase tracking-[0.24em]"
						>
							Friend&apos;s share code
						</label>
						<Input
							id="friend-share-code"
							placeholder="Paste share code here..."
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
						/>
					</div>
					<Button onClick={handleLoadFriendRadar}>Compare</Button>
					{friendShareCode && (
						<Button variant="ghost" onClick={handleClearFriendRadar}>
							Clear
						</Button>
					)}
				</div>

				{friendShareCode && friendShareCode === inputValue.trim() && (
					<p className="-mt-3 text-muted-foreground text-xs">
						Comparing with share code:{" "}
						<span className="font-mono text-foreground">
							{friendShareCode}
						</span>
					</p>
				)}

				<div className="grid flex-1 gap-6 lg:grid-cols-2">
					<div className="flex flex-col gap-3">
						<h2 className="font-medium text-card-foreground text-lg">
							Your Radar
						</h2>
						{signedInUserId && myShareCode ? (
							<Radar
								shareCode={myShareCode}
								currentUserId={signedInUserId}
								isOwnRadar
							/>
						) : (
							<div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
								<p className="text-muted-foreground text-sm">
									{signedInUserId
										? "Set up your share code to view your radar here."
										: "Sign in to view your radar for comparison."}
								</p>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-3">
						<h2 className="font-medium text-card-foreground text-lg">
							Friend&apos;s Radar
						</h2>
						{friendShareCode ? (
							<Radar
								shareCode={friendShareCode}
								currentUserId={signedInUserId}
								isOwnRadar={false}
							/>
						) : (
							<div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
								<p className="text-muted-foreground text-sm">
									Enter a share code above to load a friend&apos;s radar and
									compare.
								</p>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
