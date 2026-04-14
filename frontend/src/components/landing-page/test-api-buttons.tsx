"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "../ui/button";

export default function TestApiButtons() {
	const [result, setResult] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [createdId, setCreatedId] = useState<number | null>(null);

	const createBlip = async () => {
		setLoading(true);
		setResult("Creating blip...");
		const { data, error } = await api.POST("/blips", { body: { context: {} } });
		setLoading(false);
		if (error) {
			setResult(`Error: ${JSON.stringify(error)}`);
		} else {
			setCreatedId(data?.id ?? null);
			setResult(`Created: ${JSON.stringify(data, null, 2)}`);
		}
	};

	const fetchBlip = async () => {
		if (!createdId) {
			setResult("No blip created yet. Create one first!");
			return;
		}
		setLoading(true);
		setResult("Fetching blip...");
		const { data, error } = await api.GET("/blips/{id}", {
			params: { path: { id: createdId } },
		});
		setLoading(false);
		if (error) {
			setResult(`Error: ${JSON.stringify(error)}`);
		} else {
			setResult(`Blip: ${JSON.stringify(data, null, 2)}`);
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-2">
				<Button onClick={createBlip} disabled={loading} variant="outline">
					Create Test Blip
				</Button>
				<Button onClick={fetchBlip} disabled={loading} variant="outline">
					Fetch Created Blip
				</Button>
			</div>
			{result && (
				<pre className="max-h-40 overflow-auto rounded bg-gray-900 p-3 text-green-400 text-xs">
					{result}
				</pre>
			)}
		</div>
	);
}
