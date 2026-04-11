import { CircleUser } from "lucide-react";
import { useRouter } from "next/dist/client/components/navigation";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "../ui/hover-card";
import { SidebarMenuItem } from "../ui/sidebar";

export default function CollapsedIcons({
	children,
	title,
	path,
}: {
	children?: React.ReactNode;
	title?: string;
	path?: string;
}) {
	const router = useRouter();

	return (
		<SidebarMenuItem className="list-none">
			<HoverCard>
				<HoverCardTrigger
					className="cursor-pointer"
					onClick={() => router.push(path ?? "/radar")}
				>
					{children}
				</HoverCardTrigger>
				<HoverCardContent side="right" align="start">
					{title}
				</HoverCardContent>
			</HoverCard>
		</SidebarMenuItem>
	);
}
