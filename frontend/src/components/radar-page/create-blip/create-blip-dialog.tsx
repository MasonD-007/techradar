import { Dialog, DialogContent, DialogTrigger } from "../../ui/dialog";
import CreateBlipForm from "./create-blip-form";

export default function CreateBlipDialog() {
	return (
		<Dialog>
			<DialogTrigger className="cursor-pointer">Create Blip</DialogTrigger>
			<DialogContent>
				<CreateBlipForm />
			</DialogContent>
		</Dialog>
	);
}
