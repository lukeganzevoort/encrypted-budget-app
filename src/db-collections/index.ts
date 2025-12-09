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

const BudgetCategorySchema = z.object({
	id: z.string(),
	name: z.string(),
	budgetedAmount: z.number(),
	order: z.number(),
	icon: z.string().optional(),
	color: z.string().optional(),
	month: z.string(), // Format: "YYYY-MM"
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

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
