import { ChevronsUpDown } from "lucide-react";
// import { ThemeToggle } from "../light-dark-button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
    DropdownMenu,
    // DropdownMenuContent,
    // DropdownMenuGroup,
    // DropdownMenuItem,
    // DropdownMenuLabel,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
// import { Separator } from "../ui/separator";
import {
    SidebarGroup,
    SidebarMenuButton,
    SidebarMenuItem,
} from "../ui/sidebar";
import DropdownSettings from "./dropdown-settings";

export default function Settings() {
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
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start justify-center">
                                    {/* TODO: Replace with auth data */}
                                    <p>John Doe</p>
                                    <p>{"example@example.com".slice(0, 12) + "..."}</p>
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    {/* <DropdownMenuContent side="right" align="end">
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
					</DropdownMenuContent> */}
                    <DropdownSettings />
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarGroup>
    );
}
