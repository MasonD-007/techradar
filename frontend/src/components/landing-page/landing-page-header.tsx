import SendToRadarButton from "./send-to-radar-button";

export default function LandingPageHeader() {
	return (
		<header className="p-5 w-full bg-background-700 justify-between items-center flex">
			<h1 className="text-4xl font-bold mb-4">Welcome to TechRadar</h1>
			<SendToRadarButton />
		</header>
	);
}
