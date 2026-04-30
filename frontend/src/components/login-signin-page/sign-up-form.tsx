"use client";

import {
	createFormHook,
	createFormHookContexts,
} from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { EmailField } from "./email-field";
import { PasswordField } from "./password-field";
import { register } from "@/lib/actions";
import { toast } from "sonner";

export const { fieldContext, formContext, useFieldContext } =
	createFormHookContexts();

const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		EmailField,
		PasswordField,
	},
	formComponents: {},
});

export default function SignUpForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const form = useAppForm({
		defaultValues: {
			name: "",
			username: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("name", value.name);
			formData.append("username", value.username);
			formData.append("email", value.email);
			formData.append("password", value.password);

			const result = await register(formData);

			if (result.success) {
				toast.success("Account created successfully");
				router.push("/radar");
				router.refresh();
			} else {
				toast.error(result.error || "Registration failed");
			}

			setIsLoading(false);
		},
	});

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Make a new account</CardTitle>
				<CardDescription>
					Enter your email below to create a new account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<div className="flex flex-col gap-6">
						<form.AppField name="name">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										placeholder="John Doe"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										required
									/>
								</div>
							)}
						</form.AppField>
						<form.AppField name="username">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="username">Username</Label>
									<Input
										placeholder="johndoe"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										required
									/>
								</div>
							)}
						</form.AppField>
						<form.AppField name="email">
							{(field) => <field.EmailField />}
						</form.AppField>
						<form.AppField name="password">
							{(field) => <field.PasswordField />}
						</form.AppField>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex-col gap-2">
				<Button
					type="submit"
					className="w-full"
					disabled={isLoading}
					onClick={() => form.handleSubmit()}
				>
					{isLoading ? "Creating account..." : "Sign Up"}
				</Button>
				{/* <Button variant="outline" className="w-full">
                        Login with Google
                    </Button> */}
			</CardFooter>
		</Card>
	);
}
