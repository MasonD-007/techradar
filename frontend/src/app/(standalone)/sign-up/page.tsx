"use client";

import {
	createFormHook,
	createFormHookContexts,
	useForm,
} from "@tanstack/react-form";
import { EmailField } from "@/components/login-page/email-field";
import { PasswordField } from "@/components/login-page/password-field";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function CardDemo() {
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
		<div className="flex h-screen items-center justify-center">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Make a new account</CardTitle>
					<CardDescription>
						Enter your email below to create a new account
					</CardDescription>
					<CardAction>
						<Button className="cursor-pointer" variant="link">
							Sign Up
						</Button>
					</CardAction>
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
								{(field) => <field.EmailField label="email" />}
							</form.AppField>
							<form.AppField name="password">
								{(field) => <field.PasswordField label="password" />}
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
		</div>
	);
}
