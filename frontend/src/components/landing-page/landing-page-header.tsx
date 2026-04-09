import SendToRadarButton from "./send-to-radar-button";
import TestApiButtons from "./test-api-buttons";

export default function LandingPageHeader() {
	return (
		<header className="flex w-full items-center justify-between gap-4 bg-background-700 p-5">
			<h1 className="mb-4 font-bold text-4xl">Welcome to TechRadar</h1>
			<div className="flex items-center gap-4">
				<SendToRadarButton />
				<TestApiButtons />
			</div>
		</header>
	);
}
