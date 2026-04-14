"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

function getInitialTheme(): boolean {
	if (typeof document === "undefined") return false;
	const saved = localStorage.getItem("theme");
	if (saved === "dark") return true;
	if (saved === "light") return false;
	return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
	const [isDark, setIsDark] = useState(getInitialTheme);

	useEffect(() => {
		const saved = localStorage.getItem("theme");
		if (saved === "dark") document.documentElement.classList.add("dark");
		else if (saved === "light")
			document.documentElement.classList.remove("dark");
		else if (
			!document.documentElement.classList.contains("dark") &&
			!document.documentElement.classList.contains("light")
		) {
			document.documentElement.classList.add("light");
		}
	}, []);

	return (
		<Button
			onClick={() => {
				const nextDark = !document.documentElement.classList.contains("dark");
				document.documentElement.classList.toggle("dark", nextDark);
				localStorage.setItem("theme", nextDark ? "dark" : "light");
				setIsDark(nextDark);
			}}
			className={className || "size-13 cursor-pointer rounded-full p-0"}
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}
