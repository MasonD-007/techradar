import type { Metadata } from "next";
import { buildShareMetadata, fetchPublicShareSummary } from "@/lib/share-meta";
import RadarView from "./radar-view";

type Props = { searchParams: Promise<{ share?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const { share } = await searchParams;
	const code = Array.isArray(share) ? share[0] : share;
	if (!code) return buildShareMetadata(undefined, null);
	return buildShareMetadata(code, await fetchPublicShareSummary(code));
}

export default function RadarPage() {
	return <RadarView />;
}
