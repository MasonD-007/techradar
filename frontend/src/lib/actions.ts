"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api } from "./api";
import { logError, logInfo } from "./logger";
import { decodeJwt } from "./jwt";
import type { components } from "./openapi";

type GetResponse<T> = {
	data?: T;
	response: Response;
};

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
type LoginRequest = components["schemas"]["dto.LoginRequest"];
type RegisterRequest = components["schemas"]["dto.RegisterRequest"];
export type AuthResponse = components["schemas"]["dto.AuthResponse"];

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
		const result = await api.GET("/blips");
		const { data, response } = result as GetResponse<Blip[]>;

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
		const result = await api.GET(`/blips/${id}`, {});
		const { data, response } = result as GetResponse<Blip>;

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
		const result = (await api.POST("/blips", { body })) as any as {
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
		const result = (await api.PUT(`/blips/${id}`, { body })) as any as {
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
		const result = (await api.DELETE(`/blips/${id}`, {})) as any as {
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
		const result = (await api.GET("/technologies", {})) as any as {
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
		const result = (await api.GET(`/technologies/${id}`, {})) as any as {
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
		const result = (await api.GET(
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
		const result = (await api.GET(
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

	logInfo("createTechnology", "START", { name, quadrantId });

	if (!name || !quadrantId) {
		return { success: false, error: "Name and quadrant_id are required" };
	}

	try {
		const body: CreateTechnologyRequest = {
			name,
			quadrant_id: parseInt(quadrantId, 10),
		};
		const result = (await api.POST("/technologies", { body })) as any as {
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
		const result = (await api.PUT(`/technologies/${id}`, {
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
		const result = (await api.DELETE(`/technologies/${id}`, {})) as any as {
			response: Response;
		};
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
		const result = (await api.GET("/users", {})) as any as {
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
		const result = (await api.GET(`/users/${id}`, {})) as any as {
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
		const result = (await api.POST("/users", { body })) as any as {
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
		const result = (await api.PUT(`/users/${id}`, { body })) as any as {
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
		const result = (await api.DELETE(`/users/${id}`, {})) as any as {
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
		const result = (await api.POST("/user-technologies", {
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

const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

async function setAuthCookie(token: string): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: COOKIE_MAX_AGE,
		path: "/",
	});
}

async function deleteAuthCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
}

export async function login(formData: FormData): Promise<ActionResult<AuthResponse>> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	logInfo("login", "START", { email });

	if (!email || !password) {
		return { success: false, error: "Email and password are required" };
	}

	try {
		const body: LoginRequest = { email, password };
		const result = (await api.POST("/auth/login", { body })) as any as {
			data?: AuthResponse;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("login", "ERROR", msg, { status: response.status });
			return { success: false, error: msg };
		}

		if (data?.token) {
			await setAuthCookie(data.token);
		}

		logInfo("login", "SUCCESS", { email });
		revalidatePath("/");
		return { success: true, data };
	} catch (error) {
		logError("login", "ERROR", getErrorMessage(error), { email });
		return { success: false, error: "Failed to login" };
	}
}

export async function register(
	formData: FormData,
): Promise<ActionResult<AuthResponse>> {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;

	logInfo("register", "START", { email, username });

	if (!name || !email || !username || !password) {
		return { success: false, error: "All fields are required" };
	}

	try {
		const body: RegisterRequest = { name, email, username, password };
		const result = (await api.POST("/auth/register", { body })) as any as {
			data?: AuthResponse;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) {
			const msg = getErrorMessage(data);
			logError("register", "ERROR", msg, { status: response.status });
			return { success: false, error: msg };
		}

		if (data?.token) {
			await setAuthCookie(data.token);
		}

		logInfo("register", "SUCCESS", { email });
		revalidatePath("/");
		return { success: true, data };
	} catch (error) {
		logError("register", "ERROR", getErrorMessage(error), {});
		return { success: false, error: "Failed to register" };
	}
}

export async function logout(): Promise<ActionResult> {
	logInfo("logout", "START", {});

	try {
		const result = (await api.POST("/auth/logout", {})) as any as {
			response: Response;
		};
		const { response } = result;

		if (!response.ok) {
			logError("logout", "ERROR", "Logout API failed", {
				status: response.status,
			});
		}
	} catch (error) {
		logError("logout", "ERROR", getErrorMessage(error), {});
	} finally {
		await deleteAuthCookie();
	}

	logInfo("logout", "SUCCESS", {});
	revalidatePath("/");
	return { success: true };
}

export async function getCurrentUserId(): Promise<string | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_NAME)?.value;
	if (!token) return null;

	const decoded = decodeJwt(token);
	return decoded?.userId || null;
}

export async function getCurrentUser(): Promise<User | null> {
	const userId = await getCurrentUserId();
	if (!userId) return null;

	try {
		const result = (await api.GET(`/users/${userId}`, {})) as any as {
			data?: User;
			response: Response;
		};
		const { data, response } = result;

		if (!response.ok) return null;
		return data || null;
	} catch {
		return null;
	}
}
