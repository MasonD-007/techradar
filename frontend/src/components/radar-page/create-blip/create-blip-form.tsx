"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { env } from "process";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import DescriptionField from "./form-fields/description-field";
import TechnologyField from "./form-fields/technology-field";

export const { fieldContext, formContext, useFieldContext } =
	createFormHookContexts();

const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TechnologyField,
		DescriptionField,
	},
	formComponents: {},
});
const createBlip = async (value: any) => {
	const { data, error } = await api.POST("/blips", {
		body: {
			context: value,
		},
	});
	if (data) {
		console.log("Blip created:", data);
	}
	if (error) {
		console.error("Error creating blip:", error);
	}
};

export default function CreateBlipForm() {
	// TODO: introduct type safety for form values
	const form = useAppForm({
		defaultValues: {
			technology: "",
			description: "",
		},
		onSubmit: async ({ value: blipObject }) => {
			await createBlip(blipObject);
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
			<form.AppField
				name="technology"
				validators={{
					onChange: ({ value }) => {
						if (!value) {
							return "You need to select a technology";
						}
						return undefined;
					},
				}}
			>
				{(field) => <field.TechnologyField label="Technology" />}
			</form.AppField>

			<form.AppField
				name="description"
				validators={{
					onChange: ({ value }) => {
						if (!value) {
							return "Description is required";
						}
						return undefined; // valid
					},
				}}
			>
				{(field) => <field.DescriptionField label="Description" />}
			</form.AppField>

			<Button type="submit" className="w-full">
				Create Blip
			</Button>
		</form>
	);
}
