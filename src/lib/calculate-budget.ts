import type {
	BudgetCategory,
	IncomeCategory,
	Transaction,
} from "@/db-collections";
import { getNextMonth, getPreviousMonth } from "./utils";

export type RolloverForNextMonth = {
	categoryId: string;
	amount: number;
};

export class CategoryMonthlyBudget {
	/** The category this budget line belongs to */
	readonly category: BudgetCategory;

	/** Monthly budget for the category in the month */
	readonly monthlyBudget: BudgetCategory["monthlyBudgets"][number];

	/** Month this calculation applies to, e.g. "2025-12" */
	readonly month: string;

	/** Transactions for this category in the month */
	readonly thisMonthTransactions: Transaction[];

	/** Monthly budgets for the category in previous months */
	readonly previousMonthsCategoryMonthlyBudgets: CategoryMonthlyBudget[];

	constructor(params: {
		category: BudgetCategory;
		month: string;
		thisMonthTransactions: Transaction[];
		previousMonthsCategoryMonthlyBudgets: CategoryMonthlyBudget[];
	}) {
		CategoryMonthlyBudget._verifyTransactionsAreForCategoryAndMonth(
			params.thisMonthTransactions,
			params.category,
			params.month,
		);
		CategoryMonthlyBudget._verifyPreviousMonthsCategoryMonthlyBudgetsAreForPreviousMonth(
			params.previousMonthsCategoryMonthlyBudgets,
			params.month,
		);
		this.category = params.category;
		this.monthlyBudget =
			CategoryMonthlyBudget._getMonthlyBudgetForCategoryAndMonth(
				params.category,
				params.month,
			);
		this.month = params.month;
		this.thisMonthTransactions = params.thisMonthTransactions;
		this.previousMonthsCategoryMonthlyBudgets =
			params.previousMonthsCategoryMonthlyBudgets;
	}

	get spent(): number {
		return this.thisMonthTransactions.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		);
	}

	get budgetedAmount(): number {
		return this.monthlyBudget.budgetedAmount;
	}

	get previousMonthRollover(): number {
		return this.previousMonthsCategoryMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget: CategoryMonthlyBudget) =>
				acc +
				categoryMonthlyBudget.rolloversForNextMonth.reduce(
					(acc, rollover) =>
						rollover.categoryId === this.category.id
							? acc + rollover.amount
							: acc,
					0,
				),
			0,
		);
	}

	/** Net change after spending (what remains before applying any special rollover rules) */
	get netForMonth(): number {
		return this.budgetedAmount + this.previousMonthRollover + this.spent;
	}

	get rolloversForNextMonth(): RolloverForNextMonth[] {
		const rolloverConfig = this.monthlyBudget.rolloverConfig ?? {
			type: "rollover",
		};

		if (rolloverConfig.type === "rollover") {
			return [{ categoryId: this.category.id, amount: this.netForMonth }];
		} else if (rolloverConfig.type === "transfer") {
			return [
				{
					categoryId: rolloverConfig.targetCategoryId,
					amount: this.netForMonth,
				},
			];
		} else if (rolloverConfig.type === "conditional") {
			return [
				{
					categoryId: this.category.id,
					amount: Math.min(this.netForMonth, rolloverConfig.maxRolloverAmount),
				},
				{
					categoryId: rolloverConfig.targetCategoryId,
					amount: Math.max(
						0,
						this.netForMonth - rolloverConfig.maxRolloverAmount,
					),
				},
			];
		}
		throw new Error("Invalid rollover config type");
	}

	/** Simple JSON representation, useful for APIs/UI */
	toJSON() {
		return {
			categoryId: this.category.id,
			month: this.month,
			budgetedAmount: this.budgetedAmount,
			previousMonthRollover: this.previousMonthRollover,
			spent: this.spent,
			netForMonth: this.netForMonth,
			rolloversForNextMonth: this.rolloversForNextMonth,
		};
	}

	/**
	 * Validates if a current monthly budget exists for this category and month.
	 * @returns {boolean}
	 */
	private static _getMonthlyBudgetForCategoryAndMonth(
		category: BudgetCategory,
		month: string,
	): BudgetCategory["monthlyBudgets"][number] {
		if (category.endMonth && category.endMonth < month) {
			throw new Error("Category is not active for this month");
		}
		const monthlyBudget = category.monthlyBudgets
			.filter((budget) => budget.startMonth <= month)
			.sort((a, b) => b.startMonth.localeCompare(a.startMonth))[0];

		if (!monthlyBudget) {
			throw new Error(
				"Monthly budget does not exist for this category and month",
			);
		}
		return monthlyBudget;
	}

	private static _verifyTransactionsAreForCategoryAndMonth(
		transactions: Transaction[],
		category: BudgetCategory,
		month: string,
	): void {
		transactions.forEach((transaction) => {
			if (transaction.categoryId !== category.id) {
				throw new Error("Transaction is not for this category");
			}
			if (transaction.date < month || transaction.date >= getNextMonth(month)) {
				throw new Error("Transaction is not for this month");
			}
		});
	}

	private static _verifyPreviousMonthsCategoryMonthlyBudgetsAreForPreviousMonth(
		previousMonthsCategoryMonthlyBudgets: CategoryMonthlyBudget[],
		month: string,
	): void {
		const previousMonth = getPreviousMonth(month);
		previousMonthsCategoryMonthlyBudgets.forEach((categoryMonthlyBudget) => {
			if (categoryMonthlyBudget.month !== previousMonth) {
				throw new Error(
					"Category monthly budget is not for the previous month",
				);
			}
		});
	}
}

