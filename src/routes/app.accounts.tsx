import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	CreditCard,
	Home,
	Landmark,
	Package,
	PiggyBank,
	Plus,
	Trash2,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { IconColorPicker } from "@/components/IconColorPicker";
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
import { type Account, accountsCollection } from "@/db-collections/index";
import { DEFAULT_COLOR, DEFAULT_ICON } from "@/lib/category-icons";
import { generateHash } from "@/lib/utils";

export const Route = createFileRoute("/app/accounts")({
	component: RouteComponent,
});

const ACCOUNT_ICONS: Record<string, string> = {
	checking: "Landmark",
	savings: "PiggyBank",
	investment: "TrendingUp",
	other: "Package",
	credit: "CreditCard",
	loan: "Wallet",
	mortgage: "Home",
};

const ACCOUNT_COLORS: Record<string, string> = {
	checking: "#3b82f6",
	savings: "#10b981",
	investment: "#8b5cf6",
	other: "#6366f1",
	credit: "#f59e0b",
	loan: "#ef4444",
	mortgage: "#06b6d4",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
	checking: "Checking Account",
	savings: "Savings Account",
	investment: "Investment Account",
	other: "Other Asset",
	credit: "Credit Card",
	loan: "Loan",
	mortgage: "Mortgage",
};

