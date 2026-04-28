type SelectedTechnologiesProps = {
	technologies?: string[];
};

export default function SelectedTechnologies({
	technologies = [],
}: SelectedTechnologiesProps) {
	const content =
		technologies.length > 0
			? technologies.join(", ")
			: "No technologies selected.";

	return (
		<div className="w-full rounded-md border p-4">
			<p>{content}</p>
		</div>
	);
}
