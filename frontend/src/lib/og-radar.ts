export type Dot = { x: number; y: number; quadrant: number; ring: number };

type Item = { name: string; quadrant_id: number; ring_id: number };

export const MAX_DOTS = 150;

// FNV-1a so the same radar always renders the same picture.
function hash(input: string): number {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

// Matches the real radar (radar-data.ts): quadrant ids follow quadrantOrder
// (tools, techniques, platforms, languages), laid out clockwise from the top,
// so 1 = top-right, 2 = bottom-right, 3 = bottom-left, 4 = top-left.
// Angles here are SVG screen angles (from +x, y grows downward).
const QUADRANT_START = [1.5 * Math.PI, 0, 0.5 * Math.PI, Math.PI];

// Same outer ring ratios as the real radar (radar-data.ts ringRatios).
const RING_RATIOS = [0.24, 0.48, 0.74, 1];

export function layoutDots(items: Item[], size: number): Dot[] {
	const centre = size / 2;
	const dots: Dot[] = [];
	for (const item of items) {
		if (dots.length >= MAX_DOTS) break;
		if (!(item.quadrant_id >= 1 && item.quadrant_id <= 4)) continue;
		if (!(item.ring_id >= 1 && item.ring_id <= 4)) continue;
		const h = hash(`${item.name}:${item.quadrant_id}:${item.ring_id}`);
		const angleFraction = ((h & 0xffff) / 0xffff) * 0.8 + 0.1;
		const radiusFraction = (((h >>> 16) & 0xffff) / 0xffff) * 0.7 + 0.15;
		const angle =
			QUADRANT_START[item.quadrant_id - 1] + angleFraction * (Math.PI / 2);
		const inner = item.ring_id === 1 ? 0 : RING_RATIOS[item.ring_id - 2];
		const outer = RING_RATIOS[item.ring_id - 1];
		const radius = (inner + radiusFraction * (outer - inner)) * centre * 0.92;
		dots.push({
			x: centre + Math.cos(angle) * radius,
			y: centre + Math.sin(angle) * radius,
			quadrant: item.quadrant_id,
			ring: item.ring_id,
		});
	}
	return dots;
}
