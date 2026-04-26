import { Button } from "@/components/ui/button";
import type { Technology } from "@/lib/actions";

export default function AddTechnologyButton({
	userId,
	tech,
	selected,
}: {
	userId: string;
	// TODO: make typesafe
	tech: Technology;
	selected?: boolean;
}) {
	const addTechnology = () => {};

	return (
		<Button asChild>
			<div
				key={tech.id}
				className={`flex w-full justify-between rounded-md border p-2 text-sm ${
					selected ? "bg-muted/60" : ""
				}`}
			>
				<p className="font-medium">{tech.name}</p>
				<p className="text-muted-foreground">
					{selected ? "Added" : `Quadrant: ${tech.quadrant_id ?? "-"}`}
				</p>
			</div>
		</Button>
	);
}
