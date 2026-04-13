import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SidebarGroup, SidebarMenuItem } from "../ui/sidebar";

export default function CollapsedSettings() {
	return (
		<SidebarGroup className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
			<SidebarMenuItem className="flex cursor-pointer list-none justify-center">
				<Avatar>
					<AvatarImage src="https://github.com/shadcn.png" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
			</SidebarMenuItem>
		</SidebarGroup>
	);
}
