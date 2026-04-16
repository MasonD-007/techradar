"use client";

import {
	createFormHook,
	createFormHookContexts,
	useForm,
} from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TechnologyField from "./form-fields/technology-field";

export const { fieldContext, formContext, useFieldContext } =
	createFormHookContexts();

const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TechnologyField,
	},
	formComponents: {},
});

export default function CreateBlipForm() {
	const form = useAppForm({
		defaultValues: {
			technology: "",
			description: "",
		},
		onSubmit: async ({ value }) => {
			console.log("Create blip form submitted", value);
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
			className="space-y-4"
		>
			{/* <form.Field name="technology">
				{(field) => (
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
				)}
			</form.Field> */}
			<form.AppField
				name="technology"
				children={(field) => <field.TechnologyField label="Technology" />}
			/>

			<form.Field name="description">
				{(field) => (
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
					</div>
				)}
			</form.Field>

			<Button type="submit" className="w-full">
				Create Blip
			</Button>
		</form>
	);
}
