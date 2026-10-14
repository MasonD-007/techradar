const DEFAULT_AFTER_LOGIN = "/radar";

export function safeNextPath(next: string | null | undefined): string {
	if (!next || !next.startsWith("/")) return DEFAULT_AFTER_LOGIN;
	if (next.startsWith("//") || next.startsWith("/\\")) return DEFAULT_AFTER_LOGIN;
	return next;
}

export function loginUrlForShare(shareCode: string): string {
	return `/login?next=${encodeURIComponent(`/radar?share=${shareCode}`)}`;
}
