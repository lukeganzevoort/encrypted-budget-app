import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type BudgetCategory,
	type BudgetSettings,
	budgetCategoriesCollection,
	budgetSettingsCollection,
} from "@/db-collections/index";
import { generateHash } from "@/lib/utils";

export const Route = createFileRoute("/app/budget")({
	component: RouteComponent,
});

const BUDGET_SETTINGS_ID = "default-budget-settings";

const DEFAULT_INCOME = 5000;
const DEFAULT_CATEGORIES = [
	{ name: "Giving", amount: 500 },
	{ name: "Saving", amount: 750 },
	{ name: "Groceries", amount: 500 },
	{ name: "Mortgage", amount: 1500 },
	{ name: "Bills", amount: 1000 },
	{ name: "Transportation", amount: 400 },
	{ name: "Spending", amount: 350 },
];

function RouteComponent() {
	const monthlyIncomeId = useId();
	const [monthlyIncome, setMonthlyIncome] = useState<string>("");
	const [newCategoryName, setNewCategoryName] = useState<string>("");
	const [newCategoryAmount, setNewCategoryAmount] = useState<string>("");
	const [categories, setCategories] = useState<BudgetCategory[]>([]);
	const [isInitialized, setIsInitialized] = useState(false);

	// Query budget settings from the database
	const { data: budgetSettingsData } = useLiveQuery((q) =>
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

	// Initialize default data if none exists
	useEffect(() => {
		const initializeDefaults = async () => {
			if (isInitialized) return;

			// Check if we need to initialize
			const hasSettings = budgetSettingsData && budgetSettingsData.length > 0;
			const hasCategories = budgetCategories && budgetCategories.length > 0;

			if (!hasSettings && !hasCategories) {
				// Initialize default income
				const settings: BudgetSettings = {
					id: BUDGET_SETTINGS_ID,
					monthlyIncome: DEFAULT_INCOME,
				};
				budgetSettingsCollection.insert(settings);

				// Initialize default categories
				for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
					const defaultCat = DEFAULT_CATEGORIES[i];
					const id = await generateHash(
						`${defaultCat.name}-${Date.now()}-${i}`,
					);
					const category: BudgetCategory = {
						id,
						name: defaultCat.name,
						budgetedAmount: defaultCat.amount,
						order: i,
					};
					budgetCategoriesCollection.insert(category);
				}

				setIsInitialized(true);
			} else {
				setIsInitialized(true);
			}
		};

		initializeDefaults();
	}, [budgetSettingsData, budgetCategories, isInitialized]);

	// Initialize income from database
	useEffect(() => {
		if (budgetSettingsData && budgetSettingsData.length > 0) {
			setMonthlyIncome(budgetSettingsData[0].monthlyIncome.toString());
		}
	}, [budgetSettingsData]);

	// Update local categories state when database changes
	useEffect(() => {
		if (budgetCategories) {
			setCategories(budgetCategories);
		}
	}, [budgetCategories]);

	const handleSaveIncome = () => {
		const income = Number.parseFloat(monthlyIncome);
		if (Number.isNaN(income) || income < 0) {
			alert("Please enter a valid income amount");
			return;
		}

		const settings: BudgetSettings = {
			id: BUDGET_SETTINGS_ID,
			monthlyIncome: income,
		};

		budgetSettingsCollection.insert(settings);
	};

	const handleAddCategory = async () => {
		const amount = Number.parseFloat(newCategoryAmount);
		if (!newCategoryName.trim()) {
			alert("Please enter a category name");
			return;
		}
		if (Number.isNaN(amount) || amount < 0) {
			alert("Please enter a valid budget amount");
			return;
		}

		const id = await generateHash(
			`${newCategoryName}-${Date.now()}-${Math.random()}`,
		);
		const order = categories.length;

		const category: BudgetCategory = {
			id,
			name: newCategoryName,
			budgetedAmount: amount,
			order,
		};

		budgetCategoriesCollection.insert(category);
		setNewCategoryName("");
		setNewCategoryAmount("");
	};

	const handleDeleteCategory = (categoryId: string) => {
		budgetCategoriesCollection.delete(categoryId);
	};

	const handleUpdateCategory = (categoryId: string, newAmount: string) => {
		const amount = Number.parseFloat(newAmount);
		if (Number.isNaN(amount) || amount < 0) {
			return;
		}

		budgetCategoriesCollection.update(categoryId, (item) => {
			item.budgetedAmount = amount;
		});
	};

	// Calculate totals
	const currentIncome = budgetSettingsData?.[0]?.monthlyIncome || 0;
	const totalBudgeted = categories.reduce(
		(sum, cat) => sum + cat.budgetedAmount,
		0,
	);
	const remainingBalance = currentIncome - totalBudgeted;

	// Sort categories by order
	const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

	return (
		<div className="flex flex-col p-10 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-8">Budget</h1>

			{/* Monthly Income Section */}
			<div className="mb-8 p-6 bg-white border rounded-lg shadow-sm">
				<h2 className="text-xl font-semibold mb-4">Monthly Income</h2>
				<div className="flex gap-4 items-end">
					<div className="flex-1">
						<Label htmlFor={monthlyIncomeId}>Income Amount</Label>
						<Input
							id={monthlyIncomeId}
							type="number"
							placeholder="Enter monthly income"
							value={monthlyIncome}
							onChange={(e) => setMonthlyIncome(e.target.value)}
							onBlur={handleSaveIncome}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSaveIncome();
								}
							}}
							className="mt-1"
						/>
					</div>
					<Button onClick={handleSaveIncome}>Save Income</Button>
				</div>
			</div>

			{/* Budget Summary */}
			<div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
				<div className="grid grid-cols-3 gap-4">
					<div>
						<div className="text-sm text-gray-600 mb-1">Monthly Income</div>
						<div className="text-2xl font-bold text-gray-900">
							${currentIncome.toFixed(2)}
						</div>
					</div>
					<div>
						<div className="text-sm text-gray-600 mb-1">Total Budgeted</div>
						<div className="text-2xl font-bold text-gray-900">
							${totalBudgeted.toFixed(2)}
						</div>
					</div>
					<div>
						<div className="text-sm text-gray-600 mb-1">Available Balance</div>
						<div
							className={`text-2xl font-bold ${
								remainingBalance >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							${remainingBalance.toFixed(2)}
						</div>
					</div>
				</div>
			</div>

			{/* Budget Categories Section */}
			<div className="mb-8 p-6 bg-white border rounded-lg shadow-sm">
				<h2 className="text-xl font-semibold mb-4">Budget Categories</h2>

				{/* Add New Category */}
				<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<h3 className="text-sm font-medium mb-3 text-gray-700">
						Add New Category
					</h3>
					<div className="flex gap-3">
						<div className="flex-1">
							<Input
								type="text"
								placeholder="Category name (e.g., Groceries)"
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddCategory();
									}
								}}
							/>
						</div>
						<div className="w-40">
							<Input
								type="number"
								placeholder="Amount"
								value={newCategoryAmount}
								onChange={(e) => setNewCategoryAmount(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddCategory();
									}
								}}
							/>
						</div>
						<Button
							onClick={handleAddCategory}
							className="flex items-center gap-2"
						>
							<Plus size={16} />
							Add
						</Button>
					</div>
				</div>

				{/* Categories List */}
				{sortedCategories.length > 0 ? (
					<div className="space-y-2">
						{sortedCategories.map((category) => (
							<div
								key={category.id}
								className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
							>
								<div className="flex-1">
									<div className="font-medium text-gray-900">
										{category.name}
									</div>
								</div>
								<div className="w-40">
									<Input
										type="number"
										value={category.budgetedAmount}
										onChange={(e) =>
											handleUpdateCategory(category.id, e.target.value)
										}
										className="text-right"
									/>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleDeleteCategory(category.id)}
									className="flex items-center gap-1 hover:text-red-500"
								>
									<Trash2 size={16} />
								</Button>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">
						No categories yet. Add your first category above!
					</div>
				)}
			</div>
		</div>
	);
}
