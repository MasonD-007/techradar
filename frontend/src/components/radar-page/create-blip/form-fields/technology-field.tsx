import { Input } from "@/components/ui/input";
import { useFieldContext } from "../create-blip-form";

export default function TechnologyField({ label }: { label: string }) {
	const field = useFieldContext<string>();

	return (
		<div className="space-y-1">
			<label htmlFor={field.name} className="font-medium text-sm">
				Technology
			</label>
			<Input
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder="Example: PostgreSQL"
			/>
		</div>
	);
}
