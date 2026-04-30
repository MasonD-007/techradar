"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function ThemeToggle({ className }: { className?: string }) {
	const [mounted, setMounted] = useState(false);
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		setMounted(true);

		const saved = localStorage.getItem("theme");

		const dark =
			saved === "dark" ||
			(!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);

		document.documentElement.classList.toggle("dark", dark);
		setIsDark(dark);
	}, []);

	const toggleTheme = () => {
		const nextDark = !isDark;

		document.documentElement.classList.toggle("dark", nextDark);
		localStorage.setItem("theme", nextDark ? "dark" : "light");

		setIsDark(nextDark);
	};

	if (!mounted) {
		return (
			<Button
				className={className || "size-10 rounded-full p-0"}
				aria-label="Toggle theme"
			/>
		);
	}

	return (
		<Button
			onClick={toggleTheme}
			className={className || "size-10 rounded-full p-0"}
			aria-label="Toggle theme"
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}
