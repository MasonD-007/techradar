import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { getCurrentUserId } from "@/lib/actions";
import SearchTechnologiesDialogContent from "./search-tech-dialog-content";

export default async function SearchTechnologiesDialog() {
	const userId = await getCurrentUserId();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Search Technologies</Button>
			</DialogTrigger>
			<SearchTechnologiesDialogContent userId={userId} />
		</Dialog>
	);
}