export class MonthlyBudget {
	readonly categories: BudgetCategory[];
	readonly month: string;
	readonly thisMonthTransactions: Transaction[];
	readonly previousMonthsCategoriesMonthlyBudgets: CategoryMonthlyBudget[];

	constructor(params: {
		categories: BudgetCategory[];
		month: string;
		thisMonthTransactions: Transaction[];
		previousMonthsCategoriesMonthlyBudgets: CategoryMonthlyBudget[];
	}) {
		this.categories = params.categories;
		this.month = params.month;
		this.thisMonthTransactions = params.thisMonthTransactions;
		this.previousMonthsCategoriesMonthlyBudgets =
			params.previousMonthsCategoriesMonthlyBudgets;
	}

	get categoriesMonthlyBudgets(): CategoryMonthlyBudget[] {
		return this.categories
			.map(
				(category) =>
					new CategoryMonthlyBudget({
						category,
						month: this.month,
						thisMonthTransactions: this.thisMonthTransactions.filter(
							(transaction) => transaction.categoryId === category.id,
						),
						previousMonthsCategoryMonthlyBudgets:
							this.previousMonthsCategoriesMonthlyBudgets.filter(
								(categoryMonthlyBudget) =>
									categoryMonthlyBudget.category.id === category.id,
							),
					}),
			)
			.sort((a, b) => {
				if (a.category.order !== b.category.order) {
					return a.category.order - b.category.order;
				}
				if (b.spent !== a.spent) {
					return b.spent - a.spent;
				}
				return a.category.name.localeCompare(b.category.name);
			});
	}

	get totalSpent(): number {
		return this.categoriesMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget) => acc + categoryMonthlyBudget.spent,
			0,
		);
	}

	get totalBudgetedAmount(): number {
		return this.categoriesMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget) =>
				acc + categoryMonthlyBudget.budgetedAmount,
			0,
		);
	}

	get totalPreviousMonthRollover(): number {
		return this.categoriesMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget) =>
				acc + categoryMonthlyBudget.previousMonthRollover,
			0,
		);
	}

	get totalNetForMonth(): number {
		return this.categoriesMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget) => acc + categoryMonthlyBudget.netForMonth,
			0,
		);
	}

	get totalRolloversForNextMonth(): RolloverForNextMonth[] {
		return this.categoriesMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget) =>
				acc.concat(categoryMonthlyBudget.rolloversForNextMonth),
			[] as RolloverForNextMonth[],
		);
	}

	get orphanedTransactions(): Transaction[] {
		return this.thisMonthTransactions.filter(
			(transaction) =>
				!this.categoriesMonthlyBudgets.some(
					(categoryMonthlyBudget) =>
						categoryMonthlyBudget.category.id === transaction.categoryId,
				),
		);
	}

	get orphanedRolloversFromPreviousMonth(): RolloverForNextMonth[] {
		return this.previousMonthsCategoriesMonthlyBudgets.reduce(
			(acc, categoryMonthlyBudget) =>
				acc.concat(
					categoryMonthlyBudget.rolloversForNextMonth.filter(
						(rollover) =>
							!this.categoriesMonthlyBudgets.some(
								(categoryMonthlyBudget) =>
									categoryMonthlyBudget.category.id === rollover.categoryId,
							),
					),
				),
			[] as RolloverForNextMonth[],
		);
	}

	get orphanedCashFromPreviousMonth(): number {
		return this.orphanedRolloversFromPreviousMonth.reduce(
			(acc, rollover) => acc + rollover.amount,
			0,
		);
	}

	toJSON() {
		return {
			totalSpent: this.totalSpent,
			totalBudgetedAmount: this.totalBudgetedAmount,
			totalPreviousMonthRollover: this.totalPreviousMonthRollover,
			totalNetForMonth: this.totalNetForMonth,
			totalRolloversForNextMonth: this.totalRolloversForNextMonth,
			orphanedTransactions: this.orphanedTransactions,
			orphanedRolloversFromPreviousMonth:
				this.orphanedRolloversFromPreviousMonth,
			orphanedCashFromPreviousMonth: this.orphanedCashFromPreviousMonth,
		};
	}
}

export function calculateMonthlyBudget({
	month,
	allIncome,
	allCategories,
	allTransactions,
}: {
	month: string;
	allIncome: IncomeCategory[];
	allCategories: BudgetCategory[];
	allTransactions: Transaction[];
}): { [month: string]: MonthlyBudget } {
	// Get the earliest start month from the income categories
	const startMonth = allIncome.sort((a, b) =>
		a.startMonth.localeCompare(b.startMonth),
	)[0]?.startMonth;
	if (!startMonth) {
		throw new Error("No start month found");
	}

	// Get all months between start month and selected month
	const months = [];
	for (
		let currentMonth = startMonth;
		currentMonth <= month;
		currentMonth = getNextMonth(currentMonth)
	) {
		months.push(currentMonth);
	}

	// Get the monthly budgets for each month
	const monthlyBudgets: { [month: string]: MonthlyBudget } = {};
	months.forEach((month) => {
		const categories = allCategories.filter(
			(c) => c.startMonth <= month && (c.endMonth ? c.endMonth >= month : true),
		);
		const thisMonthTransactions = allTransactions.filter((t) =>
			t.date.startsWith(month),
		);
		const previousMonthsCategoriesMonthlyBudgets =
			monthlyBudgets[getPreviousMonth(month)]?.categoriesMonthlyBudgets ?? [];

		const monthlyBudget = new MonthlyBudget({
			categories,
			month,
			thisMonthTransactions,
			previousMonthsCategoriesMonthlyBudgets,
		});
		monthlyBudgets[month] = monthlyBudget;
	});

	return monthlyBudgets;
}
