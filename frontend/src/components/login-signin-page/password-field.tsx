import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useFieldContext } from "./login-form";

export function PasswordField() {
	// The `Field` infers that it should have a `value` type of `string`
	const field = useFieldContext<string>();
	return (
		<div className="grid gap-2">
			<div className="flex items-center">
				<Label htmlFor="password">Password</Label>
				<a className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
					Forgot your password?
				</a>
			</div>
			<Input
				type="password"
				placeholder="password"
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				required
			/>
		</div>
	);
}
