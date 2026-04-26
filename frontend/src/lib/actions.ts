"use server";

import { revalidatePath } from "next/cache";
import { api } from "./api";
import { logError, logInfo } from "./logger";
import type { components } from "./openapi";

const apiClient = api as any;

export type Blip = components["schemas"]["handlers.Blip"];
export type Technology = components["schemas"]["handlers.Technology"];
export type User = components["schemas"]["handlers.User"];
export type UserTechnology = components["schemas"]["handlers.UserTechnology"];
type CreateBlipRequest = components["schemas"]["handlers.CreateBlipRequest"];
type UpdateBlipRequest = components["schemas"]["handlers.UpdateBlipRequest"];
type CreateTechnologyRequest =
	components["schemas"]["handlers.CreateTechnologyRequest"];
type UpdateTechnologyRequest =
	components["schemas"]["handlers.UpdateTechnologyRequest"];
type CreateUserRequest = components["schemas"]["handlers.CreateUserRequest"];
type UpdateUserRequest = components["schemas"]["handlers.UpdateUserRequest"];
type CreateUserTechnologyRequest =
	components["schemas"]["handlers.CreateUserTechnologyRequest"];
type ApiError = components["schemas"]["handlers.Error"];

export interface ActionResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

function getErrorMessage(err: unknown): string {
	if (err && typeof err === "object" && "message" in err) {
		return (err as ApiError).message || "An error occurred";
	}
	return "An error occurred";
}

export async function getBlips(): Promise<Blip[]> {
	logInfo("getBlips", "START", {});

	try {
		const result = (await apiClient.GET("/blips")) as any as {
			data?: Blip[];
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getBlips", "ERROR", msg, { status: response.status });
			return [];
		}

		logInfo("getBlips", "SUCCESS", { count: data?.length || 0 });
		return data || [];
	} catch (error) {
		logError("getBlips", "ERROR", getErrorMessage(error), {});
		return [];
	}
}

