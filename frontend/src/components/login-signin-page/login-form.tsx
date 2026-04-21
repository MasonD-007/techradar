"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { EmailField } from "@/components/login-signin-page/email-field";
import { PasswordField } from "@/components/login-signin-page/password-field";
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

export default function LoginForm() {
	const router = useRouter();
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
				<CardTitle>Login to your account</CardTitle>
				<CardDescription>
					Enter your email below to login to your account
				</CardDescription>
				<CardAction>
					<Button variant="link" onClick={() => router.push("/sign-up")}>
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
					Login
				</Button>
				{/* <Button variant="outline" className="w-full">
                        Login with Google
                    </Button> */}
			</CardFooter>
		</Card>
	);
}
