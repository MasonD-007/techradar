"use client";

import {
	createFormHook,
	createFormHookContexts,
} from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { EmailField } from "./email-field";
import { PasswordField } from "./password-field";

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
	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: (values) => {
			console.log(values);
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
					onClick={() => form.handleSubmit()}
				>
					Sign Up
				</Button>
				{/* <Button variant="outline" className="w-full">
                        Login with Google
                    </Button> */}
			</CardFooter>
		</Card>
	);
}