export async function getBlip(id: number): Promise<ActionResult<Blip>> {
	logInfo("getBlip", "START", { id });

	try {
		const result = (await apiClient.GET(`/blips/${id}`, {})) as any as {
			data?: Blip;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getBlip", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("getBlip", "SUCCESS", { id });
		return { success: true, data };
	} catch (error) {
		logError("getBlip", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to fetch blip" };
	}
}

export async function createBlip(
	formData: FormData,
): Promise<ActionResult<Blip>> {
	const context = formData.get("context") as string;

	logInfo("createBlip", "START", { context });

	if (!context) {
		return { success: false, error: "Context is required" };
	}

	try {
		const body: CreateBlipRequest = { context: JSON.parse(context) };
		const result = (await apiClient.POST("/blips", { body })) as any as {
			data?: Blip;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("createBlip", "ERROR", msg, { status: response.status });
			return { success: false, error: msg };
		}

		logInfo("createBlip", "SUCCESS", { id: data?.id });
		revalidatePath("/blips");
		return { success: true, data };
	} catch (error) {
		logError("createBlip", "ERROR", getErrorMessage(error), {});
		return { success: false, error: "Failed to create blip" };
	}
}

export async function updateBlip(
	id: number,
	formData: FormData,
): Promise<ActionResult<Blip>> {
	const context = formData.get("context") as string;

	logInfo("updateBlip", "START", { id, context });

	if (!context) {
		return { success: false, error: "Context is required" };
	}

	try {
		const body: UpdateBlipRequest = { context: JSON.parse(context) };
		const result = (await apiClient.PUT(`/blips/${id}`, { body })) as any as {
			data?: Blip;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("updateBlip", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("updateBlip", "SUCCESS", { id });
		return { success: true, data };
	} catch (error) {
		logError("updateBlip", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to update blip" };
	}
}

export async function deleteBlip(id: number): Promise<ActionResult> {
	logInfo("deleteBlip", "START", { id });

	try {
		const result = (await apiClient.DELETE(`/blips/${id}`, {})) as any as {
			response: Response;
		};
		const { response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(null);
			logError("deleteBlip", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("deleteBlip", "SUCCESS", { id });
		revalidatePath("/blips");
		return { success: true };
	} catch (error) {
		logError("deleteBlip", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to delete blip" };
	}
}

export async function getTechnologies(): Promise<ActionResult<Technology[]>> {
	logInfo("getTechnologies", "START", {});

	try {
		const result = (await apiClient.GET("/technologies", {})) as any as {
			data?: Technology[];
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getTechnologies", "ERROR", msg, { status: response.status });
			return { success: false, error: msg };
		}

		logInfo("getTechnologies", "SUCCESS", { count: data?.length || 0 });
		return { success: true, data: data || [] };
	} catch (error) {
		logError("getTechnologies", "ERROR", getErrorMessage(error), {});
		return { success: false, error: "Failed to fetch technologies" };
	}
}

export async function getTechnology(
	id: string,
): Promise<ActionResult<Technology>> {
	logInfo("getTechnology", "START", { id });

	try {
		const result = (await apiClient.GET(`/technologies/${id}`, {})) as any as {
			data?: Technology;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getTechnology", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("getTechnology", "SUCCESS", { id });
		return { success: true, data };
	} catch (error) {
		logError("getTechnology", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to fetch technology" };
	}
}

export async function getTechnologiesByQuadrant(
	quadrantId: number,
): Promise<ActionResult<Technology[]>> {
	logInfo("getTechnologiesByQuadrant", "START", { quadrantId });

	try {
		const result = (await apiClient.GET(
			`/technologies/by-quadrant/${quadrantId}`,
			{},
		)) as any as { data?: Technology[]; response: Response };
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getTechnologiesByQuadrant", "ERROR", msg, {
				quadrantId,
				status: response.status,
			});
			return { success: false, error: msg };
		}

		logInfo("getTechnologiesByQuadrant", "SUCCESS", {
			quadrantId,
			count: data?.length || 0,
		});
		return { success: true, data };
	} catch (error) {
		logError("getTechnologiesByQuadrant", "ERROR", getErrorMessage(error), {
			quadrantId,
		});
		return { success: false, error: "Failed to fetch technologies" };
	}
}

export async function getTechnologiesByUser(
	userId: string,
): Promise<ActionResult<Technology[]>> {
	logInfo("getTechnologiesByUser", "START", { userId });

	try {
		const result = (await apiClient.GET(
			`/technologies/by-user/${userId}`,
			{},
		)) as any as { data?: Technology[]; response: Response };
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getTechnologiesByUser", "ERROR", msg, {
				userId,
				status: response.status,
			});
			return { success: false, error: msg };
		}

		logInfo("getTechnologiesByUser", "SUCCESS", {
			userId,
			count: data?.length || 0,
		});
		return { success: true, data };
	} catch (error) {
		logError("getTechnologiesByUser", "ERROR", getErrorMessage(error), {
			userId,
		});
		return { success: false, error: "Failed to fetch technologies" };
	}
}

export async function createTechnology(
	formData: FormData,
): Promise<ActionResult<Technology>> {
	const name = formData.get("name") as string;
	const quadrantId = formData.get("quadrant_id") as string;
	const blipId = formData.get("blip_id") as string;

	logInfo("createTechnology", "START", { name, quadrantId, blipId });

	if (!name || !quadrantId) {
		return { success: false, error: "Name and quadrant_id are required" };
	}

	try {
		let finalBlipId: number;

		if (blipId) {
			finalBlipId = parseInt(blipId, 10);
		} else {
			const blipBody: CreateBlipRequest = {
				context: { created_from: "auto-technology" },
			};
			const blipResult = (await apiClient.POST("/blips", {
				body: blipBody,
			})) as any as { data?: Blip; response: Response };
			if (!blipResult.response.ok || !blipResult.data) {
				const msg = getErrorMessage(blipResult.data);
				logError(
					"createTechnology",
					"ERROR",
					`Failed to create blip: ${msg}`,
					{},
				);
				return { success: false, error: "Failed to create blip" };
			}
			finalBlipId = blipResult.data.id as number;
			logInfo("createTechnology", "AUTO_BLIP", { blipId: finalBlipId });
		}

		const body: CreateTechnologyRequest = {
			name,
			quadrant_id: parseInt(quadrantId, 10),
			blip_id: finalBlipId,
		};
		const result = (await apiClient.POST("/technologies", { body })) as any as {
			data?: Technology;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("createTechnology", "ERROR", msg, { status: response.status });
			return { success: false, error: msg };
		}

		logInfo("createTechnology", "SUCCESS", { id: data?.id });
		revalidatePath("/technologies");
		return { success: true, data };
	} catch (error) {
		logError("createTechnology", "ERROR", getErrorMessage(error), {});
		return { success: false, error: "Failed to create technology" };
	}
}

export async function updateTechnology(
	id: string,
	formData: FormData,
): Promise<ActionResult<Technology>> {
	const name = formData.get("name") as string;
	const quadrantId = formData.get("quadrant_id") as string;
	const blipId = formData.get("blip_id") as string;

	logInfo("updateTechnology", "START", { id, name, quadrantId, blipId });

	try {
		const body: UpdateTechnologyRequest = {
			name,
			quadrant_id: quadrantId ? parseInt(quadrantId, 10) : undefined,
			blip_id: blipId ? parseInt(blipId, 10) : undefined,
		};
		const result = (await apiClient.PUT(`/technologies/${id}`, {
			body,
		})) as any as { data?: Technology; response: Response };
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("updateTechnology", "ERROR", msg, {
				id,
				status: response.status,
			});
			return { success: false, error: msg };
		}

		logInfo("updateTechnology", "SUCCESS", { id });
		return { success: true, data };
	} catch (error) {
		logError("updateTechnology", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to update technology" };
	}
}

export async function deleteTechnology(id: string): Promise<ActionResult> {
	logInfo("deleteTechnology", "START", { id });

	try {
		const result = (await apiClient.DELETE(
			`/technologies/${id}`,
			{},
		)) as any as { response: Response };
		const { response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(null);
			logError("deleteTechnology", "ERROR", msg, {
				id,
				status: response.status,
			});
			return { success: false, error: msg };
		}

		logInfo("deleteTechnology", "SUCCESS", { id });
		revalidatePath("/technologies");
		return { success: true };
	} catch (error) {
		logError("deleteTechnology", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to delete technology" };
	}
}

export async function getUsers(): Promise<User[]> {
	logInfo("getUsers", "START", {});

	try {
		const result = (await apiClient.GET("/users", {})) as any as {
			data?: User[];
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getUsers", "ERROR", msg, { status: response.status });
			return [];
		}

		logInfo("getUsers", "SUCCESS", { count: data?.length || 0 });
		return data || [];
	} catch (error) {
		logError("getUsers", "ERROR", getErrorMessage(error), {});
		return [];
	}
}

export async function getUser(id: string): Promise<ActionResult<User>> {
	logInfo("getUser", "START", { id });

	try {
		const result = (await apiClient.GET(`/users/${id}`, {})) as any as {
			data?: User;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("getUser", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("getUser", "SUCCESS", { id });
		return { success: true, data };
	} catch (error) {
		logError("getUser", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to fetch user" };
	}
}

export async function createUser(
	formData: FormData,
): Promise<ActionResult<User>> {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;

	logInfo("createUser", "START", { name, email, username });

	if (!name || !email || !username || !password) {
		return { success: false, error: "All fields are required" };
	}

	try {
		const body: CreateUserRequest = {
			name,
			email,
			username,
			hashed_password: password,
		};
		const result = (await apiClient.POST("/users", { body })) as any as {
			data?: User;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("createUser", "ERROR", msg, { status: response.status });
			return { success: false, error: msg };
		}

		logInfo("createUser", "SUCCESS", { id: data?.id });
		revalidatePath("/users");
		return { success: true, data };
	} catch (error) {
		logError("createUser", "ERROR", getErrorMessage(error), {});
		return { success: false, error: "Failed to create user" };
	}
}

export async function updateUser(
	id: string,
	formData: FormData,
): Promise<ActionResult<User>> {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;

	logInfo("updateUser", "START", { id, name, email, username });

	try {
		const body: UpdateUserRequest = {
			name,
			email,
			username,
			hashed_password: password || undefined,
		};
		const result = (await apiClient.PUT(`/users/${id}`, { body })) as any as {
			data?: User;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("updateUser", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("updateUser", "SUCCESS", { id });
		return { success: true, data };
	} catch (error) {
		logError("updateUser", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to update user" };
	}
}

export async function deleteUser(id: string): Promise<ActionResult> {
	logInfo("deleteUser", "START", { id });

	try {
		const result = (await apiClient.DELETE(`/users/${id}`, {})) as any as {
			response: Response;
		};
		const { response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(null);
			logError("deleteUser", "ERROR", msg, { id, status: response.status });
			return { success: false, error: msg };
		}

		logInfo("deleteUser", "SUCCESS", { id });
		revalidatePath("/users");
		return { success: true };
	} catch (error) {
		logError("deleteUser", "ERROR", getErrorMessage(error), { id });
		return { success: false, error: "Failed to delete user" };
	}
}

export async function addTechnologyToUser(
	userId: string,
	technologyId: string,
): Promise<ActionResult<UserTechnology>> {
	logInfo("addTechnologyToUser", "START", { userId, technologyId });

	if (!userId || !technologyId) {
		return { success: false, error: "userId and technologyId are required" };
	}

	try {
		const body: CreateUserTechnologyRequest = {
			user_id: userId,
			technology_id: technologyId,
		};
		const result = (await apiClient.POST("/user-technologies", {
			body,
		})) as any as {
			data?: UserTechnology;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("addTechnologyToUser", "ERROR", msg, {
				userId,
				technologyId,
				status: response.status,
			});
			return { success: false, error: msg };
		}

		logInfo("addTechnologyToUser", "SUCCESS", {
			userId,
			technologyId,
			id: data?.id,
		});
		return { success: true, data };
	} catch (error) {
		logError("addTechnologyToUser", "ERROR", getErrorMessage(error), {
			userId,
			technologyId,
		});
		return { success: false, error: "Failed to add technology to user" };
	}
}
