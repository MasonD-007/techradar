"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions";
import { toast } from "sonner";
import {
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
} from "../ui/dropdown-menu";

export default function DropdownSettings() {
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		const result = await logout();

		if (result.success) {
			toast.success("Logged out successfully");
			router.push("/login");
			router.refresh();
		} else {
			toast.error(result.error || "Logout failed");
		}

		setIsLoggingOut(false);
	};

	return (
		<DropdownMenuContent side="right" align="end">
			<DropdownMenuGroup>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Settings</DropdownMenuItem>
				<DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
					{isLoggingOut ? "Logging out..." : "Logout"}
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}
