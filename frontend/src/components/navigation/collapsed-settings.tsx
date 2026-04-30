"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { SidebarGroup, SidebarMenuItem } from "../ui/sidebar";
import { type User } from "@/lib/actions";
import DropdownSettings from "./dropdown-settings";

interface CollapsedSettingsProps {
	user: User | null;
}

export default function CollapsedSettings({ user }: CollapsedSettingsProps) {
	return (
		<SidebarGroup className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
			<SidebarMenuItem className="flex cursor-pointer list-none justify-center">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{user ? (
							<Avatar>
								<AvatarImage src="https://github.com/shadcn.png" />
								<AvatarFallback>
									{user.name?.slice(0, 2).toUpperCase() || "U"}
								</AvatarFallback>
							</Avatar>
						) : (
							<Avatar>
								<AvatarFallback>?</AvatarFallback>
							</Avatar>
						)}
					</DropdownMenuTrigger>
					<DropdownSettings />
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarGroup>
	);
}
