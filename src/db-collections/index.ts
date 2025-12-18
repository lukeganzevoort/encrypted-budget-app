import {
	createCollection,
	localOnlyCollectionOptions,
	localStorageCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

const MessageSchema = z.object({
	id: z.number(),
	text: z.string(),
	user: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const messagesCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (message) => message.id,
		schema: MessageSchema,
	}),
);

const TransactionSplitSchema = z.object({
	categoryId: z.string().optional(),
	amount: z.number(),
});

const TransactionSchema = z.object({
	id: z.string(),
	date: z.string(), // Format: "YYYY-MM-DD"
	description: z.string(),
	amount: z.number(),
	accountId: z.string(),
	categoryId: z.string().optional(),
	splits: z.array(TransactionSplitSchema).optional(),
});

export type TransactionSplit = z.infer<typeof TransactionSplitSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;

export const transactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: "transactions",
		storageKey: "transactions",
		getKey: (transaction) => transaction.id,
		schema: TransactionSchema,
	}),
);

const IncomeCategorySchema = z.object({
	id: z.string(),
	budgetedAmount: z.number(), // Positive number
	startMonth: z.string(), // Format: "YYYY-MM"
});

export type IncomeCategory = z.infer<typeof IncomeCategorySchema>;

export const incomeCategoriesCollection = createCollection(
	localStorageCollectionOptions({
		id: "income-categories",
		storageKey: "income-categories",
		getKey: (category) => category.id,
		schema: IncomeCategorySchema,
	}),
);

/**
 * RolloverConfigSchema explained:
 *
 * - type: "rollover"
 *     - Just rolls over any leftover budget to the next month in the same category.
 *     - No need for targetCategoryId or maxRolloverAmount.
 *
 * - type: "transfer"
 *     - If money is left over, transfers the remainder to another category.
 *     - Requires targetCategoryId (the category to transfer to).
 *     - maxRolloverAmount is not used.
 *
 * - type: "conditional"
 *     - Rolls over up to a maxRolloverAmount (if specified), and the rest (if any) transfers to targetCategoryId.
 *     - Requires both targetCategoryId and maxRolloverAmount.
 */
const RolloverConfigSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("rollover"),
	}),
	z.object({
		type: z.literal("transfer"),
		targetCategoryId: z.string(),
	}),
	z.object({
		type: z.literal("conditional"),
		targetCategoryId: z.string(),
		maxRolloverAmount: z.number(),
	}),
]);

export type RolloverConfig = z.infer<typeof RolloverConfigSchema>;

const MonthlyBudgetSchema = z.object({
	budgetedAmount: z.number(),
	startMonth: z.string(), // Format: "YYYY-MM"
	rolloverConfig: RolloverConfigSchema.optional(),
});

export type MonthlyBudget = z.infer<typeof MonthlyBudgetSchema>;

const BudgetCategorySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	order: z.number(),
	icon: z.string(),
	color: z.string(),
	monthlyBudgets: z.array(MonthlyBudgetSchema),
	startMonth: z.string(), // Format: "YYYY-MM" - the month this category was created (inclusive)
	endMonth: z.string().optional(), // Format: "YYYY-MM" - if set, this category stops applying next month (inclusive)
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

/**
 * Gets the budgeted amount for a specific month from a category
 * Returns 0 if no budget exists for that month
 */
export function getBudgetedAmountForMonth(
	category: BudgetCategory,
	month: string,
): number {
	if (category.endMonth && category.endMonth < month) {
		return 0;
	}
	// Find the most recent monthly budget that applies to the target month
	// A budget applies if: startMonth <= month AND (endMonth is undefined OR endMonth >= month)
	const relevantBudgets = category.monthlyBudgets
		.filter((mb) => mb.startMonth <= month)
		.sort((a, b) => b.startMonth.localeCompare(a.startMonth));

	if (relevantBudgets.length === 0) {
		return 0;
	}

	// Return the most recent budget (the one with the latest startMonth that applies)
	return relevantBudgets[0]?.budgetedAmount ?? 0;
}

/**
 * Gets the rollover configuration for a specific month from a category
 * Returns undefined if no rollover config exists for that month
 */
export function getRolloverConfigForMonth(
	category: BudgetCategory,
	month: string,
): RolloverConfig | undefined {
	if (category.endMonth && category.endMonth < month) {
		return undefined;
	}
	// Find the most recent monthly budget that applies to the target month
	const relevantBudgets = category.monthlyBudgets
		.filter((mb) => mb.startMonth <= month)
		.sort((a, b) => b.startMonth.localeCompare(a.startMonth));

	if (relevantBudgets.length === 0) {
		return undefined;
	}

	// Return the rollover config from the most recent budget
	return relevantBudgets[0]?.rolloverConfig;
}

/**
 * Checks if a category is active for a specific month
 */
export function isCategoryActiveForMonth(
	category: BudgetCategory,
	month: string,
): boolean {
	return (
		category.startMonth <= month &&
		(category.endMonth === undefined || category.endMonth >= month) // endMonth is inclusive
	);
}

/**
 * Gets the earliest start month from a category's monthly budgets
 */
export function getEarliestStartMonth(
	category: BudgetCategory,
): string | undefined {
	if (category.monthlyBudgets.length === 0) {
		return undefined;
	}
	return category.monthlyBudgets
		.map((mb) => mb.startMonth)
		.sort((a, b) => a.localeCompare(b))[0];
}

export const budgetCategoriesCollection = createCollection(
	localStorageCollectionOptions({
		id: "budget-categories",
		storageKey: "budget-categories",
		getKey: (category) => category.id,
		schema: BudgetCategorySchema,
	}),
);

const AccountSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum([
		"checking",
		"savings",
		"investment",
		"other",
		"credit",
		"loan",
		"mortgage",
	]),
	balance: z.number(),
	creditLimit: z.number().optional(),
	interestRate: z.number().optional(),
	icon: z.string().optional(),
	color: z.string().optional(),
	order: z.number(),
	isActive: z.boolean().default(true),
	isDefault: z.boolean().default(false),
});

export type Account = z.infer<typeof AccountSchema>;

export const accountsCollection = createCollection(
	localStorageCollectionOptions({
		id: "accounts",
		storageKey: "accounts",
		getKey: (account) => account.id,
		schema: AccountSchema,
	}),
);
