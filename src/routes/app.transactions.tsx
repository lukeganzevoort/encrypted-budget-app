import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
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
		});
	};

	// Sort categories by name for the dropdown
	const sortedCategories = budgetCategories
		? [...budgetCategories].sort((a, b) => a.name.localeCompare(b.name))
		: [];

	return (
		<div className="flex flex-col items-center p-10 h-screen">
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
									.map((transaction) => (
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
												<Select
													value={transaction.categoryId || "uncategorized"}
													onValueChange={(value) =>
														handleCategoryChange(transaction.id, value)
													}
												>
													<SelectTrigger className="w-[200px]">
														<SelectValue placeholder="Select category">
															{(() => {
																if (
																	!transaction.categoryId ||
																	transaction.categoryId === "uncategorized"
																) {
																	return "Uncategorized";
																}
																const cat = sortedCategories.find(
																	(c) => c.id === transaction.categoryId,
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
											</td>
											<td className="p-3 text-right whitespace-nowrap">
												{transaction.amount < 0 && "-"}$
												{Math.abs(transaction.amount).toFixed(2)}
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
