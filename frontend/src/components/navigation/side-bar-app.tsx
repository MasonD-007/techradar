"use client";
import { CircleUser, Cpu, Radar, Scale } from "lucide-react";
import { useRouter } from "next/dist/client/components/navigation";
import Image from "next/image";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenuButton,
	SidebarMenuItem,
} from "../ui/sidebar";
import CollapsedIcons from "./collapsed-icons";
import CollapsedSettings from "./collapsed-settings";
import RadarMenuItem from "./radar-menu-item";
import Settings from "./settings";

export default function SideBarApp() {
	const router = useRouter();
	return (
		<Sidebar collapsible="icon">
			{/* TODO: Use user's name? maybe switch between different radars */}
			<SidebarHeader className="group-data-[collapsible=icon]:hidden">
				<SidebarMenuButton
					onClick={() => router.push("/radar")}
					className="cursor-pointer"
				>
					<Image src="/logo.png" alt="Logo" width={35} height={35} />
					Tech Radar
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent className="group-data-[collapsible=icon]:hidden">
				<SidebarGroup>
					<SidebarGroupLabel>Personal</SidebarGroupLabel>
					<RadarMenuItem title="Your Profile" path="user">
						<CircleUser />
					</RadarMenuItem>
					<RadarMenuItem title="Your Radar" path="radar">
						<Radar />
					</RadarMenuItem>
					<RadarMenuItem title="Technologies" path="technology">
						<Cpu />
					</RadarMenuItem>
					<RadarMenuItem title="Compare" path="compare">
						<Scale />
					</RadarMenuItem>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Explore</SidebarGroupLabel>
					<RadarMenuItem title="Explore Radars" path="explore">
						<Radar />
					</RadarMenuItem>
				</SidebarGroup>
			</SidebarContent>
			<SidebarContent className="hidden group-data-[collapsible=icon]:block">
				<SidebarGroup className="flex flex-col items-center gap-5">
					<SidebarMenuItem
						className="cursor-pointer list-none"
						onClick={() => router.push("/radar")}
					>
						<Image src="/logo.png" alt="Logo" width={40} height={40} />
					</SidebarMenuItem>
					<CollapsedIcons title="Your Profile" path="user">
						<CircleUser />
					</CollapsedIcons>
					<CollapsedIcons title="Your Radar" path="radar">
						<Radar />
					</CollapsedIcons>
					<CollapsedIcons title="Technologies" path="technology">
						<Cpu />
					</CollapsedIcons>
					<CollapsedIcons title="Compare" path="compare">
						<Scale />
					</CollapsedIcons>
					<CollapsedIcons title="Explore Radars" path="explore">
						<Radar />
					</CollapsedIcons>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<Settings />
				<CollapsedSettings />
			</SidebarFooter>
		</Sidebar>
	);
}
