import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
} from "../ui/sidebar";
import { Radar } from "lucide-react";
import RadarMenuItem from "./radar-menu-item";

export default function SideBarApp() {
	return (
		<Sidebar>
			{/* TODO: Use user's name? maybe switch between different radars */}
			<SidebarHeader>Tech Radar</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Personal</SidebarGroupLabel>
					<RadarMenuItem title="Your Radar" path="radar">
						<Radar />
					</RadarMenuItem>
					<RadarMenuItem title="Your Profile" path="user">
						<Radar />
					</RadarMenuItem>
					<RadarMenuItem title="Technologies" path="technology">
						<Radar />
					</RadarMenuItem>
					<RadarMenuItem title="Compare" path="compare">
						<Radar />
					</RadarMenuItem>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Explore</SidebarGroupLabel>
					<RadarMenuItem title="Explore Radars" path="explore">
						<Radar />
					</RadarMenuItem>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
