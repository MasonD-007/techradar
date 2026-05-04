import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFieldContext } from "../create-blip-form";

export default function TechnologyField({ label }: { label: string }) {
	const field = useFieldContext<string>();

	return (
		<div className="space-y-1">
			<label htmlFor={field.name} className="font-medium text-sm">
				Technology
			</label>
			<Select
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value)}
			>
				<SelectTrigger
					className="w-full cursor-pointer"
					id={field.name}
					name={field.name}
					onBlur={field.handleBlur}
				>
					<SelectValue placeholder="Select technology" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{/* TODO: replace with actual technology options */}
						<SelectItem value="typescript">TypeScript</SelectItem>
						<SelectItem value="javascript">JavaScript</SelectItem>
						<SelectItem value="python">Python</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
			{field.state.meta.errors?.length > 0 && (
				<p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
			)}
		</div>
	);
}