function RouteComponent() {
	const [newAccountName, setNewAccountName] = useState<string>("");
	const [newAccountType, setNewAccountType] = useState<string>("checking");
	const [newAccountBalance, setNewAccountBalance] = useState<string>("");
	const [newAccountCreditLimit, setNewAccountCreditLimit] =
		useState<string>("");
	const [newAccountInterestRate, setNewAccountInterestRate] =
		useState<string>("");
	const [newAccountIcon, setNewAccountIcon] = useState<string>(DEFAULT_ICON);
	const [newAccountColor, setNewAccountColor] = useState<string>(DEFAULT_COLOR);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
	const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
	const [editingAccountName, setEditingAccountName] = useState<string>("");

	// Generate all IDs at the top level to avoid conditional hook calls
	const accountNameId = useId();
	const accountTypeId = useId();
	const accountBalanceId = useId();
	const creditLimitId = useId();
	const interestRateId = useId();

	// Query accounts from the database
	const { data: accountsData } = useLiveQuery((q) =>
		q.from({ account: accountsCollection }).select(({ account }) => ({
			...account,
		})),
	);

	// Update local accounts state when database changes
	useEffect(() => {
		if (accountsData) {
			setAccounts(accountsData);
		}
	}, [accountsData]);

	// Update icon and color when account type changes
	useEffect(() => {
		setNewAccountIcon(ACCOUNT_ICONS[newAccountType] || DEFAULT_ICON);
		setNewAccountColor(ACCOUNT_COLORS[newAccountType] || DEFAULT_COLOR);
	}, [newAccountType]);

	const handleAddAccount = async () => {
		const balance = Number.parseFloat(newAccountBalance);
		if (!newAccountName.trim()) {
			alert("Please enter an account name");
			return;
		}
		if (Number.isNaN(balance)) {
			alert("Please enter a valid balance");
			return;
		}

		const id = await generateHash(
			`${newAccountName}-${Date.now()}-${Math.random()}`,
		);
		const order = accounts.length;

		const account: Account = {
			id,
			name: newAccountName,
			type: newAccountType as Account["type"],
			balance,
			order,
			icon: newAccountIcon,
			color: newAccountColor,
			isActive: true,
			isDefault: false,
		};

		// Add credit limit for credit cards
		if (newAccountType === "credit" && newAccountCreditLimit) {
			const limit = Number.parseFloat(newAccountCreditLimit);
			if (!Number.isNaN(limit) && limit > 0) {
				account.creditLimit = limit;
			}
		}

		// Add interest rate for loans and mortgages
		if (
			(newAccountType === "loan" || newAccountType === "mortgage") &&
			newAccountInterestRate
		) {
			const rate = Number.parseFloat(newAccountInterestRate);
			if (!Number.isNaN(rate) && rate >= 0) {
				account.interestRate = rate;
			}
		}

		accountsCollection.insert(account);
		setNewAccountName("");
		setNewAccountType("checking");
		setNewAccountBalance("");
		setNewAccountCreditLimit("");
		setNewAccountInterestRate("");
		setNewAccountIcon(DEFAULT_ICON);
		setNewAccountColor(DEFAULT_COLOR);
	};

	const handleDeleteAccount = (accountId: string) => {
		const account = accounts.find((a) => a.id === accountId);
		if (account?.isDefault) {
			alert("Cannot delete the default Cash account");
			return;
		}
		accountsCollection.delete(accountId);
	};

	const handleUpdateBalance = (accountId: string, newBalance: string) => {
		const balance = Number.parseFloat(newBalance);
		if (Number.isNaN(balance)) {
			return;
		}

		accountsCollection.update(accountId, (item) => {
			item.balance = balance;
		});
	};

	const handleUpdateCreditLimit = (accountId: string, newLimit: string) => {
		const limit = Number.parseFloat(newLimit);
		if (Number.isNaN(limit) || limit < 0) {
			return;
		}

		accountsCollection.update(accountId, (item) => {
			item.creditLimit = limit;
		});
	};

	const handleUpdateInterestRate = (accountId: string, newRate: string) => {
		const rate = Number.parseFloat(newRate);
		if (Number.isNaN(rate) || rate < 0) {
			return;
		}

		accountsCollection.update(accountId, (item) => {
			item.interestRate = rate;
		});
	};

	const handleUpdateIcon = (accountId: string, icon: string) => {
		accountsCollection.update(accountId, (item) => {
			item.icon = icon;
		});
	};

	const handleUpdateColor = (accountId: string, color: string) => {
		accountsCollection.update(accountId, (item) => {
			item.color = color;
		});
	};

	const handleStartEditingName = (accountId: string, currentName: string) => {
		setEditingAccountId(accountId);
		setEditingAccountName(currentName);
	};

	const handleSaveAccountName = (accountId: string) => {
		if (!editingAccountName.trim()) {
			alert("Account name cannot be empty");
			return;
		}

		accountsCollection.update(accountId, (item) => {
			item.name = editingAccountName.trim();
		});
		setEditingAccountId(null);
		setEditingAccountName("");
	};

	const handleCancelEditingName = () => {
		setEditingAccountId(null);
		setEditingAccountName("");
	};

	// Calculate totals by account type
	const totalsByType = accounts.reduce(
		(acc, account) => {
			if (!acc[account.type]) {
				acc[account.type] = 0;
			}
			acc[account.type] = (acc[account.type] ?? 0) + account.balance;
			return acc;
		},
		{} as Record<string, number>,
	);

	const netWorth = accounts.reduce((sum, account) => {
		// Credit cards, loans, and mortgages are typically negative (debt)
		// For credit cards, balance represents what you owe
		if (
			account.type === "credit" ||
			account.type === "loan" ||
			account.type === "mortgage"
		) {
			return sum - Math.abs(account.balance);
		}
		return sum + account.balance;
	}, 0);

	// Sort accounts by order
	const sortedAccounts = [...accounts].sort((a, b) => a.order - b.order);

	// Group accounts by type
	const groupedAccounts = sortedAccounts.reduce(
		(acc, account) => {
			if (!acc[account.type]) {
				acc[account.type] = [];
			}
			acc[account.type]?.push(account);
			return acc;
		},
		{} as Record<string, Account[]>,
	);

	return (
		<div className="flex flex-col p-10 max-w-6xl mx-auto">
			<h1 className="text-3xl font-bold mb-8">Accounts</h1>

			{/* Summary Section */}
			<div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<div className="text-sm text-gray-600 mb-1">Total Accounts</div>
						<div className="text-2xl font-bold text-gray-900">
							{accounts.length}
						</div>
					</div>
					<div>
						<div className="text-sm text-gray-600 mb-1">Net Worth</div>
						<div
							className={`text-2xl font-bold ${
								netWorth >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							${netWorth.toFixed(2)}
						</div>
					</div>
					<div>
						<div className="text-sm text-gray-600 mb-1">Assets</div>
						<div className="text-2xl font-bold text-green-600">
							$
							{(
								(totalsByType.checking || 0) +
								(totalsByType.savings || 0) +
								(totalsByType.investment || 0) +
								(totalsByType.other || 0)
							).toFixed(2)}
						</div>
					</div>
					<div>
						<div className="text-sm text-gray-600 mb-1">Liabilities</div>
						<div className="text-2xl font-bold text-red-600">
							$
							{(
								Math.abs(totalsByType.credit || 0) +
								Math.abs(totalsByType.loan || 0) +
								Math.abs(totalsByType.mortgage || 0)
							).toFixed(2)}
						</div>
					</div>
				</div>
			</div>

			{/* Add New Account Section */}
			<div className="mb-8 p-6 bg-white border rounded-lg shadow-sm">
				<h2 className="text-xl font-semibold mb-4">Add New Account</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label htmlFor="account-name">Account Name</Label>
						<Input
							id={accountNameId}
							type="text"
							placeholder="e.g., Chase Checking"
							value={newAccountName}
							onChange={(e) => setNewAccountName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleAddAccount();
								}
							}}
							className="mt-1"
						/>
					</div>

					<div>
						<Label htmlFor="account-type">Account Type</Label>
						<Select value={newAccountType} onValueChange={setNewAccountType}>
							<SelectTrigger id={accountTypeId} className="mt-1">
								<SelectValue placeholder="Select account type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="checking">Checking Account</SelectItem>
								<SelectItem value="savings">Savings Account</SelectItem>
								<SelectItem value="investment">Investment Account</SelectItem>
								<SelectItem value="other">Other Asset</SelectItem>
								<SelectItem value="credit">Credit Card</SelectItem>
								<SelectItem value="loan">Loan</SelectItem>
								<SelectItem value="mortgage">Mortgage</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="account-balance">
							{newAccountType === "credit" ||
							newAccountType === "loan" ||
							newAccountType === "mortgage"
								? "Current Balance Owed"
								: newAccountType === "other"
									? "Current Value"
									: "Current Balance"}
						</Label>
						<Input
							id={accountBalanceId}
							type="number"
							step="1.00"
							placeholder="0.00"
							value={newAccountBalance}
							onChange={(e) => setNewAccountBalance(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleAddAccount();
								}
							}}
							className="mt-1"
						/>
					</div>

					{newAccountType === "credit" && (
						<div>
							<Label htmlFor="credit-limit">Credit Limit (Optional)</Label>
							<Input
								id={creditLimitId}
								type="number"
								step="0.01"
								placeholder="0.00"
								value={newAccountCreditLimit}
								onChange={(e) => setNewAccountCreditLimit(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddAccount();
									}
								}}
								className="mt-1"
							/>
						</div>
					)}

					{(newAccountType === "loan" || newAccountType === "mortgage") && (
						<div>
							<Label htmlFor="interest-rate">Interest Rate % (Optional)</Label>
							<Input
								id={interestRateId}
								type="number"
								step="0.01"
								placeholder="0.00"
								value={newAccountInterestRate}
								onChange={(e) => setNewAccountInterestRate(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddAccount();
									}
								}}
								className="mt-1"
							/>
						</div>
					)}

					<div className="flex items-end gap-2">
						<div>
							<Label>Icon & Color</Label>
							<IconColorPicker
								icon={newAccountIcon}
								color={newAccountColor}
								onIconChange={setNewAccountIcon}
								onColorChange={setNewAccountColor}
								open={openPopoverId === "new"}
								onOpenChange={(open) => setOpenPopoverId(open ? "new" : null)}
								triggerClassName="h-10 w-10 p-0 rounded-full mt-1"
							/>
						</div>
						<Button
							onClick={handleAddAccount}
							className="flex items-center gap-2"
						>
							<Plus size={16} />
							Add Account
						</Button>
					</div>
				</div>
			</div>

			{/* Accounts List Section */}
			<div className="mb-8 p-6 bg-white border rounded-lg shadow-sm">
				<h2 className="text-xl font-semibold mb-4">Your Accounts</h2>

				{sortedAccounts.length > 0 ? (
					<div className="space-y-6">
						{Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
							<div key={type}>
								<h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
									{type === "checking" && <Landmark size={20} />}
									{type === "savings" && <PiggyBank size={20} />}
									{type === "investment" && <TrendingUp size={20} />}
									{type === "other" && <Package size={20} />}
									{type === "credit" && <CreditCard size={20} />}
									{type === "loan" && <Wallet size={20} />}
									{type === "mortgage" && <Home size={20} />}
									{ACCOUNT_TYPE_LABELS[type]}
								</h3>
								<div className="space-y-2">
									{typeAccounts.map((account) => (
										<div
											key={account.id}
											className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
										>
											<IconColorPicker
												icon={account.icon || DEFAULT_ICON}
												color={account.color || DEFAULT_COLOR}
												onIconChange={(icon) =>
													handleUpdateIcon(account.id, icon)
												}
												onColorChange={(color) =>
													handleUpdateColor(account.id, color)
												}
												open={openPopoverId === account.id}
												onOpenChange={(open) =>
													setOpenPopoverId(open ? account.id : null)
												}
												triggerClassName="h-12 w-12 p-0 m-0 rounded-full hover:bg-gray-200"
											/>
											<div className="flex-1">
												{editingAccountId === account.id ? (
													<Input
														type="text"
														value={editingAccountName}
														onChange={(e) =>
															setEditingAccountName(e.target.value)
														}
														onBlur={() => handleSaveAccountName(account.id)}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																handleSaveAccountName(account.id);
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
															handleStartEditingName(account.id, account.name)
														}
													>
														{account.name}
													</button>
												)}
												<div className="text-sm text-gray-500">
													{ACCOUNT_TYPE_LABELS[account.type]}
												</div>
											</div>

											<div className="flex flex-col md:flex-row gap-2 items-end">
												<div className="w-32">
													<Label className="text-xs">Balance</Label>
													<Input
														type="number"
														step="0.01"
														value={account.balance}
														onChange={(e) =>
															handleUpdateBalance(account.id, e.target.value)
														}
														className="text-right mt-1"
													/>
												</div>

												{account.type === "credit" && (
													<div className="w-32">
														<Label className="text-xs">Credit Limit</Label>
														<Input
															type="number"
															step="0.01"
															value={account.creditLimit || ""}
															onChange={(e) =>
																handleUpdateCreditLimit(
																	account.id,
																	e.target.value,
																)
															}
															placeholder="Optional"
															className="text-right mt-1"
														/>
													</div>
												)}

												{(account.type === "loan" ||
													account.type === "mortgage") && (
													<div className="w-32">
														<Label className="text-xs">Interest Rate %</Label>
														<Input
															type="number"
															step="0.01"
															value={account.interestRate || ""}
															onChange={(e) =>
																handleUpdateInterestRate(
																	account.id,
																	e.target.value,
																)
															}
															placeholder="Optional"
															className="text-right mt-1"
														/>
													</div>
												)}
											</div>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeleteAccount(account.id)}
												className="flex items-center gap-1 hover:text-red-500"
												disabled={account.isDefault}
											>
												<Trash2 size={16} />
											</Button>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">
						No accounts yet. Add your first account above!
					</div>
				)}
			</div>
		</div>
	);
}
