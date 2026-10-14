const DEFAULT_AFTER_LOGIN = "/radar";

export function safeNextPath(next: string | null | undefined): string {
	if (!next || !next.startsWith("/")) return DEFAULT_AFTER_LOGIN;
	if (next.startsWith("//") || next.startsWith("/\\")) return DEFAULT_AFTER_LOGIN;

	// Reject control characters (ASCII < 0x20 or 0x7f) anywhere in the string
	for (let i = 0; i < next.length; i++) {
		const code = next.charCodeAt(i);
		if (code < 0x20 || code === 0x7f) return DEFAULT_AFTER_LOGIN;
	}

	// Reject strings with backslashes
	if (next.includes("\\")) return DEFAULT_AFTER_LOGIN;

	// Verify the URL stays same-site after parsing
	try {
		const u = new URL(next, "http://placeholder.invalid");
		if (u.origin !== "http://placeholder.invalid") return DEFAULT_AFTER_LOGIN;
	} catch {
		return DEFAULT_AFTER_LOGIN;
	}

	return next;
}

export function loginUrlForShare(shareCode: string): string {
	return `/login?next=${encodeURIComponent(`/radar?share=${shareCode}`)}`;
}
