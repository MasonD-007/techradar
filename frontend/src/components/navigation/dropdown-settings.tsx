import { ChevronsUpDown } from "lucide-react";
import { ThemeToggle } from "../light-dark-button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { SidebarMenuButton } from "../ui/sidebar";

export default function DropdownSettings() {
	return (
		<DropdownMenuContent side="right" align="end">
			<DropdownMenuGroup>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Settings</DropdownMenuItem>
				<DropdownMenuItem>Logout</DropdownMenuItem>
			</DropdownMenuGroup>
			<Separator />
			<DropdownMenuGroup>
				<div className="flex w-full p-2">
					<ThemeToggle className="cursor-pointer bg-accent" />
				</div>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}
