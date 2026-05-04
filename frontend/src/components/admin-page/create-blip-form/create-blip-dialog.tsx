import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import CreateBlipForm from "./create-blip-form";

export default function CreateBlipDialog() {
	return (
		<Dialog>
			<DialogTrigger className="cursor-pointer border p-2">
				Create Blip
			</DialogTrigger>
			<DialogContent>
				<DialogTitle className="font-semibold text-lg">
					Create New Blip
				</DialogTitle>
				<CreateBlipForm />
			</DialogContent>
		</Dialog>
	);
}
