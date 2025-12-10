import {
	and,
	gt,
	gte,
	isUndefined,
	lte,
	or,
	useLiveQuery,
} from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { IconColorPicker } from "@/components/IconColorPicker";
import { MonthYearSelector } from "@/components/MonthYearSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type BudgetCategory,
	budgetCategoriesCollection,
	getBudgetedAmountForMonth,
	type IncomeCategory,
	incomeCategoriesCollection,
	isCategoryActiveForMonth,
} from "@/db-collections/index";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/category-icons";
import { getPreviousMonth } from "@/lib/utils";

export const Route = createFileRoute("/app/budget")({
	component: RouteComponent,
});

function RouteComponent() {
	const monthlyIncomeId = useId();
	const [monthlyIncome, setMonthlyIncome] = useState<string>("");
	const [newCategoryName, setNewCategoryName] = useState<string>("");
	const [newCategoryAmount, setNewCategoryAmount] = useState<string>("");
	const [newCategoryIcon, setNewCategoryIcon] = useState<string>(DEFAULT_ICON);
	const [newCategoryColor, setNewCategoryColor] =
		useState<string>(DEFAULT_COLOR);
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
		null,
	);
	const [editingCategoryName, setEditingCategoryName] = useState<string>("");

	// Get current year and month
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

	// State for selected year and month, defaulting to current
	const [selectedYear, setSelectedYear] = useState<string>(
		currentYear.toString(),
	);
	const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

	// Combine year and month for query (format: "YYYY-MM")
	const selectedMonthKey = `${selectedYear}-${selectedMonth}`;

	const { data: categories } = useLiveQuery(
		(q) =>
			q
				.from({ category: budgetCategoriesCollection })
				.where(({ category }) =>
					and(
						lte(category.startMonth, selectedMonthKey),
						or(
							isUndefined(category.endMonth),
							gte(category.endMonth, selectedMonthKey),
						),
					),
				)
				.select(({ category }) => ({
					...category,
				})),
		[selectedYear, selectedMonth],
	);

	const { data: incomeCategory } = useLiveQuery(
		(q) =>
			q
				.from({ category: incomeCategoriesCollection })
				.orderBy(({ category }) => category.startMonth, "desc")
				.where(({ category }) => lte(category.startMonth, selectedMonthKey))
				.findOne(),
		[selectedYear, selectedMonth],
	);

	// Initialize income from Income category
	useEffect(() => {
		if (incomeCategory) {
			setMonthlyIncome(incomeCategory.budgetedAmount.toString());
		} else {
			setMonthlyIncome("");
		}
	}, [incomeCategory]);

	const handleSaveIncome = async () => {
		const income = Number.parseFloat(monthlyIncome);
		if (Number.isNaN(income) || income < 0) {
			alert("Please enter a valid income amount");
			return;
		}

		if (incomeCategory && incomeCategory.startMonth === selectedMonthKey) {
			// Update existing Income category
			incomeCategoriesCollection.update(incomeCategory.id, (item) => {
				item.budgetedAmount = income;
			});
		} else {
			// Create Income category if it doesn't exist
			const newIncomeCategory: IncomeCategory = {
				id: crypto.randomUUID(),
				budgetedAmount: income,
				startMonth: selectedMonthKey,
			};
			incomeCategoriesCollection.insert(newIncomeCategory);
		}
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

		const category: BudgetCategory = {
			id: crypto.randomUUID(),
			name: newCategoryName,
			order: (categories.length + 1) * 100,
			icon: newCategoryIcon,
			color: newCategoryColor,
			startMonth: selectedMonthKey,
			monthlyBudgets: [
				{
					budgetedAmount: amount,
					startMonth: selectedMonthKey,
				},
			],
		};

		budgetCategoriesCollection.insert(category);
		setNewCategoryName("");
		setNewCategoryAmount("");
		setNewCategoryIcon(DEFAULT_ICON);
		setNewCategoryColor(DEFAULT_COLOR);
	};

	const handleDeleteCategory = (
		category: Pick<BudgetCategory, "id" | "monthlyBudgets" | "startMonth">,
	) => {
		if (category.startMonth === selectedMonthKey) {
			budgetCategoriesCollection.delete(category.id);
		} else {
			budgetCategoriesCollection.update(category.id, (item) => {
				item.endMonth = getPreviousMonth(selectedMonthKey);
				item.monthlyBudgets = item.monthlyBudgets.filter(
					(mb) => mb.startMonth < selectedMonthKey,
				);
			});
		}
	};

	const handleUpdateCategory = async (
		categoryId: string,
		newAmount: string,
	) => {
		const amount = Number.parseFloat(newAmount);
		if (Number.isNaN(amount) || amount < 0) {
			return;
		}

		const category = categories.find((cat) => cat.id === categoryId);
		if (!category) {
			return;
		}

		// Find or create monthly budget entry for this month
		budgetCategoriesCollection.update(categoryId, (item) => {
			const existingIndex = item.monthlyBudgets.findIndex(
				(mb) => mb.startMonth === selectedMonthKey,
			);
			if (existingIndex >= 0) {
				// Update existing entry
				item.monthlyBudgets[existingIndex].budgetedAmount = amount;
			} else {
				// Add new entry for this month
				item.monthlyBudgets.push({
					budgetedAmount: amount,
					startMonth: selectedMonthKey,
				});
				// Sort by startMonth to keep them in order
				item.monthlyBudgets.sort((a, b) =>
					a.startMonth.localeCompare(b.startMonth),
				);
			}
		});
	};

	const handleUpdateIcon = async (categoryId: string, icon: string) => {
		// Icon is shared across all months, so update directly
		budgetCategoriesCollection.update(categoryId, (item) => {
			item.icon = icon;
		});
	};

	const handleUpdateColor = async (categoryId: string, color: string) => {
		// Color is shared across all months, so update directly
		budgetCategoriesCollection.update(categoryId, (item) => {
			item.color = color;
		});
	};

	const handleStartEditingName = (categoryId: string, currentName: string) => {
		setEditingCategoryId(categoryId);
		setEditingCategoryName(currentName);
	};

	const handleSaveCategoryName = async (categoryId: string) => {
		if (!editingCategoryName.trim()) {
			alert("Category name cannot be empty");
			return;
		}

		// Name is shared across all months, so update directly
		budgetCategoriesCollection.update(categoryId, (item) => {
			item.name = editingCategoryName.trim();
		});

		setEditingCategoryId(null);
		setEditingCategoryName("");
	};

	const handleCancelEditingName = () => {
		setEditingCategoryId(null);
		setEditingCategoryName("");
	};

	// Calculate totals
	const currentIncome = incomeCategory?.budgetedAmount || 0;
	// Exclude Income category from total budgeted (only count expenses)
	const totalBudgeted = categories.reduce(
		(sum, cat) => sum + getBudgetedAmountForMonth(cat, selectedMonthKey),
		0,
	);
	const remainingBalance = currentIncome - totalBudgeted;

	// Sort categories by order
	const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

	return (
		<div className="flex flex-col p-10 max-w-4xl mx-auto">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Budget</h1>
				<MonthYearSelector
					selectedYear={selectedYear}
					selectedMonth={selectedMonth}
					onYearChange={setSelectedYear}
					onMonthChange={setSelectedMonth}
				/>
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

				{/* Monthly Income Section */}
				<div className="mb-6 pb-6 border-b">
					<h3 className="text-lg font-medium mb-3">Monthly Income</h3>
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

				{/* Categories List */}
				{sortedCategories.length > 0 ? (
					<div className="space-y-2 mb-6">
						{sortedCategories.map((category) => {
							return (
								<div
									key={category.id}
									className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
								>
									<IconColorPicker
										icon={category.icon || DEFAULT_ICON}
										color={category.color || DEFAULT_COLOR}
										onIconChange={(icon) => handleUpdateIcon(category.id, icon)}
										onColorChange={(color) =>
											handleUpdateColor(category.id, color)
										}
										open={openPopoverId === category.id}
										onOpenChange={(open) =>
											setOpenPopoverId(open ? category.id : null)
										}
										triggerClassName="h-12 w-12 p-0 m-0 rounded-full hover:bg-gray-200"
									/>
									<div className="flex-1">
										{editingCategoryId === category.id ? (
											<Input
												type="text"
												value={editingCategoryName}
												onChange={(e) => setEditingCategoryName(e.target.value)}
												onBlur={() => handleSaveCategoryName(category.id)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														handleSaveCategoryName(category.id);
													} else if (e.key === "Escape") {
														handleCancelEditingName();
													}
												}}
												autoFocus
												className="font-medium"
											/>
										) : (
											<button
												type="button"
												className={`font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-left w-full`}
												onClick={() =>
													handleStartEditingName(category.id, category.name)
												}
											>
												{category.name}
											</button>
										)}
									</div>
									<div className="w-40">
										<Input
											type="number"
											value={getBudgetedAmountForMonth(
												category,
												selectedMonthKey,
											)}
											onChange={(e) =>
												handleUpdateCategory(category.id, e.target.value)
											}
											className="text-right"
										/>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDeleteCategory(category)}
										className="flex items-center gap-1 hover:text-red-500"
									>
										<Trash2 size={16} />
									</Button>
								</div>
							);
						})}
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">
						No categories yet. Add your first category below!
					</div>
				)}

				{/* Add New Category */}
				<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
					<h3 className="text-sm font-medium mb-3 text-gray-700">
						Add New Category
					</h3>
					<div className="flex gap-3">
						<IconColorPicker
							icon={newCategoryIcon}
							color={newCategoryColor}
							onIconChange={setNewCategoryIcon}
							onColorChange={setNewCategoryColor}
							open={openPopoverId === "new"}
							onOpenChange={(open) => setOpenPopoverId(open ? "new" : null)}
							triggerClassName="h-12 w-12 p-0 rounded-full"
						/>
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
			</div>
		</div>
	);
}
