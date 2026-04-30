import type { JSX } from "react/jsx-dev-runtime";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import type { Technology, User as UserType } from "@/lib/actions";

export default function OverviewContent({
	stats,
	users,
	technologies,
	mockActivity,
	getActionIcon,
}: {
	stats: any;
	users: UserType[];
	technologies: Technology[];
	mockActivity: any;
	getActionIcon: (actionType: string) => JSX.Element;
}) {
	return (
		<TabsContent value="overview">
			<div className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Technologies
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats.totalTechnologies}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Total Users</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stats.totalUsers}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Total Blips</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stats.totalBlips}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Recent Activities
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{mockActivity.length}</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Tools Quadrant
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stats.quadrants.tools}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Techniques Quadrant
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats.quadrants.techniques}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Platforms Quadrant
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats.quadrants.platforms}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Languages Quadrant
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats.quadrants.languages}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Recent Technologies</CardTitle>
							<CardDescription>Last 5 technologies added</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Quadrant</TableHead>
										<TableHead>Created</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{technologies
										.slice(0, 5)
										.map((tech: Record<string, unknown>) => (
											<TableRow key={String(tech.id)}>
												<TableCell className="font-medium">
													{String(tech.name || "")}
												</TableCell>
												<TableCell>{String(tech.quadrant_id || "-")}</TableCell>
												<TableCell>{String(tech.created_at || "-")}</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Recent Users</CardTitle>
							<CardDescription>Last 5 users created</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Created</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.slice(0, 5).map((user: Record<string, unknown>) => (
										<TableRow key={String(user.id)}>
											<TableCell className="font-medium">
												{String(user.name || "")}
											</TableCell>
											<TableCell>{String(user.email || "")}</TableCell>
											<TableCell>{String(user.created_at || "-")}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Activity Log</CardTitle>
						<CardDescription>Recent admin actions</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Time</TableHead>
									<TableHead>Action</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>User</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{mockActivity.map((activity) => (
									<TableRow key={String(activity.id)}>
										<TableCell>{activity.created_at}</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{getActionIcon(activity.action_type)}
												{activity.action_type}
											</div>
										</TableCell>
										<TableCell>{activity.description}</TableCell>
										<TableCell>{activity.user}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</TabsContent>
	);
}
