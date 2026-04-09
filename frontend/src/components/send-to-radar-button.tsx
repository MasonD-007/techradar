"use client";
import { ArrowRightFromLine } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function SendToRadarButton() {
    const router = useRouter();
    return (<Button className="cursor-pointer" onClick={() => router.push("/radar")}>
            Go to Your Radar <ArrowRightFromLine />
        </Button>)
}