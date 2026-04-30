"use client";
import { LogIn } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function LoginButton() {
    const router = useRouter();
    return (
        <Button className="cursor-pointer" onClick={() => router.push("/login")}>
            Login <LogIn />
        </Button>
    );
}
