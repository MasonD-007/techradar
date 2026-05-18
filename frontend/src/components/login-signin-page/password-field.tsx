import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useFieldContext } from "./login-form";

export function PasswordField({ login }: { login?: boolean; }) {
    const field = useFieldContext<string>();
    return (
        <div className="grid gap-2">
            <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {login ? (
                    <a className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                        Forgot your password?
                    </a>
                ) : null
                }
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
