import { betterAuth } from "better-auth";
import { connection } from "next/server";

export const auth = betterAuth({
	// database: new Pool({
	// 	connectionString: process.env.DATABASE_URL!,
	// }),
});
