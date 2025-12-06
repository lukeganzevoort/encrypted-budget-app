import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Link as LinkIcon, Plus, Search, Split, Unlink, X } from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
	const [linkSearchQuery, setLinkSearchQuery] = useState<string>("");
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

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

	const linkTransactions = (
		sourceTransactionId: string,
		targetTransactionId: string,
	) => {
		console.log(
			"Grouping transactions:",
			sourceTransactionId,
			targetTransactionId,
		);

		const sourceTransaction = transactions?.find(
			(t) => t.id === sourceTransactionId,
		);
		const targetTransaction = transactions?.find(
			(t) => t.id === targetTransactionId,
		);

		if (!sourceTransaction || !targetTransaction) return;

		// Use existing group ID from source or target, or create a new one
		const groupId =
			sourceTransaction.groupId ||
			targetTransaction.groupId ||
			crypto.randomUUID();

		// Add both transactions to the group
		transactionsCollection.update(sourceTransactionId, (item) => {
			item.groupId = groupId;
		});

		transactionsCollection.update(targetTransactionId, (item) => {
			item.groupId = groupId;
		});

		// Close popover and reset search
		setOpenPopoverId(null);
		setLinkSearchQuery("");
	};

	const unlinkTransaction = (transactionId: string) => {
		// Remove transaction from its group
		transactionsCollection.update(transactionId, (item) => {
			item.groupId = undefined;
		});
	};

	const getGroupedTransactions = (groupId: string | undefined) => {
		if (!groupId || !transactions) return [];
		return transactions.filter(
			(t) => t.groupId === groupId && t.id !== undefined,
		);
	};

	const getFilteredTransactions = (currentTransactionId: string) => {
		if (!transactions) return [];

		const currentTransaction = transactions.find(
			(tx) => tx.id === currentTransactionId,
		);
		const query = linkSearchQuery.toLowerCase();

		return transactions.filter((t) => {
			// Don't show the current transaction
			if (t.id === currentTransactionId) return false;

			// Don't show transactions already in the same group
			if (
				currentTransaction?.groupId &&
				t.groupId === currentTransaction.groupId
			) {
				return false;
			}

			// Filter by search query
			if (query) {
				return (
					t.description.toLowerCase().includes(query) ||
					t.amount.toString().includes(query) ||
					new Date(t.date).toLocaleDateString().includes(query)
				);
			}
			return true;
		});
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
									<th className="text-center p-3 border-b">Actions</th>
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
										const isGrouped = !!transaction.groupId;
										const groupedTransactions = isGrouped
											? getGroupedTransactions(transaction.groupId).filter(
													(t) => t.id !== transaction.id,
												)
											: [];

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
																<button
																	type="button"
																	className={`text-sm ${
																		isBalanced
																			? "text-gray-500"
																			: "text-red-600"
																	} hover:underline hover:opacity-80 focus:outline-none`}
																	onClick={() => toggleSplit(transaction.id)}
																	onKeyDown={(e) => {
																		if (e.key === "Enter" || e.key === " ") {
																			e.preventDefault();
																			toggleSplit(transaction.id);
																		}
																	}}
																	tabIndex={0}
																	aria-pressed="false"
																>
																	Split ({transaction.splits?.length ?? 0}{" "}
																	categories)
																</button>
															)}
														</div>
													</td>
													<td className="p-3 text-right whitespace-nowrap">
														{transaction.amount < 0 && "-"}$
														{Math.abs(transaction.amount).toFixed(2)}
													</td>
													<td className="p-3 text-center">
														<div className="flex items-center justify-center gap-2">
															<Popover
																open={openPopoverId === transaction.id}
																onOpenChange={(open) => {
																	setOpenPopoverId(
																		open ? transaction.id : null,
																	);
																	if (!open) setLinkSearchQuery("");
																}}
															>
																<PopoverTrigger asChild>
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-8 w-8 p-0"
																		title="Group with another transaction"
																	>
																		<LinkIcon className="h-4 w-4" />
																	</Button>
																</PopoverTrigger>
																<PopoverContent
																	className="w-96 p-0"
																	align="end"
																>
																	<div className="flex flex-col max-h-[400px]">
																		<div className="p-3 border-b sticky top-0 bg-white">
																			<h4 className="font-semibold text-sm mb-2">
																				Group Transaction
																			</h4>
																			<div className="relative">
																				<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
																				<Input
																					placeholder="Search transactions..."
																					value={linkSearchQuery}
																					onChange={(e) =>
																						setLinkSearchQuery(e.target.value)
																					}
																					className="pl-8"
																				/>
																			</div>
																		</div>
																		<div className="overflow-y-auto flex-1">
																			{getFilteredTransactions(transaction.id)
																				.slice(0, 50)
																				.map((t) => (
																					<button
																						key={t.id}
																						type="button"
																						onClick={() =>
																							linkTransactions(
																								transaction.id,
																								t.id,
																							)
																						}
																						className="w-full p-3 hover:bg-gray-50 text-left border-b last:border-b-0 transition-colors"
																					>
																						<div className="flex items-start justify-between gap-2">
																							<div className="flex-1 min-w-0">
																								<div className="text-xs text-gray-500 mb-1">
																									{new Date(t.date).getMonth() +
																										1}
																									/{new Date(t.date).getDate()}/
																									{new Date(
																										t.date,
																									).getUTCFullYear()}
																								</div>
																								<div className="text-sm text-gray-900 truncate">
																									{t.description}
																								</div>
																							</div>
																							<div className="text-sm font-medium whitespace-nowrap">
																								{t.amount < 0 && "-"}$
																								{Math.abs(t.amount).toFixed(2)}
																							</div>
																						</div>
																					</button>
																				))}
																			{getFilteredTransactions(transaction.id)
																				.length === 0 && (
																				<div className="p-8 text-center text-sm text-gray-500">
																					No transactions found
																				</div>
																			)}
																		</div>
																	</div>
																</PopoverContent>
															</Popover>
															{isGrouped && (
																<span
																	className="text-xs text-blue-600 font-medium"
																	title={`Grouped with ${groupedTransactions.length} transaction(s)`}
																>
																	({groupedTransactions.length + 1})
																</span>
															)}
														</div>
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
																				value={split.amount.toString()}
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
												{isGrouped && groupedTransactions.length > 0 && (
													<tr key={`${transaction.id}-group`}>
														<td colSpan={5} className="p-4 bg-blue-50">
															<div className="space-y-2">
																<h4 className="font-semibold text-sm mb-2">
																	Grouped Transactions
																</h4>
																{groupedTransactions.map(
																	(groupedTransaction) => (
																		<div
																			key={groupedTransaction.id}
																			className="flex items-center gap-3 bg-white p-2 rounded"
																		>
																			<div className="flex-1 grid grid-cols-3 gap-2">
																				<div className="text-xs">
																					{new Date(
																						groupedTransaction.date,
																					).getMonth() + 1}
																					/
																					{new Date(
																						groupedTransaction.date,
																					).getDate()}
																					/
																					{new Date(
																						groupedTransaction.date,
																					).getUTCFullYear()}
																				</div>
																				<div className="text-xs text-gray-600">
																					{groupedTransaction.description}
																				</div>
																				<div className="text-xs text-right">
																					{groupedTransaction.amount < 0 && "-"}
																					$
																					{Math.abs(
																						groupedTransaction.amount,
																					).toFixed(2)}
																				</div>
																			</div>
																			<Button
																				variant="ghost"
																				size="sm"
																				className="h-8 w-8 p-0"
																				onClick={() =>
																					unlinkTransaction(
																						groupedTransaction.id,
																					)
																				}
																				title="Remove from group"
																			>
																				<Unlink className="h-4 w-4" />
																			</Button>
																		</div>
																	),
																)}
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
