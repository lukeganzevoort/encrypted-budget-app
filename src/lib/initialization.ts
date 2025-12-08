import {
	type Account,
	accountsCollection,
	type BudgetCategory,
	budgetCategoriesCollection,
} from "@/db-collections/index";
import { generateHash } from "@/lib/utils";

export const CASH_ACCOUNT_ID = "cash-account-default";
export const INCOME_CATEGORY_ID = "income-category-default";

export const DEFAULT_INCOME = 5000;
export const DEFAULT_CATEGORIES = [
	{ name: "Giving", amount: 500, icon: "Heart", color: "#ec4899" },
	{ name: "Saving", amount: 750, icon: "PiggyBank", color: "#10b981" },
	{ name: "Groceries", amount: 500, icon: "ShoppingCart", color: "#f97316" },
	{ name: "Home", amount: 1500, icon: "Home", color: "#3b82f6" },
	{ name: "Bills", amount: 1000, icon: "Lightbulb", color: "#eab308" },
	{ name: "Transportation", amount: 400, icon: "Car", color: "#a855f7" },
	{ name: "Spending", amount: 350, icon: "CreditCard", color: "#14b8a6" },
];

/**
 * Initializes the default cash account if it doesn't exist
 * @param accounts - Current list of accounts from the database
 * @returns true if the cash account was created, false if it already existed
 */
export async function initializeCashAccount(
	accounts: Account[] | undefined,
): Promise<boolean> {
	// Check if Cash account exists
	const hasCashAccount =
		accounts?.some((account) => account.id === CASH_ACCOUNT_ID) ?? false;

	if (!hasCashAccount) {
		const cashAccount: Account = {
			id: CASH_ACCOUNT_ID,
			name: "Cash",
			type: "checking",
			balance: 0,
			order: -1, // Put it first
			icon: "Wallet",
			color: "#10b981",
			isActive: true,
			isDefault: true,
		};
		accountsCollection.insert(cashAccount);
		return true;
	}

	return false;
}

/**
 * Initializes default budget categories if they don't exist
 * @param budgetCategories - Current budget categories from the database
 * @returns Object indicating what was created
 */
export async function initializeBudgetDefaults(
	budgetCategories: BudgetCategory[] | undefined,
): Promise<{
	categoriesCreated: boolean;
	incomeCategoryCreated: boolean;
}> {
	const hasCategories = budgetCategories && budgetCategories.length > 0;
	const hasIncomeCategory =
		budgetCategories?.some((category) => category.id === INCOME_CATEGORY_ID) ??
		false;

	let categoriesCreated = false;
	let incomeCategoryCreated = false;

	// Initialize default categories if none exist
	if (!hasCategories) {
		for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
			const defaultCat = DEFAULT_CATEGORIES[i];
			const id = await generateHash(`${defaultCat.name}-${Date.now()}-${i}`);
			const category: BudgetCategory = {
				id,
				name: defaultCat.name,
				budgetedAmount: defaultCat.amount,
				order: i,
				icon: defaultCat.icon,
				color: defaultCat.color,
			};
			budgetCategoriesCollection.insert(category);
		}
		categoriesCreated = true;
	}

	if (!hasIncomeCategory) {
		const incomeCategory: BudgetCategory = {
			id: INCOME_CATEGORY_ID,
			name: "Income",
			budgetedAmount: DEFAULT_INCOME,
			order: 0,
			icon: "DollarSign",
			color: "#10b981",
		};
		budgetCategoriesCollection.insert(incomeCategory);
		incomeCategoryCreated = true;
	}

	return { categoriesCreated, incomeCategoryCreated };
}

/**
 * Initializes all default data (cash account and budget categories)
 * @param accounts - Current list of accounts from the database
 * @param budgetCategories - Current budget categories from the database
 * @returns Object indicating what was created
 */
export async function initializeDefaults(
	accounts: Account[] | undefined,
	budgetCategories: BudgetCategory[] | undefined,
): Promise<{
	cashAccountCreated: boolean;
	categoriesCreated: boolean;
	incomeCategoryCreated: boolean;
}> {
	const [cashAccountCreated, budgetResult] = await Promise.all([
		initializeCashAccount(accounts),
		initializeBudgetDefaults(budgetCategories),
	]);

	return {
		cashAccountCreated,
		categoriesCreated: budgetResult.categoriesCreated,
		incomeCategoryCreated: budgetResult.incomeCategoryCreated,
	};
}
