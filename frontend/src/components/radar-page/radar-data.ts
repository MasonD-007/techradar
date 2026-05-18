export type QuadrantKey = "techniques" | "tools" | "platforms" | "languages";
export type RingKey = "adopt" | "trial" | "assess" | "hold";

export type RadarItem = {
	id: string;
	title: string;
	quadrant: QuadrantKey;
	ring: RingKey;
	description: string;
	status: string;
};

export type PositionedRadarItem = RadarItem & {
	x: number;
	y: number;
	quadrantIndex: number;
	ringIndex: number;
	angle: number;
	radius: number;
};

export type QuadrantLabel = (typeof quadrantLabels)[number];

// Constants
export const RADAR_SIZE = 1000;
export const CENTER = RADAR_SIZE / 2;
export const quadrantOrder: QuadrantKey[] = [
	"tools",
	"techniques",
	"platforms",
	"languages",
];
export const ringOrder: RingKey[] = ["adopt", "trial", "assess", "hold"];
export const outerRadius = 420;
export const ringRatios = [0.24, 0.48, 0.74, 1];
export const blipRadius = 7;

// Labels
export const ringLabels: Array<{ key: RingKey; title: string; blurb: string }> =
	[
		{
			key: "adopt",
			title: "Adopt",
			blurb: "Stable, production-ready choices",
		},
		{ key: "trial", title: "Trial", blurb: "Use on active projects" },
		{ key: "assess", title: "Assess", blurb: "Worth evaluating in context" },
		{ key: "hold", title: "Hold", blurb: "Defer until the signal improves" },
	];

export const quadrantLabels: Array<{
	key: QuadrantKey;
	title: string;
	description: string;
	startAngle: number;
	endAngle: number;
}> = [
	{
		key: "techniques",
		title: "Techniques",
		description: "Implementation patterns, workflows, and delivery practices",
		startAngle: 0,
		endAngle: Math.PI / 2,
	},
	{
		key: "tools",
		title: "Tools",
		description: "Editor workflows, automation, and developer tooling",
		startAngle: Math.PI / 2,
		endAngle: Math.PI,
	},
	{
		key: "platforms",
		title: "Platforms",
		description: "Runtime, infra, and deployment foundations",
		startAngle: Math.PI,
		endAngle: (3 * Math.PI) / 2,
	},
	{
		key: "languages",
		title: "Languages & Frameworks",
		description: "Application stacks and adjacent frameworks",
		startAngle: (3 * Math.PI) / 2,
		endAngle: 2 * Math.PI,
	},
];

// Radar Items Data
export const radarItems: RadarItem[] = [
	{
		id: "typescript-5",
		title: "TypeScript 5",
		quadrant: "languages",
		ring: "adopt",
		description: "Strong defaults for large app surfaces and shared types.",
		status: "Core",
	},
	{
		id: "nextjs-app-router",
		title: "Next.js App Router",
		quadrant: "languages",
		ring: "trial",
		description: "A good fit for server-first page composition.",
		status: "Current",
	},
	{
		id: "react-server-components",
		title: "React Server Components",
		quadrant: "languages",
		ring: "adopt",
		description: "Keeps data-heavy surfaces thin and responsive.",
		status: "Core",
	},
	{
		id: "tailwindcss-4",
		title: "Tailwind CSS 4",
		quadrant: "languages",
		ring: "trial",
		description: "Fast iteration for layout-heavy product work.",
		status: "Active",
	},
	{
		id: "openapi-codegen",
		title: "OpenAPI code generation",
		quadrant: "tools",
		ring: "trial",
		description: "Keeps the contract between frontend and backend tight.",
		status: "Shared",
	},
	{
		id: "vitest",
		title: "Vitest",
		quadrant: "tools",
		ring: "adopt",
		description: "Fast feedback for component and utility coverage.",
		status: "Core",
	},
	{
		id: "d3-layouts",
		title: "D3 radial layouts",
		quadrant: "tools",
		ring: "adopt",
		description: "Useful when the UI needs precise polar geometry.",
		status: "Core",
	},
	{
		id: "storybook",
		title: "Storybook",
		quadrant: "tools",
		ring: "assess",
		description: "Handy for isolated design review and edge cases.",
		status: "Evaluate",
	},
	{
		id: "postgres-rls",
		title: "PostgreSQL row-level security",
		quadrant: "platforms",
		ring: "adopt",
		description: "Matches the schema-driven ownership model well.",
		status: "Core",
	},
	{
		id: "docker-compose",
		title: "Docker Compose",
		quadrant: "platforms",
		ring: "trial",
		description: "Good local parity for cross-service workflows.",
		status: "Active",
	},
	{
		id: "k3s",
		title: "k3s deployment",
		quadrant: "platforms",
		ring: "assess",
		description: "Solid if lightweight cluster parity is the goal.",
		status: "Infra",
	},
	{
		id: "go-migrations",
		title: "Go migrations",
		quadrant: "platforms",
		ring: "hold",
		description: "Use only when app-level migrations are required.",
		status: "Deferred",
	},
	{
		id: "design-systems",
		title: "Design systems",
		quadrant: "techniques",
		ring: "adopt",
		description: "Shared UI language pays off on wide product surfaces.",
		status: "Core",
	},
	{
		id: "data-contracts",
		title: "Data contracts",
		quadrant: "techniques",
		ring: "trial",
		description: "Keeps backend and frontend changes synchronized.",
		status: "Shared",
	},
	{
		id: "playwright",
		title: "Playwright flows",
		quadrant: "techniques",
		ring: "assess",
		description: "Best used for critical end-to-end journeys only.",
		status: "Evaluate",
	},
	{
		id: "manual-sql",
		title: "Manual SQL edits",
		quadrant: "techniques",
		ring: "hold",
		description: "Avoid unless a schema migration really needs it.",
		status: "Deferred",
	},
];

