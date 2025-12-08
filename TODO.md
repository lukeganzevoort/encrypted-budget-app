# Goal: Publish app as a SaaS product

## Timeline: 3 months

**Month 1: Phase 1 - MVP for Personal Use**

December, 2025

- [ ] Weeks 1-2: Core features + Database migration to Turso
- [ ] Week 3: Encryption implementation + CSV improvements
- [ ] Week 4: Analytics, reporting, and Phase 1 polish

**Month 2: Phase 2 - Multi-User SaaS**

January, 2026

- [ ] Week 1: Authentication system + API foundation
- [ ] Week 2: Landing & marketing pages
- [ ] Weeks 3-4: Multi-tenant backend + Beta launch

**Month 3: Phase 3 - Monetization & Launch**

February, 2026

- [ ] Week 1: Stripe integration + subscription tiers
- [ ] Week 2: PWA conversion + advanced features
- [ ] Weeks 3-4: Beta feedback implementation + Public launch

**Target Launch Date: March 4, 2026**

# Phase 1: Use product for self-use (MVP - Personal Use)

## Core Features:

- [x] Add icons and colors to budgets
- [x] Allow split transactions between multiple budgets
- [ ] Allow linked transactions between multiple transactions
- [x] Allow for account specification when uploading transactions
- [ ] Allow for multiple csv's to be uploaded at once
- [ ] Finalize UI pages (login, overview, budget, transactions)
- [x] Add colors on the budget page
- [x] Fix pie chart labels
- [ ] Allow creating rules for transactions to be automatically categorized
- [ ] Allow specifying a vendor for transactions
- [ ] Make budget amounts roll over to the next month
- [ ] Allow for manual transaction entry
- [ ] Add recurring transactions feature (monthly bills, subscriptions)
- [ ] Mobile optimization
- [x] Add income default budget category
- [x] Add cash default account

## Database & Infrastructure:

- [ ] Create and connect database using Turso DB for personal use
- [ ] Create a single login to authenticate
- [ ] Add encryption to data (local and database)
- [ ] Set up proper data backup system
- [ ] Publish app on Netlify with Turso DB

## Data Import:

- [ ] Parse PDF transactions and upload to database (or somehow get that data into the app)
- [ ] CSV import validation and error handling
- [ ] Transaction deduplication logic

## Analytics & Reporting:

- [ ] Add time-based filtering (month, quarter, year)
- [ ] Create budget vs. actual spending comparison view
- [ ] Add income tracking and visualization
- [ ] Export reports to PDF/Excel

# Phase 2: Multi-User SaaS (Public Launch)

## Authentication & User Management:

- [ ] Replace single login with full authentication system (OAuth support)
- [ ] Create signup page with email verification
- [ ] Create login page
- [ ] User profile & settings page
- [ ] Session management and security

## Landing & Marketing Pages:

- [ ] Create landing page with value proposition
- [ ] Create pricing page (Free, Pro, Business tiers)
- [ ] Create about/features page
- [ ] Create FAQ page
- [ ] Add testimonials section
- [ ] Blog setup for content marketing

## Backend & Database:

- [ ] Signup creates a new Turso DB database for the user (or multi-tenant approach)
- [ ] Build REST/GraphQL API for all operations
- [ ] Implement rate limiting and API security
- [ ] Set up proper error logging (Sentry or similar)

## User Onboarding:

- [ ] Create onboarding tutorial/walkthrough
- [ ] Explain the budget system and how it works
- [ ] Add sample data for new users
- [ ] In-app tooltips and help

## Beta & Feedback:

- [ ] Get beta testers
- [ ] Get feedback on the app
- [ ] Implement analytics to track user behavior
- [ ] Set up feedback collection system

# Phase 3: Monetization & Advanced Features

## Payment System:

- [ ] Integrate Stripe for subscription payments
- [ ] Set up subscription tiers (Free, Pro, Business)
- [ ] Trial period implementation (14-day free trial)
- [ ] Billing dashboard and invoice generation
- [ ] Upgrade/downgrade flows
- [ ] Handle failed payments and dunning

## Advanced Features:

- [ ] Allow scanning of receipts and uploading to database
- [ ] Allow for bank account connections and syncing of transactions
- [ ] Budget sharing between users (families, couples)
- [ ] Allow users to create multiple budgets
- [ ] Smart transaction categorization (offline only for privacy reasons)

## Mobile:

- [ ] Convert to Progressive Web App (PWA)
- [ ] Add offline support
- [ ] Push notifications for bill reminders
- [ ] Consider native mobile apps (iOS/Android)

# Ideas:

## AI & Automation:

- [ ] AI-powered spending insights and recommendations (offline only for privacy reasons)
- [ ] Anomaly detection (unusual spending alerts)
- [ ] Predictive budgeting based on history

## Integrations:

- [ ] QuickBooks/FreshBooks export
- [ ] Tax preparation exports (1099, W2)
- [ ] Calendar integration for bill due dates
- [ ] Email receipt parsing
- [ ] Webhooks & API for developers

## Collaboration:

- [ ] Team/household budgets with permissions
- [ ] Comments on transactions
- [ ] Activity feed
- [ ] Approval workflows (for business use)

## Marketing & Growth:

- [ ] SEO optimization
- [ ] Email marketing campaigns
- [ ] Referral program (give $10, get $10)
- [ ] Affiliate program
- [ ] Content marketing & blog posts

## Customer Support:

- [ ] Knowledge base & documentation
- [ ] Video tutorials
- [ ] Customer support system (Intercom/Zendesk)
- [ ] Live chat support

## Performance & Monitoring:

- [ ] Performance optimization and caching
- [ ] Uptime monitoring
- [ ] Error tracking and alerting
- [ ] User analytics (Mixpanel/Amplitude)
- [ ] A/B testing platform

## Enterprise Features:

- [ ] White-label options
- [ ] Custom branding
- [ ] SSO (Single Sign-On)
- [ ] Advanced permissions & roles
- [ ] API access with rate limits
- [ ] Dedicated support

## Compliance & Legal:

- [ ] GDPR compliance implementation
- [ ] CCPA compliance implementation
- [ ] SOC 2 certification
- [ ] Security audits (quarterly)
- [ ] Penetration testing
- [ ] Terms of Service updates
- [ ] Privacy Policy updates

## Transaction Management:

- [ ] Allow pre-adding of transactions to the database and then automatically linking them when the transaction is uploaded
- [ ] Allow for automated categorization of transactions if no rules are met
- [ ] Transaction tagging system
- [ ] Attach notes and files to transactions
- [ ] Bulk transaction editing

## Reporting:

- [ ] Custom report builder
- [ ] Spending trends and forecasting
- [ ] Net worth tracking
- [ ] Cash flow projections
- [ ] Year-over-year comparisons

## Social Features:

- [ ] Community budget templates
- [ ] Financial literacy content

## Advanced Budgeting:

- [ ] Zero-based budgeting mode
- [ ] Envelope budgeting system
- [ ] 50/30/20 budget template
- [ ] Budget rollover customization (per category)

## Technical Improvements:

- [ ] Data import from competitors
- [ ] Real-time collaboration features
- [ ] Data export tools
