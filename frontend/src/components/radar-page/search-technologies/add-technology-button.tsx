import { Button } from "@/components/ui/button";

export default function AddTechnologyButton({
	tech,
	selected,
}: {
	// TODO: make typesafe
	tech: { id: string; name: string; quadrant_id?: number };
	selected?: boolean;
}) {
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
