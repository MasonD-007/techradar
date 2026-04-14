// import { ChevronsUpDown } from "lucide-react";
// import { ThemeToggle } from "../light-dark-button";
// import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
} from "../ui/dropdown-menu";
// import { DropdownMenuTrigger } from "../ui/dropdown-menu";
// import { Separator } from "../ui/separator";
// import { SidebarMenuButton } from "../ui/sidebar";

export default function DropdownSettings() {
	return (
		<DropdownMenuContent side="right" align="end">
			<DropdownMenuGroup>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Settings</DropdownMenuItem>
				<DropdownMenuItem>Logout</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}
