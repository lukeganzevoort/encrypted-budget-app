import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BarChart3,
	Building2,
	Lock,
	PieChart,
	Receipt,
	Shield,
	Split,
	TrendingUp,
	Upload,
	Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	const features = [
		{
			icon: <PieChart className="w-12 h-12 text-cyan-400" />,
			title: "Overview Dashboard",
			description:
				"Visual spending breakdown with interactive charts. Track income, expenses, and net balance with beautiful visualizations.",
		},
		{
			icon: <Wallet className="w-12 h-12 text-cyan-400" />,
			title: "Budget Management",
			description:
				"Create and manage budget categories with custom icons and colors. Set monthly budgets and track spending progress.",
		},
		{
			icon: <Receipt className="w-12 h-12 text-cyan-400" />,
			title: "Transaction Management",
			description:
				"Import transactions from CSV files, categorize expenses, and split transactions across multiple budget categories.",
		},
		{
			icon: <Building2 className="w-12 h-12 text-cyan-400" />,
			title: "Multi-Account Support",
			description:
				"Track multiple accounts including checking, savings, credit cards, loans, and investments. Monitor your net worth.",
		},
		{
			icon: <Shield className="w-12 h-12 text-cyan-400" />,
			title: "Privacy First",
			description:
				"Your financial data stays secure. Built with encryption in mind to protect your sensitive information.",
		},
		{
			icon: <TrendingUp className="w-12 h-12 text-cyan-400" />,
			title: "Smart Analytics",
			description:
				"Get insights into your spending patterns with month-over-month comparisons and category breakdowns.",
		},
	];

	const quickFeatures = [
		{
			icon: <Upload className="w-6 h-6" />,
			text: "CSV Import",
		},
		{
			icon: <Split className="w-6 h-6" />,
			text: "Split Transactions",
		},
		{
			icon: <BarChart3 className="w-6 h-6" />,
			text: "Visual Reports",
		},
		{
			icon: <Lock className="w-6 h-6" />,
			text: "Encrypted Storage",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Development Banner */}
			<div className="bg-amber-500/20 border-b border-amber-500/30 py-3 px-6 text-center">
				<p className="text-amber-300 text-sm font-medium">
					🚧 Currently in Development - Try the demo below
				</p>
			</div>

			{/* Hero Section */}
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="mb-8">
						<h1 className="text-5xl md:text-7xl font-black text-white mb-4 [letter-spacing:-0.08em]">
							<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
								Encrypted Budget
							</span>
						</h1>
						<p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
							Take control of your finances with privacy-first budgeting
						</p>
						<p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
							A modern budget management app that helps you track income, manage
							expenses, and achieve your financial goals—all while keeping your
							data secure and private.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
						<Link
							to="/app/overview"
							className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
						>
							Try Demo
						</Link>
					</div>

					{/* Quick Features */}
					<div className="flex flex-wrap items-center justify-center gap-6 text-gray-400">
						{quickFeatures.map((feature) => (
							<div
								key={feature.text}
								className="flex items-center gap-2 text-sm"
							>
								<div className="text-cyan-400">{feature.icon}</div>
								<span>{feature.text}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="text-center mb-12">
					<h2 className="text-4xl font-bold text-white mb-4">
						Everything you need to manage your budget
					</h2>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto">
						Powerful features designed to help you understand and control your
						finances
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
						>
							<div className="mb-4">{feature.icon}</div>
							<h3 className="text-xl font-semibold text-white mb-3">
								{feature.title}
							</h3>
							<p className="text-gray-400 leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 px-6">
				<div className="max-w-4xl mx-auto bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-12 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Ready to take control of your finances?
					</h2>
					<p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
						Start tracking your budget today. Import your transactions, set up
						your categories, and see where your money is going.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							to="/app/overview"
							className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
						>
							Try Demo
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
