import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	accountsCollection,
	budgetCategoriesCollection,
	budgetSettingsCollection,
} from "@/db-collections/index";
import { initializeDefaults } from "@/lib/initialization";

export const Route = createFileRoute("/app/refresh")({
	component: RouteComponent,
});

function RouteComponent() {
	const [isInitializing, setIsInitializing] = useState(false);
	const [result, setResult] = useState<{
		cashAccountCreated: boolean;
		categoriesCreated: boolean;
		settingsCreated: boolean;
		incomeCategoryCreated: boolean;
	} | null>(null);

	// Query accounts from the database
	const { data: accounts } = useLiveQuery((q) =>
		q.from({ account: accountsCollection }).select(({ account }) => ({
			...account,
		})),
	);

	// Query budget settings from the database
	const { data: budgetSettings } = useLiveQuery((q) =>
		q.from({ settings: budgetSettingsCollection }).select(({ settings }) => ({
			...settings,
		})),
	);

	// Query budget categories from the database
	const { data: budgetCategories } = useLiveQuery((q) =>
		q.from({ category: budgetCategoriesCollection }).select(({ category }) => ({
			...category,
		})),
	);

	const handleInitialize = async () => {
		setIsInitializing(true);
		setResult(null);

		try {
			const initResult = await initializeDefaults(
				accounts,
				budgetSettings,
				budgetCategories,
			);
			setResult(initResult);
		} catch (error) {
			console.error("Initialization error:", error);
			alert("Error during initialization. Check console for details.");
		} finally {
			setIsInitializing(false);
		}
	};

	return (
		<div className="flex flex-col p-10 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-8">Initialize Defaults</h1>

			<div className="mb-8 p-6 bg-white border rounded-lg shadow-sm">
				<p className="text-gray-600 mb-4">
					This page initializes default data for the app:
				</p>
				<ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">
					<li>Default Cash account (if it doesn't exist)</li>
					<li>Default budget categories (if none exist)</li>
					<li>Default budget settings (if none exist)</li>
				</ul>

				<Button
					onClick={handleInitialize}
					disabled={isInitializing}
					className="w-full sm:w-auto"
				>
					{isInitializing ? "Initializing..." : "Initialize Defaults"}
				</Button>
			</div>

			{result && (
				<div className="mb-8 p-6 bg-gray-50 border rounded-lg">
					<h2 className="text-xl font-semibold mb-4">Initialization Result</h2>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="font-medium">Cash Account:</span>
							<span
								className={
									result.cashAccountCreated ? "text-green-600" : "text-gray-500"
								}
							>
								{result.cashAccountCreated ? "Created" : "Already exists"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">Budget Categories:</span>
							<span
								className={
									result.categoriesCreated ? "text-green-600" : "text-gray-500"
								}
							>
								{result.categoriesCreated ? "Created" : "Already exist"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">Budget Settings:</span>
							<span
								className={
									result.settingsCreated ? "text-green-600" : "text-gray-500"
								}
							>
								{result.settingsCreated ? "Created" : "Already exist"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">Income Category:</span>
							<span
								className={
									result.incomeCategoryCreated
										? "text-green-600"
										: "text-gray-500"
								}
							>
								{result.incomeCategoryCreated ? "Created" : "Already exist"}
							</span>
						</div>
					</div>
				</div>
			)}

			<div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
				<h2 className="text-lg font-semibold mb-2">Current State</h2>
				<div className="space-y-1 text-sm text-gray-700">
					<div>Accounts: {accounts?.length ?? 0}</div>
					<div>Budget Categories: {budgetCategories?.length ?? 0}</div>
					<div>Budget Settings: {budgetSettings?.length ?? 0}</div>
					<div>Income Category: {budgetCategories?.length ?? 0}</div>
				</div>
			</div>
		</div>
	);
}
