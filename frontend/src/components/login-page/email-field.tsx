import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useFieldContext } from "./login-form";

export function EmailField({ label }: { label: string }) {
	// The `Field` infers that it should have a `value` type of `string`
	const field = useFieldContext<string>();
	return (
		<div className="grid gap-2">
			<Label htmlFor="email">Email</Label>
			<Input
				type="email"
				placeholder="example@example.com"
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				required
			/>
		</div>
	);
}
