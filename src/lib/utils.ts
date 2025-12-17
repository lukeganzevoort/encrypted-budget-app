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

/**
 * Formats a number as a dollar amount with 2 decimal places and comma separators
 * If negative, places the minus sign before the dollar sign (e.g., -$10,000.00)
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "$1,000.00" or "-$1,000.00")
 */
export function formatDollars(
	amount: number,
	includeSign: boolean = true,
	includeDecimal: boolean = true,
): string {
	const absAmount = Math.abs(amount);
	const formatted = absAmount.toLocaleString("en-US", {
		minimumFractionDigits: includeDecimal ? 2 : 0,
		maximumFractionDigits: includeDecimal ? 2 : 0,
	});
	return includeSign
		? amount < 0
			? `-$${formatted}`
			: `$${formatted}`
		: formatted;
}

/**
 * Calculates the previous month from a given month in "YYYY-MM" format
 */
export function getPreviousMonth(monthKey: string): string {
	const [year, month] = monthKey.split("-").map(Number);
	let prevMonth = month - 1;
	let prevYear = year;
	if (prevMonth < 1) {
		prevMonth = 12;
		prevYear = year - 1;
	}
	return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

export function getNextMonth(monthKey: string): string {
	const [year, month] = monthKey.split("-").map(Number);
	let nextMonth = month + 1;
	let nextYear = year;
	if (nextMonth > 12) {
		nextMonth = 1;
		nextYear = year + 1;
	}
	return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

export function getCurrentMonth(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}
