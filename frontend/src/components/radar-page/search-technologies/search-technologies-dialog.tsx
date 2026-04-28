import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import SearchTechnologiesDialogContent from "./search-tech-dialog-content";

export default function SearchTechnologiesDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Search Technologies</Button>
			</DialogTrigger>
			<SearchTechnologiesDialogContent />
		</Dialog>
	);
}
