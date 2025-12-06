import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Split, X } from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	budgetCategoriesCollection,
	type Transaction,
	type TransactionSplit,
	transactionsCollection,
} from "@/db-collections/index";
import { generateTransactionHash } from "@/lib/utils";

export const Route = createFileRoute("/app/transactions")({
	component: RouteComponent,
});

type CsvRow = Record<string, string | undefined>;

const parseAmount = (amount: string | undefined): number => {
	if (!amount) return 0;
	return Number.parseFloat(
		amount.replace("$", "").replace(",", "").replace("(", "-").replace(")", ""),
	);
};

const parseDate = (rawDate: string): number => {
	// Parse as UTC to avoid local timezone interpretation
	const isoString = new Date(rawDate).toISOString();
	console.log("isoString", isoString);
	// Return Unix time (milliseconds since epoch)
	return new Date(isoString.split("T")[0]).getTime();
};

function RouteComponent() {
	const [fileName, setFileName] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [expandedTransactionId, setExpandedTransactionId] = useState<
		string | null
	>(null);

	// Query transactions from the database
	const { data: transactions } = useLiveQuery((q) =>
		q
			.from({ transaction: transactionsCollection })
			.select(({ transaction }) => ({
				...transaction,
			})),
	);

	// Query budget categories from the database
	const { data: budgetCategories } = useLiveQuery((q) =>
		q.from({ category: budgetCategoriesCollection }).select(({ category }) => ({
			...category,
		})),
	);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setFileName(file.name);
		setIsLoading(true);

		Papa.parse<CsvRow>(file, {
			transformHeader(header) {
				if (/\bamount\b/i.test(header)) {
					return "rawAmount";
				}
				if (/\bdate\b/i.test(header)) {
					return "rawDate";
				}
				if (/\bdescription\b/i.test(header)) {
					return "rawDescription";
				}
				return header;
			},
			complete: async (results) => {
				console.log("Parsed CSV data:", results.data);

				// Insert parsed data into transactions collection
				for (const row of results.data) {
					const { rawDate, rawDescription, rawAmount } = row;

					if (!rawDate || !rawDescription || !rawAmount) {
						throw new Error("Missing required fields");
					}

					// Generate a unique hash ID based on transaction data
					const uniqueId = await generateTransactionHash(
						rawDate,
						rawDescription,
						rawAmount,
					);

					const amount = parseAmount(rawAmount);
					const date = parseDate(rawDate);

					const transaction: Transaction = {
						id: uniqueId,
						date,
						description: rawDescription,
						amount,
					};
					try {
						console.log("Inserting new transaction:", transaction);
						transactionsCollection.insert(transaction);
					} catch (error) {
						console.error("Error inserting transaction:", error);
					}
				}

				setIsLoading(false);
			},
			header: true, // Use first row as headers
			skipEmptyLines: true,
			error: (error) => {
				console.error("Error parsing CSV:", error);
				setIsLoading(false);
			},
		});
	};

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	const handleCategoryChange = (transactionId: string, categoryId: string) => {
		transactionsCollection.update(transactionId, (item) => {
			item.categoryId = categoryId === "uncategorized" ? undefined : categoryId;
			// Clear splits when changing the main category
			item.splits = undefined;
		});
	};

	const toggleSplit = (transactionId: string) => {
		const transaction = transactions?.find((t) => t.id === transactionId);
		if (!transaction) return;

		if (expandedTransactionId === transactionId) {
			// Closing split view
			setExpandedTransactionId(null);
		} else {
			// Opening split view
			setExpandedTransactionId(transactionId);

			// Initialize splits if not already set
			if (!transaction.splits || transaction.splits.length === 0) {
				const halfAmount = Math.abs(transaction.amount) / 2;
				transactionsCollection.update(transactionId, (item) => {
					item.splits = [
						{ categoryId: item.categoryId, amount: halfAmount },
						{ categoryId: undefined, amount: halfAmount },
					];
					// Clear main categoryId when using splits
					item.categoryId = undefined;
				});
			}
		}
	};

	const updateSplitCategory = (
		transactionId: string,
		splitIndex: number,
		categoryId: string,
	) => {
		transactionsCollection.update(transactionId, (item) => {
			if (!item.splits) return;
			item.splits[splitIndex].categoryId =
				categoryId === "uncategorized" ? undefined : categoryId;
		});
	};

	const updateSplitAmount = (
		transactionId: string,
		splitIndex: number,
		amount: number,
	) => {
		transactionsCollection.update(transactionId, (item) => {
			if (!item.splits) return;
			item.splits[splitIndex].amount = amount;
		});
	};

	const addSplit = (transactionId: string) => {
		transactionsCollection.update(transactionId, (item) => {
			if (!item.splits) return;
			item.splits.push({ categoryId: undefined, amount: 0 });
		});
	};

	const removeSplit = (transactionId: string, splitIndex: number) => {
		transactionsCollection.update(transactionId, (item) => {
			if (!item.splits || item.splits.length <= 2) return;
			item.splits.splice(splitIndex, 1);
		});
	};

	const getSplitTotal = (splits?: TransactionSplit[]): number => {
		if (!splits) return 0;
		return splits.reduce((sum, split) => sum + split.amount, 0);
	};

	// Sort categories by name for the dropdown
	const sortedCategories = budgetCategories
		? [...budgetCategories].sort((a, b) => a.name.localeCompare(b.name))
		: [];

	return (
		<div className="flex flex-col items-center p-0 sm:p-6 md:p-10 h-screen">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileUpload}
				accept=".csv"
				className="hidden"
			/>
			<Button
				className="ml-auto"
				onClick={handleButtonClick}
				disabled={isLoading}
			>
				{isLoading ? "Parsing..." : "Upload CSV File"}
			</Button>

			{fileName && (
				<div className="mt-4 text-sm text-gray-600">Uploaded: {fileName}</div>
			)}

			{transactions && transactions.length > 0 && (
				<div className="mt-6 w-full max-w-6xl">
					<h2 className="text-xl font-semibold mb-4">
						Transactions ({transactions.length} total)
					</h2>
					<div className="overflow-auto border rounded-lg">
						<table className="w-full">
							<thead className="bg-gray-100 sticky top-0">
								<tr>
									<th className="text-left p-3 border-b">Date</th>
									<th className="text-left p-3 border-b">Description</th>
									<th className="text-left p-3 border-b">Category</th>
									<th className="text-right p-3 border-b">Amount</th>
								</tr>
							</thead>
							<tbody>
								{transactions
									.sort((a, b) => a.date - b.date)
									.map((transaction) => {
										const isExpanded = expandedTransactionId === transaction.id;
										const hasSplits =
											transaction.splits && transaction.splits.length > 0;
										const splitsTotal = hasSplits
											? getSplitTotal(transaction.splits)
											: 0;
										const transactionTotal = Math.abs(transaction.amount);
										const isBalanced = hasSplits
											? Math.abs(splitsTotal - transactionTotal) < 0.01
											: true;

										return (
											<>
												<tr
													key={transaction.id}
													className="border-b hover:bg-gray-50"
												>
													<td className="p-3 whitespace-nowrap">
														{new Date(transaction.date).getMonth() + 1}/
														{new Date(transaction.date).getDate()}
														{new Date(transaction.date).getUTCFullYear() ===
														new Date().getUTCFullYear()
															? ""
															: `/${new Date(transaction.date).getUTCFullYear()}`}
													</td>
													<td className="p-3 text-xs text-gray-600 whitespace-pre-line">
														{transaction.description.replaceAll("<br />", "\n")}
													</td>
													<td className="p-3">
														<div className="flex items-center gap-2">
															<Button
																variant="ghost"
																size="sm"
																className="h-6 w-6 p-0"
																onClick={() => toggleSplit(transaction.id)}
															>
																<Split className="h-4 w-4 rotate-90" />
															</Button>
															{!hasSplits ? (
																<Select
																	value={
																		transaction.categoryId || "uncategorized"
																	}
																	onValueChange={(value) =>
																		handleCategoryChange(transaction.id, value)
																	}
																>
																	<SelectTrigger className="w-[200px]">
																		<SelectValue placeholder="Select category">
																			{(() => {
																				if (
																					!transaction.categoryId ||
																					transaction.categoryId ===
																						"uncategorized"
																				) {
																					return "Uncategorized";
																				}
																				const cat = sortedCategories.find(
																					(c) =>
																						c.id === transaction.categoryId,
																				);
																				if (!cat) return "Uncategorized";
																				return (
																					<div className="flex items-center gap-2">
																						<CategoryIcon
																							icon={cat.icon}
																							color={cat.color}
																							size={16}
																						/>
																						<span>{cat.name}</span>
																					</div>
																				);
																			})()}
																		</SelectValue>
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem
																			value="uncategorized"
																			className="text-gray-500"
																		>
																			Uncategorized
																		</SelectItem>
																		{sortedCategories.map((cat) => (
																			<SelectItem key={cat.id} value={cat.id}>
																				<div className="flex items-center gap-2">
																					<CategoryIcon
																						icon={cat.icon}
																						color={cat.color}
																						size={16}
																					/>
																					<span>{cat.name}</span>
																				</div>
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															) : (
																<span
																	className={`text-sm ${
																		isBalanced
																			? "text-gray-500"
																			: "text-red-600"
																	}`}
																>
																	Split ({transaction.splits?.length ?? 0}{" "}
																	categories)
																</span>
															)}
														</div>
													</td>
													<td className="p-3 text-right whitespace-nowrap">
														{transaction.amount < 0 && "-"}$
														{Math.abs(transaction.amount).toFixed(2)}
													</td>
												</tr>
												{isExpanded && hasSplits && transaction.splits && (
													<tr key={`${transaction.id}-splits`}>
														<td colSpan={5} className="p-4 bg-gray-50">
															<div className="space-y-3">
																<div className="flex items-center justify-between mb-2">
																	<h4 className="font-semibold text-sm">
																		Split Transaction
																	</h4>
																	<div
																		className={`text-sm ${
																			isBalanced
																				? "text-green-600"
																				: "text-red-600"
																		}`}
																	>
																		Total: ${splitsTotal.toFixed(2)} / $
																		{transactionTotal.toFixed(2)}
																	</div>
																</div>
																{transaction.splits.map((split, index) => (
																	<div
																		key={`split-${transaction.id}-${index}`}
																		className="flex items-center gap-3"
																	>
																		<div className="flex-1">
																			<Select
																				value={
																					split.categoryId || "uncategorized"
																				}
																				onValueChange={(value) =>
																					updateSplitCategory(
																						transaction.id,
																						index,
																						value,
																					)
																				}
																			>
																				<SelectTrigger className="w-full">
																					<SelectValue placeholder="Select category">
																						{(() => {
																							if (
																								!split.categoryId ||
																								split.categoryId ===
																									"uncategorized"
																							) {
																								return "Uncategorized";
																							}
																							const cat = sortedCategories.find(
																								(c) =>
																									c.id === split.categoryId,
																							);
																							if (!cat) return "Uncategorized";
																							return (
																								<div className="flex items-center gap-2">
																									<CategoryIcon
																										icon={cat.icon}
																										color={cat.color}
																										size={16}
																									/>
																									<span>{cat.name}</span>
																								</div>
																							);
																						})()}
																					</SelectValue>
																				</SelectTrigger>
																				<SelectContent>
																					<SelectItem
																						value="uncategorized"
																						className="text-gray-500"
																					>
																						Uncategorized
																					</SelectItem>
																					{sortedCategories.map((cat) => (
																						<SelectItem
																							key={cat.id}
																							value={cat.id}
																						>
																							<div className="flex items-center gap-2">
																								<CategoryIcon
																									icon={cat.icon}
																									color={cat.color}
																									size={16}
																								/>
																								<span>{cat.name}</span>
																							</div>
																						</SelectItem>
																					))}
																				</SelectContent>
																			</Select>
																		</div>
																		<div className="w-32">
																			<Input
																				type="number"
																				step="0.01"
																				min="0"
																				value={split.amount}
																				onChange={(e) =>
																					updateSplitAmount(
																						transaction.id,
																						index,
																						Number.parseFloat(e.target.value) ||
																							0,
																					)
																				}
																				className="text-right"
																			/>
																		</div>
																		{transaction.splits &&
																			transaction.splits.length > 2 && (
																				<Button
																					variant="ghost"
																					size="sm"
																					className="h-8 w-8 p-0"
																					onClick={() =>
																						removeSplit(transaction.id, index)
																					}
																				>
																					<X className="h-4 w-4" />
																				</Button>
																			)}
																	</div>
																))}
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => addSplit(transaction.id)}
																	className="w-full"
																>
																	<Plus className="h-4 w-4 mr-2" />
																	Add Split
																</Button>
															</div>
														</td>
													</tr>
												)}
											</>
										);
									})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
