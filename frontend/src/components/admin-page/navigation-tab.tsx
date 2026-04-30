import {
	AlertCircle,
	Download,
	Eye,
	Plus,
	Trash2,
	Upload,
	UserMinus,
	UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	type Blip,
	getBlips,
	getTechnologies,
	getUsers,
	type Technology,
	type User as UserType,
} from "@/lib/actions";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import BlipsContent from "./tab-content.tsx/blips-content";
import ImportContent from "./tab-content.tsx/import-content";
import OverviewContent from "./tab-content.tsx/overview-content";
import TechnologiesContent from "./tab-content.tsx/technologies-content";
import UsersContent from "./tab-content.tsx/users-content";

function getActionIcon(actionType: string) {
	switch (actionType) {
		case "Technology Created":
			return <Plus className="h-4 w-4 text-green-500" />;
		case "Technology Updated":
			return <Eye className="h-4 w-4 text-blue-500" />;
		case "Technology Deleted":
			return <Trash2 className="h-4 w-4 text-red-500" />;
		case "Blip Created":
			return <Plus className="h-4 w-4 text-green-500" />;
		case "Blip Deleted":
			return <Trash2 className="h-4 w-4 text-red-500" />;
		case "User Created":
			return <UserPlus className="h-4 w-4 text-green-500" />;
		case "User Deleted":
			return <UserMinus className="h-4 w-4 text-red-500" />;
		case "Bulk Import":
			return <Upload className="h-4 w-4 text-purple-500" />;
		case "Bulk Export":
			return <Download className="h-4 w-4 text-purple-500" />;
		default:
			return <AlertCircle className="h-4 w-4 text-gray-500" />;
	}
}

const mockActivity = [
	{
		id: "1",
		action_type: "Technology Created",
		description: "Added React to tools quadrant",
		user: "Admin",
		created_at: "2026-04-15 10:30",
	},
	{
		id: "2",
		action_type: "User Created",
		description: "Created user John Doe",
		user: "Admin",
		created_at: "2026-04-15 09:15",
	},
	{
		id: "3",
		action_type: "Technology Updated",
		description: "Updated TypeScript quadrant",
		user: "Admin",
		created_at: "2026-04-14 16:45",
	},
	{
		id: "4",
		action_type: "Blip Deleted",
		description: "Removed old blip data",
		user: "Admin",
		created_at: "2026-04-14 14:20",
	},
	{
		id: "5",
		action_type: "Bulk Import",
		description: "Imported 10 technologies",
		user: "Admin",
		created_at: "2026-04-13 11:00",
	},
	{
		id: "6",
		action_type: "Technology Created",
		description: "Added Docker to tools",
		user: "Admin",
		created_at: "2026-04-13 09:30",
	},
	{
		id: "7",
		action_type: "User Deleted",
		description: "Removed user test@example.com",
		user: "Admin",
		created_at: "2026-04-12 15:00",
	},
	{
		id: "8",
		action_type: "Technology Created",
		description: "Added Kubernetes to platforms",
		user: "Admin",
		created_at: "2026-04-12 11:45",
	},
];

export default function NavigationTab() {
	const [technologies, setTechnologies] = useState<Technology[]>([]);
	const [blips, setBlips] = useState<Blip[]>([]);
	const [users, setUsers] = useState<UserType[]>([]);

	useEffect(() => {
		async function loadData() {
			const [techsResult, blipsResult, usersResult] = await Promise.all([
				getTechnologies(),
				getBlips(),
				getUsers(),
			]);
			setTechnologies(techsResult.success ? (techsResult.data ?? []) : []);
			setBlips(blipsResult);
			setUsers(usersResult);
		}
		loadData();
	}, []);

	const stats = {
		totalTechnologies: technologies.length,
		totalUsers: users.length,
		totalBlips: blips.length,
		quadrants: {
			tools: technologies.filter((t) => t.quadrant_id === 1).length,
			techniques: technologies.filter((t) => t.quadrant_id === 2).length,
			platforms: technologies.filter((t) => t.quadrant_id === 3).length,
			languages: technologies.filter((t) => t.quadrant_id === 4).length,
		},
	};

	return (
		<Tabs defaultValue="overview" className="w-full">
			<TabsList>
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="technologies">Technologies</TabsTrigger>
				<TabsTrigger value="blips">Blips</TabsTrigger>
				<TabsTrigger value="users">Users</TabsTrigger>
				<TabsTrigger value="import">Import/Export</TabsTrigger>
			</TabsList>

			<OverviewContent
				getActionIcon={getActionIcon}
				mockActivity={mockActivity}
				stats={stats}
				users={users}
				technologies={technologies}
			/>

			<TechnologiesContent
				blips={blips}
				technologies={technologies}
				setTechnologies={setTechnologies}
			/>

			<BlipsContent blips={blips} setBlips={setBlips} />

			<UsersContent users={users} setUsers={setUsers} />

			<ImportContent
				technologies={technologies}
				blips={blips}
				users={users}
				setTechnologies={setTechnologies}
			/>
		</Tabs>
	);
}
