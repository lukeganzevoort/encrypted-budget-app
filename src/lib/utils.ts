import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Generates a SHA-256 hash of the input string using the Web Crypto API
 * @param input - The string to hash
 * @returns A promise that resolves to a hexadecimal string representation of the hash
 */
export async function generateHash(input: string): Promise<string> {
	// Convert string to Uint8Array
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	// Generate SHA-256 hash
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);

	// Convert ArrayBuffer to hex string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return hashHex;
}

/**
 * Generates a unique hash ID for a transaction based on its data
 * @param date - Transaction date
 * @param description - Transaction description
 * @param amount - Transaction amount
 * @returns A promise that resolves to a unique hash string
 */
export async function generateTransactionHash(
	rawDate: string,
	rawDescription: string,
	rawAmount: string,
): Promise<string> {
	// Combine transaction data into a single string
	// Use a delimiter that's unlikely to appear naturally to avoid collisions
	const data = `${rawDate}|${rawDescription}|${rawAmount}`;
	return generateHash(data);
}
