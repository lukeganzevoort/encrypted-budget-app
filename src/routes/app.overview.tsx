import { gte, lt, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LabelList, Pie, PieChart } from "recharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { MonthYearSelector } from "@/components/MonthYearSelector";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type BudgetCategory,
	budgetCategoriesCollection,
	transactionsCollection,
} from "@/db-collections/index";
import { INCOME_CATEGORY_ID } from "@/lib/initialization";

export const Route = createFileRoute("/app/overview")({
	component: RouteComponent,
});

// Fallback colors for categories without a color set
const CHART_COLORS = [
	"#3b82f6", // blue
	"#10b981", // emerald
	"#f59e0b", // amber
	"#ef4444", // red
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#06b6d4", // cyan
	"#f97316", // orange
	"#14b8a6", // teal
	"#6366f1", // indigo
	"#a855f7", // purple
	"#eab308", // yellow
];

function RouteComponent() {
	// Get current year and month
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

	// State for selected year and month, defaulting to current
	const [selectedYear, setSelectedYear] = useState<string>(
		currentYear.toString(),
	);
	const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

	// Combine year and month for query
	const selectedMonthKey = `${selectedYear}-${selectedMonth}`;

	// Calculate start and end dates for the selected month
	const getMonthRange = (monthKey: string) => {
		const [year, month] = monthKey.split("-").map(Number);
		const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

		// Calculate next month
		const nextMonth = month === 12 ? 1 : month + 1;
		const nextYear = month === 12 ? year + 1 : year;
		const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

		return { startDate, endDate };
	};

	const { startDate, endDate } = getMonthRange(selectedMonthKey);

	// Query transactions from the database, filtered by selected month
	const { data: transactions } = useLiveQuery(
		(q) =>
			q
				.from({ transaction: transactionsCollection })
				.where(({ transaction }) => gte(transaction.date, startDate))
				.where(({ transaction }) => lt(transaction.date, endDate))
				.select(({ transaction }) => ({
					...transaction,
				})),
		[selectedYear, selectedMonth],
	);

	// Query budget categories from the database
	const { data: budgetCategories } = useLiveQuery((q) =>
		q.from({ category: budgetCategoriesCollection }).select(({ category }) => ({
			...category,
		})),
	);

	const uncategorizedCategory: BudgetCategory = {
		id: "uncategorized",
		order: 0,
		name: "Uncategorized",
		icon: "CircleQuestionMark",
		color: "#9ca3af",
		budgetedAmount: 0,
	};

	// Calculate spending by category
	const categorySpending = new Map<string, number>(
		(budgetCategories ?? []).map((cat) => [cat.id, 0]),
	);

	let uncategorizedTotal = 0;

	transactions?.forEach((transaction) => {
		// Only include expenses (negative amounts)
		if (transaction.amount < 0) {
			const amount = Math.abs(transaction.amount);

			// Handle split transactions
			if (transaction.splits && transaction.splits.length > 0) {
				transaction.splits.forEach((split) => {
					if (split.categoryId) {
						const current = categorySpending.get(split.categoryId) || 0;
						categorySpending.set(split.categoryId, current + split.amount);
					} else {
						uncategorizedTotal += split.amount;
					}
				});
			} else if (transaction.categoryId) {
				// Handle regular single-category transactions
				const current = categorySpending.get(transaction.categoryId) || 0;
				categorySpending.set(transaction.categoryId, current + amount);
			} else {
				// Uncategorized transaction
				uncategorizedTotal += amount;
			}
		}
	});

	// Prepare chart data
	const chartData: Array<{
		category: string;
		amount: number;
		fill: string;
		categoryId: string;
	}> = [];

	let colorIndex = 0;

	// Add categorized transactions
	categorySpending.forEach((amount, categoryId) => {
		const category = budgetCategories?.find((c) => c.id === categoryId);
		if (category && amount > 0) {
			chartData.push({
				category: category.name,
				amount,
				fill: category.color || CHART_COLORS[colorIndex % CHART_COLORS.length],
				categoryId,
			});
			colorIndex++;
		}
	});

	// Add uncategorized if there are any
	if (uncategorizedTotal > 0) {
		chartData.push({
			category: "Uncategorized",
			amount: uncategorizedTotal,
			fill: "#9ca3af", // gray-400
			categoryId: "uncategorized",
		});
	}

	// Sort by amount descending
	chartData.sort((a, b) => b.amount - a.amount);

	// Build chart config
	const chartConfig: ChartConfig = {
		amount: {
			label: "Amount",
		},
	};

	chartData.forEach((item) => {
		chartConfig[item.categoryId] = {
			label: item.category,
			color: item.fill,
		};
	});

	// Calculate total spending
	const totalSpending =
		transactions
			?.filter((t) => t.categoryId !== INCOME_CATEGORY_ID)
			.reduce((sum, t) => sum - t.amount, 0) || 0;

	// Calculate statistics
	const totalTransactions = transactions?.length || 0;
	const expenseCount =
		transactions?.filter((t) => t.categoryId !== INCOME_CATEGORY_ID).length ||
		0;
	const incomeCount =
		transactions?.filter((t) => t.categoryId === INCOME_CATEGORY_ID).length ||
		0;
	const totalIncome =
		transactions
			?.filter((t) => t.categoryId === INCOME_CATEGORY_ID)
			.reduce((sum, t) => sum + t.amount, 0) || 0;

	return (
		<div className="flex flex-col p-10 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Overview</h1>
				<MonthYearSelector
					selectedYear={selectedYear}
					selectedMonth={selectedMonth}
					onYearChange={setSelectedYear}
					onMonthChange={setSelectedMonth}
				/>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Transactions</CardDescription>
						<CardTitle className="text-3xl">{totalTransactions}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							{incomeCount} income, {expenseCount} expenses
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Income</CardDescription>
						<CardTitle className="text-3xl text-green-600">
							${totalIncome.toFixed(2)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							From {incomeCount} transaction{incomeCount !== 1 ? "s" : ""}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Spending</CardDescription>
						<CardTitle className="text-3xl text-red-600">
							${totalSpending.toFixed(2)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							From {expenseCount} transaction{expenseCount !== 1 ? "s" : ""}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Net Balance</CardDescription>
						<CardTitle
							className={`text-3xl ${
								totalIncome - totalSpending >= 0
									? "text-green-600"
									: "text-red-600"
							}`}
						>
							${(totalIncome - totalSpending).toFixed(2)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							{totalIncome - totalSpending >= 0 ? "Surplus" : "Deficit"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Pie Chart and Category Breakdown */}
			{(() => {
				// Build breakdown data for all categories (excluding income)
				const breakdownData: Array<{
					categoryId: string;
					category: BudgetCategory;
					amount: number;
					fill: string;
				}> = [];

				// Add all expense categories
				budgetCategories
					?.filter((cat) => cat.id !== INCOME_CATEGORY_ID)
					.forEach((category) => {
						const spending = categorySpending.get(category.id) || 0;
						const fill =
							category.color ||
							CHART_COLORS[breakdownData.length % CHART_COLORS.length];
						breakdownData.push({
							categoryId: category.id,
							category,
							amount: spending,
							fill,
						});
					});

				// Add uncategorized if there are any
				if (uncategorizedTotal > 0) {
					breakdownData.push({
						categoryId: "uncategorized",
						category: uncategorizedCategory,
						amount: uncategorizedTotal,
						fill: "#9ca3af",
					});
				}

				// Sort by amount descending, then by name
				breakdownData.sort((a, b) => {
					if (b.amount !== a.amount) {
						return b.amount - a.amount;
					}
					return a.category.name.localeCompare(b.category.name);
				});

				const hasExpenseCategories =
					budgetCategories?.some((cat) => cat.id !== INCOME_CATEGORY_ID) ??
					false;

				if (!hasExpenseCategories) {
					return (
						<Card>
							<CardContent className="flex items-center justify-center py-16">
								<div className="text-center">
									<p className="text-lg text-muted-foreground mb-2">
										No expense categories available
									</p>
									<p className="text-sm text-muted-foreground">
										Create budget categories to see your spending breakdown
									</p>
								</div>
							</CardContent>
						</Card>
					);
				}

				return (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{chartData.length > 0 ? (
							<Card className="flex flex-col">
								<CardHeader className="items-center pb-0">
									<CardTitle>Spending by Category</CardTitle>
									<CardDescription>
										Total expenses: ${totalSpending.toFixed(2)}
									</CardDescription>
								</CardHeader>
								<CardContent className="flex-1 pb-0">
									<ChartContainer
										config={chartConfig}
										className="mx-auto aspect-square max-h-[400px]"
									>
										<PieChart>
											<ChartTooltip
												cursor={false}
												content={<ChartTooltipContent hideLabel />}
											/>
											<Pie data={chartData} dataKey="amount" nameKey="category">
												<LabelList
													dataKey="category"
													className="fill-background"
													stroke="none"
													fontSize={12}
												/>
											</Pie>
										</PieChart>
									</ChartContainer>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="flex items-center justify-center py-16">
									<div className="text-center">
										<p className="text-lg text-muted-foreground mb-2">
											No expense data available
										</p>
										<p className="text-sm text-muted-foreground">
											Upload transactions and categorize them to see your
											spending chart
										</p>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Category Breakdown */}
						<Card>
							<CardHeader>
								<CardTitle>Category Breakdown</CardTitle>
								<CardDescription>Spending by category</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{breakdownData.length > 0 ? (
										breakdownData.map((item) => {
											const percentage =
												item.category.budgetedAmount > 0
													? (item.amount / item.category.budgetedAmount) * 100
													: item.amount > 0
														? 100
														: 0;
											return (
												<Tooltip key={item.categoryId}>
													<TooltipTrigger asChild>
														<div key={item.categoryId}>
															<div className="flex items-center justify-between mb-1">
																<div className="flex items-center gap-2">
																	<CategoryIcon
																		icon={item.category.icon}
																		color={item.fill}
																		size={16}
																	/>
																	<span className="font-medium">
																		{item.category.name}
																	</span>
																</div>
																<span className="text-sm font-medium">
																	${item.amount.toFixed(2)}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<div className="flex-1 bg-gray-200 rounded-full h-2">
																	<div
																		className="h-2 rounded-full"
																		style={{
																			width: `${Math.min(percentage, 100)}%`,
																			backgroundColor: item.fill,
																		}}
																	/>
																</div>
																<span className="text-xs text-muted-foreground w-12 text-right">
																	{item.category.budgetedAmount > 0
																		? `${percentage.toFixed(1)}%`
																		: "—"}
																</span>
															</div>
														</div>
													</TooltipTrigger>
													<TooltipContent side="top" align="end">
														Budgeted: ${item.category.budgetedAmount.toFixed(2)}
													</TooltipContent>
												</Tooltip>
											);
										})
									) : (
										<p className="text-sm text-muted-foreground text-center py-4">
											No categories to display
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				);
			})()}
		</div>
	);
}
