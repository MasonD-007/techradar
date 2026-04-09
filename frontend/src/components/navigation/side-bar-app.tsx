import { CircleUser, Cpu, Radar, Scale } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenuItem,
} from "../ui/sidebar";
import CollapsedIcons from "./collapsed-icons";
import RadarMenuItem from "./radar-menu-item";

export default function SideBarApp() {
	return (
		<Sidebar collapsible="icon">
			{/* TODO: Use user's name? maybe switch between different radars */}
			<SidebarHeader className="group-data-[collapsible=icon]:hidden">
				Tech Radar
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
				<SidebarGroup className="gap-5">
					<CollapsedIcons title="Your Profile">
						<CircleUser />
					</CollapsedIcons>
					<CollapsedIcons title="Your Radar">
						<Radar />
					</CollapsedIcons>
					<CollapsedIcons title="Technologies">
						<Cpu />
					</CollapsedIcons>
					<CollapsedIcons title="Compare">
						<Scale />
					</CollapsedIcons>
					<CollapsedIcons title="Explore Radars">
						<Radar />
					</CollapsedIcons>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
