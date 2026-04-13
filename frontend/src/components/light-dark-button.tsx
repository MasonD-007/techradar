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
		if (saved === "dark") document.documentElement.classList.add("dark");
		if (saved === "light") document.documentElement.classList.remove("dark");

		setIsDark(document.documentElement.classList.contains("dark"));
	}, []);

	if (!mounted) return null;

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
