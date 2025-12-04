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

const TransactionSchema = z.object({
	id: z.string(),
	date: z.number(),
	description: z.string(),
	amount: z.number(),
	categoryId: z.string().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const transactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: "transactions",
		storageKey: "transactions",
		getKey: (transaction) => transaction.id,
		schema: TransactionSchema,
	}),
);

const BudgetSettingsSchema = z.object({
	id: z.string(),
	monthlyIncome: z.number(),
});

export type BudgetSettings = z.infer<typeof BudgetSettingsSchema>;

export const budgetSettingsCollection = createCollection(
	localStorageCollectionOptions({
		id: "budget-settings",
		storageKey: "budget-settings",
		getKey: (settings) => settings.id,
		schema: BudgetSettingsSchema,
	}),
);

const BudgetCategorySchema = z.object({
	id: z.string(),
	name: z.string(),
	budgetedAmount: z.number(),
	order: z.number(),
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
