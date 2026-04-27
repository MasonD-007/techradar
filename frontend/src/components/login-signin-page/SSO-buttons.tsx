import Image from "next/image";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function SSOButtons() {
	return (
		<div className="my-4 flex w-full flex-col items-center justify-center gap-5">
			<Separator />
			<div className="flex w-full items-center justify-center gap-3">
				<Button className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-[8px] bg-neutral p-0">
					<Image
						// TODO: Only use dark version when in dark mode.
						src="/google-dark-square.svg"
						alt="Google"
						fill
						className="object-contain"
					/>
				</Button>
				<Button className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[8px] border-[1.5px] border-foreground/50 bg-accent p-0">
					<Image
						src="/github.svg"
						alt="GitHub"
						width={24}
						height={24}
						className="invert"
					/>
				</Button>
			</div>
		</div>
	);
}
