import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { IconColorPicker } from "@/components/IconColorPicker";
import { MonthYearSelector } from "@/components/MonthYearSelector";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type BudgetCategory,
	budgetCategoriesCollection,
} from "@/db-collections/index";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/category-icons";
import {
	DEFAULT_CATEGORIES,
	getIncomeCategoryIdForMonth,
} from "@/lib/initialization";
import { generateHash } from "@/lib/utils";

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
	const [categories, setCategories] = useState<BudgetCategory[]>([]);
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
		null,
	);
	const [editingCategoryName, setEditingCategoryName] = useState<string>("");
	const [showCopyDialog, setShowCopyDialog] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [copySource, setCopySource] = useState<
		"current" | "last" | "default" | null
	>(null);

	// Get current year and month
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
	const currentMonthKey = `${currentYear}-${currentMonth}`;

	// State for selected year and month, defaulting to current
	const [selectedYear, setSelectedYear] = useState<string>(
		currentYear.toString(),
	);
	const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

	// Combine year and month for query (format: "YYYY-MM")
	const selectedMonthKey = `${selectedYear}-${selectedMonth}`;

	// Query budget categories from the database, filtered by selected month
	const { data: budgetCategories } = useLiveQuery(
		(q) =>
			q
				.from({ category: budgetCategoriesCollection })
				.where(({ category }) => eq(category.month, selectedMonthKey))
				.select(({ category }) => ({
					...category,
				})),
		[selectedYear, selectedMonth],
	);

	// Query budget categories from current month
	const { data: currentMonthCategories } = useLiveQuery(
		(q) =>
			q
				.from({ category: budgetCategoriesCollection })
				.where(({ category }) => eq(category.month, currentMonthKey))
				.select(({ category }) => ({
					...category,
				})),
		[],
	);

	// Calculate last month key
	const getLastMonthKey = (): string => {
		const date = new Date(
			Number.parseInt(selectedYear),
			Number.parseInt(selectedMonth) - 1,
		);
		date.setMonth(date.getMonth() - 1);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		return `${year}-${month}`;
	};

	const lastMonthKey = getLastMonthKey();

	// Query budget categories from last month
	const { data: lastMonthCategories } = useLiveQuery(
		(q) =>
			q
				.from({ category: budgetCategoriesCollection })
				.where(({ category }) => eq(category.month, lastMonthKey))
				.select(({ category }) => ({
					...category,
				})),
		[selectedYear, selectedMonth],
	);

	// Get income category ID for current month
	const incomeCategoryId = getIncomeCategoryIdForMonth(selectedMonthKey);

	// Initialize income from Income category
	useEffect(() => {
		const incomeCategory = budgetCategories?.find(
			(category) => category.id === incomeCategoryId,
		);
		if (incomeCategory) {
			setMonthlyIncome(incomeCategory.budgetedAmount.toString());
		} else {
			setMonthlyIncome("");
		}
	}, [budgetCategories, incomeCategoryId]);

	// Update local categories state when database changes
	useEffect(() => {
		if (budgetCategories) {
			setCategories(budgetCategories);
		}
	}, [budgetCategories]);

	const handleSaveIncome = async () => {
		const income = Number.parseFloat(monthlyIncome);
		if (Number.isNaN(income) || income < 0) {
			alert("Please enter a valid income amount");
			return;
		}

		const incomeCategory = budgetCategories?.find(
			(category) => category.id === incomeCategoryId,
		);

		if (incomeCategory) {
			// Update existing Income category
			budgetCategoriesCollection.update(incomeCategoryId, (item) => {
				item.budgetedAmount = income;
			});
		} else {
			// Create Income category if it doesn't exist
			const newIncomeCategory: BudgetCategory = {
				id: incomeCategoryId,
				name: "Income",
				budgetedAmount: income,
				order: 0,
				icon: "DollarSign",
				color: "#10b981",
				month: selectedMonthKey,
			};
			budgetCategoriesCollection.insert(newIncomeCategory);
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

		const id = await generateHash(
			`${newCategoryName}-${Date.now()}-${Math.random()}`,
		);
		const order = categories.length;

		const category: BudgetCategory = {
			id,
			name: newCategoryName,
			budgetedAmount: amount,
			order,
			icon: newCategoryIcon,
			color: newCategoryColor,
			month: selectedMonthKey,
		};

		budgetCategoriesCollection.insert(category);
		setNewCategoryName("");
		setNewCategoryAmount("");
		setNewCategoryIcon(DEFAULT_ICON);
		setNewCategoryColor(DEFAULT_COLOR);
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

	const handleUpdateIcon = (categoryId: string, icon: string) => {
		budgetCategoriesCollection.update(categoryId, (item) => {
			item.icon = icon;
		});
	};

	const handleUpdateColor = (categoryId: string, color: string) => {
		budgetCategoriesCollection.update(categoryId, (item) => {
			item.color = color;
		});
	};

	const handleStartEditingName = (categoryId: string, currentName: string) => {
		setEditingCategoryId(categoryId);
		setEditingCategoryName(currentName);
	};

	const handleSaveCategoryName = (categoryId: string) => {
		if (!editingCategoryName.trim()) {
			alert("Category name cannot be empty");
			return;
		}

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

	// Check if there are existing categories (excluding income)
	const hasExistingCategories = () => {
		return categories.filter((cat) => cat.id !== incomeCategoryId).length > 0;
	};

	// Get available copy sources
	const getAvailableCopySources = () => {
		const sources: Array<{
			value: "current" | "last" | "default";
			label: string;
		}> = [];

		// Add current month option if selected month is not current month and there are categories
		if (selectedMonthKey !== currentMonthKey) {
			const currentMonthNonIncomeCategories =
				currentMonthCategories?.filter(
					(cat) => cat.id !== getIncomeCategoryIdForMonth(currentMonthKey),
				) ?? [];
			if (currentMonthNonIncomeCategories.length > 0) {
				sources.push({
					value: "current",
					label: `Default (${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })})`,
				});
			}
		}

		// Add last month option if there are categories for last month
		const lastMonthNonIncomeCategories =
			lastMonthCategories?.filter(
				(cat) => cat.id !== getIncomeCategoryIdForMonth(lastMonthKey),
			) ?? [];
		if (lastMonthNonIncomeCategories.length > 0) {
			sources.push({
				value: "last",
				label: `Last Month (${new Date(lastMonthKey).toLocaleDateString("en-US", { month: "long", year: "numeric" })})`,
			});
		}

		// Always add default categories option
		if (sources.length === 0) {
			sources.push({ value: "default", label: "Default Categories" });
		}

		return sources;
	};

	const handleCopyBudget = async (source: "current" | "last" | "default") => {
		// Check if there are existing categories
		if (hasExistingCategories()) {
			setCopySource(source);
			setShowConfirmDialog(true);
			setShowCopyDialog(false);
			return;
		}

		// Proceed with copy if no existing categories
		await performCopy(source);
		setShowCopyDialog(false);
	};

	const performCopy = async (source: "current" | "last" | "default") => {
		let categoriesToCopy: Omit<BudgetCategory, "id" | "month">[] = [];

		if (source === "current") {
			// Copy from current month (excluding income)
			categoriesToCopy =
				currentMonthCategories.map((cat) => ({
					name: cat.name,
					budgetedAmount: cat.budgetedAmount,
					order: cat.order,
					icon: cat.icon,
					color: cat.color,
				})) ?? [];
		} else if (source === "last") {
			// Copy from last month (excluding income)
			categoriesToCopy =
				lastMonthCategories.map((cat) => ({
					name: cat.name,
					budgetedAmount: cat.budgetedAmount,
					order: cat.order,
					icon: cat.icon,
					color: cat.color,
				})) ?? [];
		} else {
			// Copy from default categories
			categoriesToCopy = DEFAULT_CATEGORIES.map((cat, index) => ({
				name: cat.name,
				budgetedAmount: cat.amount,
				order: index,
				icon: cat.icon,
				color: cat.color,
			}));
		}

		// Delete existing categories (excluding income)
		const categoriesToDelete = categories;
		for (const category of categoriesToDelete) {
			budgetCategoriesCollection.delete(category.id);
		}

		// Insert new categories
		for (const categoryData of categoriesToCopy) {
			const id =
				categoryData.name === "Income"
					? incomeCategoryId
					: await generateHash(
							`${categoryData.name}-${Date.now()}-${Math.random()}`,
						);
			const category: BudgetCategory = {
				id,
				...categoryData,
				month: selectedMonthKey,
			};
			budgetCategoriesCollection.insert(category);
		}
	};

	const handleConfirmCopy = async () => {
		if (copySource) {
			await performCopy(copySource);
			setShowConfirmDialog(false);
			setCopySource(null);
		}
	};

	// Calculate totals
	const incomeCategory = categories.find((cat) => cat.id === incomeCategoryId);
	const currentIncome = incomeCategory?.budgetedAmount || 0;
	// Exclude Income category from total budgeted (only count expenses)
	const totalBudgeted = categories
		.filter((cat) => cat.id !== incomeCategoryId)
		.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
	const remainingBalance = currentIncome - totalBudgeted;

	// Sort categories by order
	const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

	return (
		<div className="flex flex-col p-10 max-w-4xl mx-auto">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Budget</h1>
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						onClick={() => setShowCopyDialog(true)}
						className="flex items-center gap-2"
					>
						<Copy size={16} />
						Copy Budget
					</Button>
					<MonthYearSelector
						selectedYear={selectedYear}
						selectedMonth={selectedMonth}
						onYearChange={setSelectedYear}
						onMonthChange={setSelectedMonth}
					/>
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
						{sortedCategories
							.filter((category) => category.id !== incomeCategoryId)
							.map((category) => {
								return (
									<div
										key={category.id}
										className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
									>
										<IconColorPicker
											icon={category.icon || DEFAULT_ICON}
											color={category.color || DEFAULT_COLOR}
											onIconChange={(icon) =>
												handleUpdateIcon(category.id, icon)
											}
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
													onChange={(e) =>
														setEditingCategoryName(e.target.value)
													}
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
													className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-left w-full"
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

			{/* Copy Budget Dialog */}
			<Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Copy Budget Categories</DialogTitle>
						<DialogDescription>
							Select a source to copy budget categories from:
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 space-y-2">
						{getAvailableCopySources().map((source) => (
							<Button
								key={source.value}
								variant="outline"
								className="w-full justify-start"
								onClick={() => handleCopyBudget(source.value)}
							>
								{source.label}
							</Button>
						))}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowCopyDialog(false)}>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirmation Dialog */}
			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Copy Budget</DialogTitle>
						<DialogDescription>
							This will delete all existing budget categories for this month and
							replace them with the selected source. This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowConfirmDialog(false);
								setCopySource(null);
							}}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleConfirmCopy}>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
