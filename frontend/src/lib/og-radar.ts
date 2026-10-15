import { quadrantIdToKey, quadrantOrder } from "@/components/radar-page/radar-data";

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

// Matches the real radar (radar-data.ts): quadrant_id maps to a key via
// quadrantIdToKey (1=techniques, 2=tools, 3=platforms, 4=languages), the key's
// index in quadrantOrder gives the clockwise slot from the top, so on screen:
// 1 = bottom-right, 2 = top-right, 3 = bottom-left, 4 = top-left.
// Returns the SVG screen angle (from +x, y down) where the quadrant starts.
function quadrantStart(quadrantId: number): number {
	const key = quadrantIdToKey(quadrantId);
	if (!key) return NaN;
	return quadrantOrder.indexOf(key) * (Math.PI / 2) - Math.PI / 2;
}

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
			quadrantStart(item.quadrant_id) + angleFraction * (Math.PI / 2);
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
