import { Input } from "@/components/ui/input";
import { useFieldContext } from "../create-blip-form";

export default function DescriptionField({ label }: { label: string }) {
	const field = useFieldContext<string>();

	return (
		<div className="space-y-1">
			<label htmlFor={field.name} className="font-medium text-sm">
				Description
			</label>
			<Input
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder="Short description"
			/>
			{field.state.meta.errors?.length > 0 && (
				<p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
			)}
		</div>
	);
}
