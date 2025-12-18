import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LabelList, Pie, PieChart } from "recharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { MonthYearSelector } from "@/components/MonthYearSelector";
import { Badge } from "@/components/ui/badge";
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
	incomeCategoriesCollection,
	transactionsCollection,
} from "@/db-collections/index";
import { calculateMonthlyBudget } from "@/lib/calculate-budget";
import { INCOME_CATEGORY_ID } from "@/lib/initialization";
import { formatDollars } from "@/lib/utils";

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
	const incomeCategories2 = useLiveQuery((q) =>
		q
			.from({ category: incomeCategoriesCollection })
			.orderBy(({ category }) => category.startMonth, "asc"),
	);

	const transactions2 = useLiveQuery((q) =>
		q
			.from({ transaction: transactionsCollection })
			.orderBy(({ transaction }) => transaction.date, "asc"),
	);

	const budgetCategories2 = useLiveQuery((q) =>
		q
			.from({ category: budgetCategoriesCollection })
			.orderBy(({ category }) => category.startMonth, "asc"),
	);

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

	const monthlyBudgets = calculateMonthlyBudget({
		month: selectedMonthKey,
		allIncome: incomeCategories2.data,
		allCategories: budgetCategories2.data,
		allTransactions: transactions2.data,
	});
	const monthlyBudget = monthlyBudgets[selectedMonthKey];
	if (!monthlyBudget) {
		throw new Error("No monthly budget found");
	}
	console.log(monthlyBudget.toJSON());
	const budgetCategories = monthlyBudget.categories;
	const transactions = monthlyBudget.thisMonthTransactions;

	const uncategorizedCategory: BudgetCategory = {
		id: "uncategorized",
		order: 0,
		name: "Uncategorized",
		icon: "CircleQuestionMark",
		color: "#9ca3af",
		startMonth: selectedMonthKey,
		monthlyBudgets: [
			{
				budgetedAmount: 0,
				startMonth: selectedMonthKey,
			},
		],
	};

	// Calculate spending by category
	const categorySpending = new Map<string, number>(
		budgetCategories.map((cat) => [cat.id, 0]),
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
				fill:
					(category.color || CHART_COLORS[colorIndex % CHART_COLORS.length]) ??
					"#000000",
				categoryId,
			});
			colorIndex++;
		}
	});

	if (uncategorizedTotal > 0) {
		// Add uncategorized if there are any
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

	const incomeTransactions = transactions.filter(
		(t) => t.categoryId === INCOME_CATEGORY_ID,
	);
	const expenseTransactions = transactions.filter(
		(t) => t.categoryId !== INCOME_CATEGORY_ID,
	);

	// Calculate total spending
	const transactionCount = transactions.length;
	const incomeCount = incomeTransactions.length;
	const expenseCount = expenseTransactions.length;

	const incomeSum =
		incomeTransactions.reduce((sum, t) => sum + t.amount, 0) || 0;
	const positiveExpenseSum =
		expenseTransactions
			.filter((t) => t.amount >= 0)
			.reduce((sum, t) => sum + t.amount, 0) || 0;
	const negativeExpenseSum =
		expenseTransactions
			.filter((t) => t.amount < 0)
			.reduce((sum, t) => sum + t.amount, 0) || 0;
	const expenseSum = positiveExpenseSum + negativeExpenseSum;

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
						<CardTitle className="text-3xl">{transactionCount}</CardTitle>
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
						<CardTitle
							className={`text-3xl ${incomeSum >= 0 ? "text-green-600" : "text-red-600"}`}
						>
							{formatDollars(incomeSum)}
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
						<CardTitle
							className={`text-3xl ${
								expenseSum >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							{formatDollars(expenseSum)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							From {expenseCount} transaction{expenseCount !== 1 ? "s" : ""}
							{positiveExpenseSum > 0 &&
								` (including ${formatDollars(positiveExpenseSum, true, false)} in refunds)`}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Net Balance</CardDescription>
						<CardTitle
							className={`text-3xl ${
								incomeSum + expenseSum >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							{formatDollars(incomeSum + expenseSum)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							{incomeSum + expenseSum > 0 ? "Surplus" : "Deficit"}
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

				// Add uncategorized if there are any
				if (uncategorizedTotal > 0) {
					breakdownData.push({
						categoryId: "uncategorized",
						category: uncategorizedCategory,
						amount: uncategorizedTotal,
						fill: "#9ca3af",
					});
				}

				if (budgetCategories.length === 0) {
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
										Total spending: {formatDollars(expenseSum)}
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
									{monthlyBudget.categoriesMonthlyBudgets.length > 0 ? (
										monthlyBudget.categoriesMonthlyBudgets.map((item) => {
											const budgetedAmount =
												item.budgetedAmount + item.previousMonthRollover;
											const percentage =
												budgetedAmount > 0
													? (-item.spent / budgetedAmount) * 100
													: (-item.spent / 0.001) * 100;
											const isOverspent = -item.spent > budgetedAmount;
											return (
												<Tooltip key={item.category.id}>
													<TooltipTrigger asChild>
														<div key={item.category.id}>
															<div className="flex items-center justify-between mb-1">
																<div className="flex items-center gap-2">
																	<CategoryIcon
																		icon={item.category.icon}
																		color={item.category.color}
																		size={16}
																	/>
																	<span className="font-medium">
																		{item.category.name}
																	</span>
																	{isOverspent && (
																		<Badge
																			variant="destructive"
																			className="text-xs"
																		>
																			OVER SPENT
																		</Badge>
																	)}
																</div>
																<span
																	className={`text-sm font-medium ${
																		isOverspent ? "text-red-600" : ""
																	}`}
																>
																	{formatDollars(-item.spent)}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<div className="flex-1 bg-gray-200 rounded-full h-2">
																	<div
																		className="h-2 rounded-full"
																		style={{
																			width: `${Math.max(Math.min(percentage, 100), 0)}%`,
																			backgroundColor: item.category.color,
																		}}
																	/>
																</div>
																<span
																	className={`text-xs w-12 text-right ${
																		isOverspent
																			? "text-red-600 font-semibold"
																			: "text-muted-foreground"
																	}`}
																>
																	{`${isOverspent ? ">100" : Math.min(percentage, 100).toFixed(0)}%`}
																</span>
															</div>
														</div>
													</TooltipTrigger>
													<TooltipContent side="top" align="end">
														<div>
															Budgeted: {formatDollars(budgetedAmount)}
															{isOverspent && (
																<div className="text-red-600 font-semibold mt-1">
																	Over by:{" "}
																	{formatDollars(
																		-(item.spent + budgetedAmount),
																	)}
																</div>
															)}
														</div>
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