// Helper functions
export function hashToUnit(input: string) {
	let hash = 0;
	for (let index = 0; index < input.length; index += 1) {
		hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
	}

	return (hash % 1000) / 1000;
}

export function polarToCartesian(angle: number, radius: number) {
	return {
		x: CENTER + Math.sin(angle) * radius,
		y: CENTER - Math.cos(angle) * radius,
	};
}

export function polarToRelative(angle: number, radius: number) {
	return {
		x: Math.sin(angle) * radius,
		y: -Math.cos(angle) * radius,
	};
}

export function buildPositionedItems(
	items: RadarItem[],
): PositionedRadarItem[] {
	const quadrantMap = new Map(
		quadrantLabels.map((quadrant) => [quadrant.key, quadrant]),
	);
	const quadrantIndexMap = new Map(
		quadrantOrder.map((quadrant, index) => [quadrant, index]),
	);
	const ringIndexMap = new Map(ringOrder.map((ring, index) => [ring, index]));

	return items.map((item) => {
		const quadrant = quadrantMap.get(item.quadrant);
		const quadrantIndex = quadrantIndexMap.get(item.quadrant) ?? 0;
		const ringIndex = ringIndexMap.get(item.ring) ?? 0;

		if (!quadrant) {
			return {
				...item,
				x: CENTER,
				y: CENTER,
				quadrantIndex,
				ringIndex,
				angle: 0,
				radius: 0,
			};
		}

		const quadrantStart = quadrantIndex * (Math.PI / 2);
		const quadrantEnd = quadrantStart + Math.PI / 2;
		const anglePadding = 0.16;
		const radiusStart =
			ringIndex === 0 ? 22 : ringRatios[ringIndex - 1] * outerRadius;
		const radiusEnd = ringRatios[ringIndex] * outerRadius - 18;
		const normalizedHash = hashToUnit(item.id);
		const computedAngle =
			(quadrantStart + anglePadding) * (1 - normalizedHash) +
			(quadrantEnd - anglePadding) * normalizedHash;

		const radiusNormalizedHash = hashToUnit(`${item.id}:${item.ring}`);
		const computedRadius =
			radiusStart * (1 - radiusNormalizedHash) +
			radiusEnd * radiusNormalizedHash;

		const point = polarToCartesian(computedAngle, computedRadius);

		return {
			...item,
			x: point.x,
			y: point.y,
			quadrantIndex,
			ringIndex,
			angle: computedAngle,
			radius: computedRadius,
		};
	});
}

// Pre-computed positioned items and ring paths
export const positionedItems = buildPositionedItems(radarItems);
export const ringPaths = ringLabels.map((ring, index) => ({
	key: ring.key,
	title: ring.title,
	blurb: ring.blurb,
	radius: ringRatios[index] * outerRadius,
}));
