import { Link } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	ClipboardType,
	Database,
	Home,
	Menu,
	Network,
	PieChart,
	Receipt,
	SquareFunction,
	StickyNote,
	Table,
	Wallet,
	X,
} from "lucide-react";
import { useState } from "react";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [groupedExpanded, setGroupedExpanded] = useState<
		Record<string, boolean>
	>({});

	return (
		<>
			<header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<h1 className="ml-4 text-xl font-semibold">
						<Link to="/" className="hover:text-cyan-400 transition-colors">
							Budget App
						</Link>
					</h1>
				</div>
				<div className="hidden md:flex items-center gap-4">
					<Link
						to="/app/overview"
						className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
						activeProps={{
							className:
								"px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors text-sm",
						}}
					>
						Overview
					</Link>
					<Link
						to="/app/budget"
						className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
						activeProps={{
							className:
								"px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors text-sm",
						}}
					>
						Budget
					</Link>
					<Link
						to="/app/transactions"
						className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
						activeProps={{
							className:
								"px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors text-sm",
						}}
					>
						Transactions
					</Link>
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					{/* Budget App Links Start */}
					<div className="mt-4 mb-2 px-3">
						<h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
							Budget App
						</h3>
					</div>

					<Link
						to="/app/overview"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<PieChart size={20} />
						<span className="font-medium">Overview</span>
					</Link>

					<Link
						to="/app/budget"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Wallet size={20} />
						<span className="font-medium">Budget</span>
					</Link>

					<Link
						to="/app/transactions"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Receipt size={20} />
						<span className="font-medium">Transactions</span>
					</Link>

					{/* Budget App Links End */}

					<div className="mt-6 mb-2 px-3 border-t border-gray-700 pt-4">
						<h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
							Demo Pages
						</h3>
					</div>

					{/* Demo Links Start */}

					<Link
						to="/demo/start/server-funcs"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<SquareFunction size={20} />
						<span className="font-medium">Start - Server Functions</span>
					</Link>

					<Link
						to="/demo/start/api-request"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Network size={20} />
						<span className="font-medium">Start - API Request</span>
					</Link>

					<div className="flex flex-row justify-between">
						<Link
							to="/demo/start/ssr"
							onClick={() => setIsOpen(false)}
							className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
							activeProps={{
								className:
									"flex-1 flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
							}}
						>
							<StickyNote size={20} />
							<span className="font-medium">Start - SSR Demos</span>
						</Link>
						<button
							type="button"
							className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
							onClick={() =>
								setGroupedExpanded((prev) => ({
									...prev,
									StartSSRDemo: !prev.StartSSRDemo,
								}))
							}
						>
							{groupedExpanded.StartSSRDemo ? (
								<ChevronDown size={20} />
							) : (
								<ChevronRight size={20} />
							)}
						</button>
					</div>
					{groupedExpanded.StartSSRDemo && (
						<div className="flex flex-col ml-4">
							<Link
								to="/demo/start/ssr/spa-mode"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
								}}
							>
								<StickyNote size={20} />
								<span className="font-medium">SPA Mode</span>
							</Link>

							<Link
								to="/demo/start/ssr/full-ssr"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
								}}
							>
								<StickyNote size={20} />
								<span className="font-medium">Full SSR</span>
							</Link>

							<Link
								to="/demo/start/ssr/data-only"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
								}}
							>
								<StickyNote size={20} />
								<span className="font-medium">Data Only</span>
							</Link>
						</div>
					)}

					<Link
						to="/demo/db-chat"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Database size={20} />
						<span className="font-medium">DB Chat</span>
					</Link>

					<Link
						to="/demo/form/simple"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<ClipboardType size={20} />
						<span className="font-medium">Simple Form</span>
					</Link>

					<Link
						to="/demo/form/address"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<ClipboardType size={20} />
						<span className="font-medium">Address Form</span>
					</Link>

					<Link
						to="/demo/table"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Table size={20} />
						<span className="font-medium">TanStack Table</span>
					</Link>

					<Link
						to="/demo/tanstack-query"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Network size={20} />
						<span className="font-medium">TanStack Query</span>
					</Link>

					{/* Demo Links End */}
				</nav>
			</aside>
		</>
	);
}
