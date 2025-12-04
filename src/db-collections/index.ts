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
	date: z.string(),
	description: z.string(),
	amount: z.number(),
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
