"use client";

import { useRouter } from "next/dist/client/components/navigation";
import { Button } from "../ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarProvider,
	SidebarTrigger,
} from "../ui/sidebar";

export default function SideBarApp() {
	const router = useRouter();

	return (
		<Sidebar>
			{/* TODO: Use user's name? maybe switch between different radars */}
			<SidebarHeader>Tech Radar</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<Button
						onClick={() => router.push("/radar")}
						variant={"link"}
						className="cursor-pointer"
					>
						My Radar
					</Button>
				</SidebarGroup>
				<SidebarGroup>
					<Button
						onClick={() => router.push("/user")}
						variant={"link"}
						className="cursor-pointer"
					>
						Profile
					</Button>
				</SidebarGroup>
				<SidebarGroup>
					<Button
						onClick={() => router.push("/explore")}
						variant={"link"}
						className="cursor-pointer"
					>
						Explore
					</Button>
				</SidebarGroup>
				<SidebarGroup>
					<Button
						onClick={() => router.push("/technology")}
						variant={"link"}
						className="cursor-pointer"
					>
						Technologies
					</Button>
				</SidebarGroup>
				<SidebarGroup>
					<Button
						onClick={() => router.push("/compare")}
						variant={"link"}
						className="cursor-pointer"
					>
						Compare
					</Button>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
