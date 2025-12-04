import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	type Transaction,
	transactionsCollection,
} from "@/db-collections/index";

export const Route = createFileRoute("/app/")({
	component: RouteComponent,
});

type CsvRow = Record<string, string>;

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

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setFileName(file.name);
		setIsLoading(true);

		Papa.parse<CsvRow>(file, {
			transformHeader(header) {
				if (/\bamount\b/i.test(header)) {
					return "amount";
				}
				if (/\bdate\b/i.test(header)) {
					return "date";
				}
				if (/\bdescription\b/i.test(header)) {
					return "description";
				}
				return header;
			},
			complete: (results) => {
				console.log("Parsed CSV data:", results.data);

				// Insert parsed data into transactions collection
				for (const row of results.data) {
					const date = row.date || row.Date || "";
					const description = row.description || row.Description || "";
					const amount = Number.parseFloat(
						(row.amount || row.Amount || "0")
							.replace("$", "")
							.replace(",", "")
							.replace("(", "-")
							.replace(")", ""),
					);

					// Create a unique ID based on transaction data
					// TODO: use a better hash function
					const uniqueId = `${date}-${description}-${amount}`;

					const transaction: Transaction = {
						id: uniqueId,
						date,
						description,
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

	return (
		<div className="flex flex-col items-center p-10 h-screen">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileUpload}
				accept=".csv"
				className="hidden"
			/>
			<Button onClick={handleButtonClick} disabled={isLoading}>
				{isLoading ? "Parsing..." : "Upload CSV File"}
			</Button>

			{fileName && (
				<div className="mt-4 text-sm text-gray-600">Uploaded: {fileName}</div>
			)}

			{transactions && transactions.length > 0 && (
				<div className="mt-6 w-full max-w-4xl">
					<h2 className="text-xl font-semibold mb-4">
						Transactions ({transactions.length} total)
					</h2>
					<div className="overflow-auto max-h-96 border rounded-lg">
						<table className="w-full">
							<thead className="bg-gray-100 sticky top-0">
								<tr>
									<th className="text-left p-3 border-b">Date</th>
									<th className="text-left p-3 border-b">Description</th>
									<th className="text-right p-3 border-b">Amount</th>
								</tr>
							</thead>
							<tbody>
								{transactions.map((transaction) => (
									<tr
										key={transaction.id}
										className="border-b hover:bg-gray-50"
									>
										<td className="p-3">{transaction.date}</td>
										<td className="p-3">{transaction.description}</td>
										<td className="p-3 text-right">
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
