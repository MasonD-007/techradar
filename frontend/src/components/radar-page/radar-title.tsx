"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getCurrentUserId,
	getRadarGraphByCode,
	getTechnologiesByUser,
	getUser,
} from "@/lib/actions";
import ShareButton from "./share-button";

type RadarTitleProps = {
	userId?: string | null;
	shareCode?: string | null;
};

export default function RadarTitle({ userId, shareCode }: RadarTitleProps) {
	const [blipCount, setBlipCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [userName, setUserName] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadBlipCount = async () => {
			setIsLoading(true);

			if (shareCode && !userId) {
				const shareGraphResult = await getRadarGraphByCode(shareCode);
				if (cancelled) {
					return;
				}

				if (shareGraphResult.success && shareGraphResult.data) {
					setUserName(shareGraphResult.data.username ?? null);
					setBlipCount(shareGraphResult.data.radar?.length || 0);
					setIsLoading(false);
					return;
				}

				setUserName(null);
				setBlipCount(0);
				setIsLoading(false);
				return;
			}

			const currentUserId = userId ?? (await getCurrentUserId());
			if (cancelled) {
				return;
			}

			if (!currentUserId) {
				setBlipCount(0);
				setIsLoading(false);
				return;
			}

			const userResult = await getUser(currentUserId);
			if (userResult.success && userResult.data) {
				setUserName(userResult.data.name ?? null);
			} else {
				setUserName(null);
			}

			const userTechnologiesResult = await getTechnologiesByUser(currentUserId);
			if (cancelled) {
				return;
			}

			if (!userTechnologiesResult.success) {
				setBlipCount(0);
				setIsLoading(false);
				return;
			}

			setBlipCount(userTechnologiesResult.data?.length || 0);
			setIsLoading(false);
		};

		void loadBlipCount();

		return () => {
			cancelled = true;
		};
	}, [shareCode, userId]);

	return (
		<Card className="border-border bg-card/80 shadow-2xl shadow-foreground/10 backdrop-blur">
			<CardHeader className="border-border border-b px-6 py-5">
				<CardTitle className="flex items-center gap-2 font-black text-3xl text-card-foreground tracking-tight sm:text-4xl">
					<span>
						{userName
							? `${userName}${userName.endsWith("s") ? "'" : "'s"} Tech radar`
							: "Tech radar"}
					</span>
					{shareCode && <ShareButton shareCode={shareCode} />}
				</CardTitle>
				<CardDescription className="max-w-2xl text-muted-foreground text-sm">
					A curated snapshot of the stack, delivery practices, and supporting
					platforms.
				</CardDescription>
				<CardAction>
					<Badge
						variant="secondary"
						className="border-primary/20 bg-primary/10 text-primary"
					>
						{isLoading ? "..." : `${blipCount} blips`}
					</Badge>
				</CardAction>
			</CardHeader>
		</Card>
	);
}
