"use client";
import { useRouter } from "next/dist/client/components/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export default function RadarMenuItem({
	children,
	title,
	path,
}: {
	children: React.ReactNode;
	title: string;
	path: string;
}) {
	const router = useRouter();
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={() => router.push(`/${path}`)}
				className="cursor-pointer"
			>
				<div className="ml-3 gap-2 flex items-center">
					{children}
					<span>{title}</span>
				</div>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
