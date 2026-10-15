import { describe, expect, it } from "vitest";
import { layoutDots } from "./og-radar";

const SIZE = 480;
const C = SIZE / 2;

function items(quadrant: number, ring: number, n = 8) {
	return Array.from({ length: n }, (_, i) => ({
		name: `tech-${quadrant}-${ring}-${i}`,
		quadrant_id: quadrant,
		ring_id: ring,
	}));
}

describe("layoutDots", () => {
	it("is deterministic and returns [] for empty input", () => {
		const input = items(1, 2);
		expect(layoutDots(input, SIZE)).toEqual(layoutDots(input, SIZE));
		expect(layoutDots([], SIZE)).toEqual([]);
	});

	it("keeps every dot inside the circle", () => {
		const all = [1, 2, 3, 4].flatMap((q) => [1, 2, 3, 4].flatMap((r) => items(q, r)));
		for (const d of layoutDots(all, SIZE)) {
			expect(Math.hypot(d.x - C, d.y - C)).toBeLessThanOrEqual(C);
		}
	});

	it("places ring 1 nearer the centre than ring 4", () => {
		const mean = (ring: number) => {
			const dots = layoutDots(items(1, ring, 20), SIZE);
			return dots.reduce((s, d) => s + Math.hypot(d.x - C, d.y - C), 0) / dots.length;
		};
		expect(mean(1)).toBeLessThan(mean(4));
	});

	it("keeps dots in their quadrant, matching the real radar (1=top-right, 2=bottom-right, 3=bottom-left, 4=top-left)", () => {
		const signs: Record<number, [number, number]> = {
			1: [1, -1],
			2: [1, 1],
			3: [-1, 1],
			4: [-1, -1],
		};
		for (const q of [1, 2, 3, 4]) {
			for (const r of [1, 2, 3, 4]) {
				for (const d of layoutDots(items(q, r), SIZE)) {
					expect(Math.sign(d.x - C)).toBe(signs[q][0]);
					expect(Math.sign(d.y - C)).toBe(signs[q][1]);
				}
			}
		}
	});

	it("gives different names different positions", () => {
		const [a, b] = layoutDots(
			[
				{ name: "alpha", quadrant_id: 1, ring_id: 2 },
				{ name: "beta", quadrant_id: 1, ring_id: 2 },
			],
			SIZE,
		);
		expect(a.x !== b.x || a.y !== b.y).toBe(true);
	});

	it("skips out-of-range quadrant or ring without throwing", () => {
		const dots = layoutDots(
			[
				{ name: "a", quadrant_id: 0, ring_id: 1 },
				{ name: "b", quadrant_id: 5, ring_id: 1 },
				{ name: "c", quadrant_id: 1, ring_id: 0 },
				{ name: "d", quadrant_id: 1, ring_id: 5 },
				{ name: "ok", quadrant_id: 1, ring_id: 1 },
			],
			SIZE,
		);
		expect(dots).toHaveLength(1);
	});

	it("caps the number of dots", () => {
		expect(layoutDots(items(1, 1, 400), SIZE).length).toBe(150);
	});
});
