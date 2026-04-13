import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarMenuButton,
	SidebarMenuItem,
} from "../ui/sidebar";
import DropdownSettings from "./dropdown-settings";

export default function CollapsedSettings() {
	return (
		<SidebarGroup className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
			<SidebarMenuItem className="flex cursor-pointer list-none justify-center">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{/* <SidebarMenuButton
							size="lg"
							className="cursor-pointer border-2 border-accent"
						> */}
						<Avatar>
							<AvatarImage src="https://github.com/shadcn.png" />
							<AvatarFallback>CN</AvatarFallback>
						</Avatar>
						{/* </SidebarMenuButton> */}
					</DropdownMenuTrigger>
					<DropdownSettings />
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarGroup>
	);
}
