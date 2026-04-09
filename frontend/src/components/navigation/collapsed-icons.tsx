import { CircleUser } from "lucide-react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "../ui/hover-card";
import { SidebarMenuItem } from "../ui/sidebar";

export default function CollapsedIcons({
	children,
	title,
}: {
	children?: React.ReactNode;
	title?: string;
}) {
	return (
		<SidebarMenuItem>
			<HoverCard>
				<HoverCardTrigger className="cursor-pointer">
					{children}
				</HoverCardTrigger>
				<HoverCardContent side="right" align="start">
					{title}
				</HoverCardContent>
			</HoverCard>
		</SidebarMenuItem>
	);
}
