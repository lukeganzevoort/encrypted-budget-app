# Encrypted Budget App

A modern, privacy-focused budget management application built with React and TypeScript. Track your income, expenses, and budgets with a beautiful, intuitive interface.

## Features

### 📊 Overview Dashboard

- Visual spending breakdown with interactive pie charts
- Monthly statistics (income, expenses, net balance)
- Category-wise spending analysis
- Month/year filtering for historical data

### 💰 Budget Management

- Create and manage budget categories with custom icons and colors
- Set monthly income and budget amounts
- Track budgeted vs. actual spending
- Visual progress indicators for each category
- Month-specific budget planning

### 💳 Transaction Management

- Import transactions from CSV files
- Manual transaction categorization
- Split transactions across multiple categories
- Support for multiple accounts
- Income and expense tracking
- Transaction deduplication

### 🏦 Account Management

- Multiple account types (Checking, Savings, Investment, Credit Card, Loan, Mortgage)
- Track account balances and net worth
- Credit limit tracking for credit cards
- Interest rate tracking for loans and mortgages
- Custom icons and colors for accounts

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19)
- **Routing:** [TanStack Router](https://tanstack.com/router)
- **Database:** [TanStack React DB](https://tanstack.com/react-db) (local database)
- **State Management:** [TanStack Query](https://tanstack.com/query)
- **Forms:** [TanStack Form](https://tanstack.com/form)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Deployment:** [Netlify](https://www.netlify.com/)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd encrypted-budget-app
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
pnpm build
```

### Preview Production Build

```bash
npm run serve
# or
pnpm serve
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run test` - Run tests
- `npm run format` - Format code with Biome
- `npm run lint` - Lint code with Biome
- `npm run check` - Check code with Biome (format + lint)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   └── ...
├── routes/             # TanStack Router routes
│   ├── app.overview.tsx
│   ├── app.budget.tsx
│   ├── app.transactions.tsx
│   └── app.accounts.tsx
├── db-collections/     # Database collections and schemas
├── lib/                # Utility functions and helpers
├── integrations/       # Third-party integrations
└── router.tsx          # Router configuration
```

## Roadmap

See [TODO.md](./TODO.md) for the complete roadmap and planned features.

### Current Phase: MVP for Personal Use

- Core budgeting features ✅
- Transaction management ✅
- Account management ✅
- CSV import ✅

### Upcoming

- Database migration to Turso
- Encryption implementation
- Multi-user SaaS support
- Authentication system
- Advanced analytics and reporting

## Development

### Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting. Run `npm run check` before committing to ensure code quality.

### Adding UI Components

This project uses Shadcn UI. To add new components:

```bash
npx shadcn@latest add <component-name>
```
