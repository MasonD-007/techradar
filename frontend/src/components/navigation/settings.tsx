"use client";

import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarMenuButton,
	SidebarMenuItem,
} from "../ui/sidebar";
import { type User } from "@/lib/actions";
import DropdownSettings from "./dropdown-settings";

interface SettingsProps {
	user: User | null;
}

export default function Settings({ user }: SettingsProps) {
	if (!user) {
		return (
			<SidebarGroup className="group-data-[collapsible=icon]:hidden">
				<SidebarMenuItem className="list-none">
					<SidebarMenuButton asChild className="cursor-pointer">
						<a href="/login">Sign in</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarGroup>
		);
	}

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarMenuItem className="list-none">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="cursor-pointer border-2 border-accent"
						>
							<div className="flex w-full items-center gap-2">
								<Avatar>
									<AvatarImage src="https://github.com/shadcn.png" />
									<AvatarFallback>
										{user.name?.slice(0, 2).toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col items-start justify-center">
									<p>{user.name || user.username}</p>
									<p className="text-xs text-muted-foreground">
										{user.email}
									</p>
								</div>
								<ChevronsUpDown className="ml-auto" />
							</div>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownSettings />
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarGroup>
	);
}
