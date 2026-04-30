export function decodeJwt(token: string): { userId?: string; username?: string; role?: string } | null {
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		return {
			userId: payload.user_id,
			username: payload.username,
			role: payload.role,
		};
	} catch {
		return null;
	}
}