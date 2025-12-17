import {
	and,
	gte,
	isUndefined,
	lte,
	or,
	useLiveQuery,
} from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	IterationCw,
	MoveDiagonal,
	MoveRight,
	Plus,
	Settings,
	Trash2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { IconColorPicker } from "@/components/IconColorPicker";
import { MonthYearSelector } from "@/components/MonthYearSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
	type BudgetCategory,
	budgetCategoriesCollection,
	getBudgetedAmountForMonth,
	getRolloverConfigForMonth,
	type IncomeCategory,
	incomeCategoriesCollection,
	type RolloverConfig,
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
	const [rolloverSheetId, setRolloverSheetId] = useState<string | null>(null);
	const [focusField, setFocusField] = useState<
		"name" | "description" | "amount" | "rolloverType" | null
	>(null);
	const [rolloverType, setRolloverType] = useState<
		"rollover" | "transfer" | "conditional"
	>("rollover");
	const [rolloverTargetCategoryId, setRolloverTargetCategoryId] =
		useState<string>("");
	const [rolloverMaxAmount, setRolloverMaxAmount] = useState<string>("");
	const [editingAmount, setEditingAmount] = useState<string>("");
	const [editingDescription, setEditingDescription] = useState<string>("");
	const [editingName, setEditingName] = useState<string>("");

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
					rolloverConfig: {
						type: "rollover",
					},
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

	const getRolloverIcon = (
		type: "rollover" | "transfer" | "conditional",
		size: number = 16,
	) => {
		switch (type) {
			case "rollover":
				return <IterationCw size={size} />;
			case "transfer":
				return <MoveRight size={size} />;
			case "conditional":
				return <MoveDiagonal size={size} />;
		}
	};

	const getRolloverIconFromCategory = (category: BudgetCategory) => {
		const config = getRolloverConfigForMonth(category, selectedMonthKey);
		if (config) {
			return getRolloverIcon(config.type);
		}
		return getRolloverIcon("rollover");
	};

	const handleOpenRolloverConfig = (
		categoryId: string,
		focusFieldName:
			| "name"
			| "description"
			| "amount"
			| "rolloverType"
			| null = null,
	) => {
		const category = categories.find((cat) => cat.id === categoryId);
		if (!category) return;

		const amount = getBudgetedAmountForMonth(category, selectedMonthKey);
		setEditingAmount(amount.toString());
		setEditingDescription(category.description || "");
		setEditingName(category.name);
		setFocusField(focusFieldName);

		const config = getRolloverConfigForMonth(category, selectedMonthKey);
		if (config) {
			setRolloverType(config.type);

			if (config.type === "transfer" || config.type === "conditional") {
				setRolloverTargetCategoryId(config.targetCategoryId);
			} else {
				setRolloverTargetCategoryId("");
			}

			if (config.type === "conditional") {
				setRolloverMaxAmount(config.maxRolloverAmount.toString());
			} else {
				setRolloverMaxAmount("");
			}
		} else {
			// Default to rollover to same category
			setRolloverType("rollover");
			setRolloverTargetCategoryId("");
			setRolloverMaxAmount("");
		}
		setRolloverSheetId(categoryId);
	};

	const handleSaveRolloverConfig = async (categoryId: string) => {
		const category = categories.find((cat) => cat.id === categoryId);
		if (!category) return;

		// Validate and parse amount
		const amount = Number.parseFloat(editingAmount);
		if (Number.isNaN(amount) || amount < 0) {
			alert("Please enter a valid budget amount");
			return;
		}

		let rolloverConfig: RolloverConfig;

		if (rolloverType === "rollover") {
			rolloverConfig = {
				type: "rollover",
			};
		} else {
			if (!rolloverTargetCategoryId) {
				alert("Please select a target category");
				return;
			}
			if (rolloverType === "transfer") {
				rolloverConfig = {
					type: "transfer",
					targetCategoryId: rolloverTargetCategoryId,
				};
			} else if (rolloverType === "conditional") {
				const maxAmount = Number.parseFloat(rolloverMaxAmount.trim());
				if (Number.isNaN(maxAmount) || maxAmount < 0) {
					alert("Please enter a valid max rollover amount");
					return;
				}
				rolloverConfig = {
					type: "conditional",
					targetCategoryId: rolloverTargetCategoryId,
					maxRolloverAmount: Number.parseFloat(rolloverMaxAmount.trim()),
				};
			}
		}

		// Update category name and description
		budgetCategoriesCollection.update(categoryId, (item) => {
			item.name = editingName.trim();
			item.description = editingDescription.trim() || undefined;
		});

		// Find or create monthly budget entry for this month
		budgetCategoriesCollection.update(categoryId, (item) => {
			const existing = item.monthlyBudgets.find(
				(mb) => mb.startMonth === selectedMonthKey,
			);
			if (existing) {
				// Update existing entry
				existing.budgetedAmount = amount;
				existing.rolloverConfig = rolloverConfig;
			} else {
				// Add new entry for this month
				const newBudget = {
					budgetedAmount: amount,
					startMonth: selectedMonthKey,
					rolloverConfig,
				};
				item.monthlyBudgets.push(newBudget);
				// Sort by startMonth to keep them in order
				item.monthlyBudgets.sort((a, b) =>
					a.startMonth.localeCompare(b.startMonth),
				);
			}
		});

		setRolloverSheetId(null);
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
										<div
											className={`flex flex-col ${
												category.description
													? "items-start"
													: "items-start justify-center"
											} min-h-[3rem]`}
										>
											<button
												type="button"
												className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-left w-full"
												onClick={() =>
													handleOpenRolloverConfig(category.id, "name")
												}
											>
												{category.name}
											</button>
											{category.description && (
												<button
													type="button"
													className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-blue-600 transition-colors text-left w-full"
													onClick={() =>
														handleOpenRolloverConfig(category.id, "description")
													}
												>
													{category.description}
												</button>
											)}
										</div>
									</div>
									<button
										type="button"
										className="w-32 text-right font-medium cursor-pointer hover:text-blue-600 transition-colors"
										onClick={() =>
											handleOpenRolloverConfig(category.id, "amount")
										}
									>
										$
										{getBudgetedAmountForMonth(
											category,
											selectedMonthKey,
										).toFixed(2)}
									</button>
									<Button
										size="icon"
										variant="ghost"
										className="text-right font-medium cursor-pointer hover:text-blue-600 transition-colors"
										onClick={() =>
											handleOpenRolloverConfig(category.id, "rolloverType")
										}
									>
										{getRolloverIconFromCategory(category)}
									</Button>
									<Sheet
										open={rolloverSheetId === category.id}
										onOpenChange={(open) => {
											if (open) {
												handleOpenRolloverConfig(category.id);
											} else {
												setRolloverSheetId(null);
												setFocusField(null);
											}
										}}
									>
										<SheetTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="flex items-center gap-1 hover:text-blue-500"
											>
												<Settings size={16} />
											</Button>
										</SheetTrigger>
										<SheetContent>
											<SheetHeader>
												<SheetTitle>Edit Category</SheetTitle>
											</SheetHeader>

											<SheetBody>
												<div className="space-y-6 p-4">
													<div className="space-y-2">
														<Label htmlFor={`name-${category.id}`}>
															Category Name
														</Label>
														<Input
															id={`name-${category.id}`}
															type="text"
															placeholder="Category name"
															value={editingName}
															onChange={(e) => setEditingName(e.target.value)}
															autoFocus={focusField === "name"}
														/>
													</div>

													<div className="space-y-2">
														<Label htmlFor={`amount-${category.id}`}>
															Budget Amount
														</Label>
														<Input
															id={`amount-${category.id}`}
															type="number"
															placeholder="0.00"
															value={editingAmount}
															onChange={(e) => setEditingAmount(e.target.value)}
															autoFocus={focusField === "amount"}
														/>
													</div>

													<div className="space-y-2">
														<Label htmlFor={`description-${category.id}`}>
															Description
														</Label>
														<Textarea
															id={`description-${category.id}`}
															placeholder="Add a description for this category..."
															value={editingDescription}
															onChange={(e) =>
																setEditingDescription(e.target.value)
															}
															rows={3}
															autoFocus={focusField === "description"}
														/>
													</div>

													<div className="space-y-2">
														<Label htmlFor={`rollover-type-${category.id}`}>
															What happens to extra money?
														</Label>
														<Select
															value={rolloverType}
															onValueChange={(value) => {
																if (
																	value === "rollover" ||
																	value === "transfer" ||
																	value === "conditional"
																) {
																	setRolloverType(value);
																}
															}}
														>
															<SelectTrigger
																id={`rollover-type-${category.id}`}
																className="w-full"
																autoFocus={focusField === "rolloverType"}
															>
																<div className="flex items-center gap-2 flex-1">
																	<SelectValue placeholder="Select option" />
																</div>
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="rollover">
																	<div className="flex items-center gap-2">
																		{getRolloverIcon("rollover", 16)}
																		<span>Roll over to same category</span>
																	</div>
																</SelectItem>
																<SelectItem value="transfer">
																	<div className="flex items-center gap-2">
																		{getRolloverIcon("transfer", 16)}
																		<span>Transfer to another category</span>
																	</div>
																</SelectItem>
																<SelectItem value="conditional">
																	<div className="flex items-center gap-2">
																		{getRolloverIcon("conditional", 16)}
																		<span>
																			Rollover up to amount, then transfer
																		</span>
																	</div>
																</SelectItem>
															</SelectContent>
														</Select>
													</div>

													{rolloverType === "conditional" && (
														<div className="space-y-2">
															<Label htmlFor={`rollover-max-${category.id}`}>
																Max Rollover Amount
															</Label>
															<Input
																id={`rollover-max-${category.id}`}
																type="number"
																placeholder="0.00"
																value={rolloverMaxAmount}
																onChange={(e) =>
																	setRolloverMaxAmount(e.target.value)
																}
															/>
															<p className="text-xs text-muted-foreground">
																Amount above this will be transferred to the
																target category
															</p>
														</div>
													)}

													{(rolloverType === "transfer" ||
														rolloverType === "conditional") && (
														<div className="space-y-2">
															<Label htmlFor={`rollover-target-${category.id}`}>
																Target Category
															</Label>
															<Select
																value={rolloverTargetCategoryId}
																onValueChange={setRolloverTargetCategoryId}
															>
																<SelectTrigger
																	id={`rollover-target-${category.id}`}
																>
																	<SelectValue placeholder="Select category" />
																</SelectTrigger>
																<SelectContent>
																	{sortedCategories
																		.filter((cat) => cat.id !== category.id)
																		.map((cat) => (
																			<SelectItem key={cat.id} value={cat.id}>
																				{cat.name}
																			</SelectItem>
																		))}
																</SelectContent>
															</Select>
														</div>
													)}
												</div>
											</SheetBody>
											<SheetFooter className="flex-col sm:flex-row gap-2">
												<Button
													variant="destructive"
													onClick={() => {
														handleDeleteCategory(category);
														setRolloverSheetId(null);
													}}
													className="flex items-center gap-2"
												>
													<Trash2 size={16} />
													Delete
												</Button>
												<div className="flex gap-2 ml-auto">
													<Button
														variant="outline"
														onClick={() => setRolloverSheetId(null)}
													>
														Cancel
													</Button>
													<Button
														onClick={() =>
															handleSaveRolloverConfig(category.id)
														}
													>
														Save
													</Button>
												</div>
											</SheetFooter>
										</SheetContent>
									</Sheet>
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
