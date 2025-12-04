import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { LabelList, Pie, PieChart } from "recharts";
import {
	budgetCategoriesCollection,
	transactionsCollection,
} from "@/db-collections/index";
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

export const Route = createFileRoute("/app/overview")({
	component: RouteComponent,
});

// Generate colors for categories
const CHART_COLORS = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
	"hsl(12, 76%, 61%)",
	"hsl(173, 58%, 39%)",
	"hsl(197, 37%, 24%)",
	"hsl(43, 74%, 66%)",
	"hsl(27, 87%, 67%)",
];

function RouteComponent() {
	// Query transactions from the database
	const { data: transactions } = useLiveQuery((q) =>
		q.from({ transaction: transactionsCollection }).select(({ transaction }) => ({
			...transaction,
		})),
	);

	// Query budget categories from the database
	const { data: budgetCategories } = useLiveQuery((q) =>
		q.from({ category: budgetCategoriesCollection }).select(({ category }) => ({
			...category,
		})),
	);

	// Calculate spending by category
	const categorySpending = new Map<string, number>();
	let uncategorizedTotal = 0;

	transactions?.forEach((transaction) => {
		// Only include expenses (negative amounts)
		if (transaction.amount < 0) {
			const amount = Math.abs(transaction.amount);
			if (transaction.categoryId) {
				const current = categorySpending.get(transaction.categoryId) || 0;
				categorySpending.set(transaction.categoryId, current + amount);
			} else {
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
				fill: CHART_COLORS[colorIndex % CHART_COLORS.length],
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
			fill: "hsl(var(--muted))",
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
	const totalSpending = chartData.reduce((sum, item) => sum + item.amount, 0);

	// Calculate statistics
	const totalTransactions = transactions?.length || 0;
	const expenseCount =
		transactions?.filter((t) => t.amount < 0).length || 0;
	const incomeCount =
		transactions?.filter((t) => t.amount > 0).length || 0;
	const totalIncome =
		transactions
			?.filter((t) => t.amount > 0)
			.reduce((sum, t) => sum + t.amount, 0) || 0;

	return (
		<div className="flex flex-col p-10 max-w-7xl mx-auto">
			<h1 className="text-3xl font-bold mb-8">Overview</h1>

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

			{/* Pie Chart */}
			{chartData.length > 0 ? (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

					{/* Category Breakdown */}
					<Card>
						<CardHeader>
							<CardTitle>Category Breakdown</CardTitle>
							<CardDescription>Spending by category</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{chartData.map((item) => {
									const percentage = (item.amount / totalSpending) * 100;
									return (
										<div key={item.categoryId}>
											<div className="flex items-center justify-between mb-1">
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{ backgroundColor: item.fill }}
													/>
													<span className="font-medium">{item.category}</span>
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
															width: `${percentage}%`,
															backgroundColor: item.fill,
														}}
													/>
												</div>
												<span className="text-xs text-muted-foreground w-12 text-right">
													{percentage.toFixed(1)}%
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</div>
			) : (
				<Card>
					<CardContent className="flex items-center justify-center py-16">
						<div className="text-center">
							<p className="text-lg text-muted-foreground mb-2">
								No expense data available
							</p>
							<p className="text-sm text-muted-foreground">
								Upload transactions and categorize them to see your spending
								breakdown
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
