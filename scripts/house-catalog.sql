-- Applied to tpoqiojudhktlucnbecm after wiping test/fake listings.
-- 30 house tools so suggest works on day 1. Clicks on house rows are not charged.

delete from private.suggest_cache;
delete from public.listings;

insert into public.listings (
  name, kind, url, tagline, description, tags, status, credit_balance_usd, house, profile, profiled_at
) values
(
  'Stripe', 'startup', 'https://stripe.com',
  'Payments infrastructure for internet businesses',
  'Stripe is the payments stack for checkout, billing, and invoicing. Add it when a product can be used but cannot collect money cleanly.',
  '{house}', 'active', 20, true,
  '{"sells":"Checkout, billing, and payouts for internet businesses","serves":"Founders who need to charge customers","helps_with":["payments","usage billing","checkout","invoicing","subscriptions"],"proof":["Checkout, Billing, and Connect"],"avoid":["A payments clone","A consumer bank app"]}'::jsonb,
  now()
),
(
  'Clerk', 'startup', 'https://clerk.com',
  'Authentication and user management for modern apps',
  'Clerk ships auth, orgs, and user management with drop-in components. A fit when an app still has a thin login story.',
  '{house}', 'active', 20, true,
  '{"sells":"Auth, organizations, and user management","serves":"Product teams shipping multiplayer apps","helps_with":["auth","user management","organizations","SSO"],"proof":["Drop-in components for Next.js and React"],"avoid":["An auth clone","A consumer social login toy"]}'::jsonb,
  now()
),
(
  'Resend', 'startup', 'https://resend.com',
  'Email API for transactional product mail',
  'Resend sends transactional and product email with a simple developer workflow. Helps a new app send onboarding, receipts, and magic links.',
  '{house}', 'active', 20, true,
  '{"sells":"Transactional email API for product mail","serves":"Developers who need reliable product email","helps_with":["transactional email","magic links","receipts","onboarding mail"],"proof":["API-first email for modern stacks"],"avoid":["A newsletter platform","A support inbox"]}'::jsonb,
  now()
),
(
  'PostHog', 'startup', 'https://posthog.com',
  'Product analytics, session replay, and feature flags',
  'PostHog is product analytics with replay, flags, and funnels. The partner for a product that ships but cannot see who converts.',
  '{house}', 'active', 20, true,
  '{"sells":"Product analytics, replay, and feature flags","serves":"Teams that need to see activation and drop-off","helps_with":["analytics","session replay","feature flags","funnels"],"proof":["Open product OS with replay and flags"],"avoid":["A web-only pageview tracker","A marketing pixel"]}'::jsonb,
  now()
),
(
  'Vercel', 'startup', 'https://vercel.com',
  'Frontend cloud for shipping Next.js and modern web apps',
  'Vercel hosts frontend apps with preview URLs, edge, and analytics. Complements a generated app that now needs reliable deploys.',
  '{house}', 'active', 20, true,
  '{"sells":"Hosting, previews, and edge for frontend apps","serves":"Teams shipping Next.js and modern web apps","helps_with":["deploy","preview URLs","frontend hosting","edge"],"proof":["Preview deployments from git"],"avoid":["A generic VPS","A website builder"]}'::jsonb,
  now()
),
(
  'Neon', 'startup', 'https://neon.tech',
  'Serverless Postgres with branching for developers',
  'Neon is serverless Postgres with branching and scale-to-zero. Complements an app that needs a real database without a cluster.',
  '{house}', 'active', 20, true,
  '{"sells":"Serverless Postgres with branching","serves":"Developers who want production Postgres without ops","helps_with":["postgres","database branching","serverless data"],"proof":["Scale-to-zero Postgres with branches"],"avoid":["A Firebase clone","A spreadsheet database"]}'::jsonb,
  now()
),
(
  'Railway', 'startup', 'https://railway.app',
  'Deploy backends, databases, and workers without ops theater',
  'Railway deploys backends, databases, and workers from git. Helps when a generated frontend needs a real API, cron, or Postgres.',
  '{house}', 'active', 20, true,
  '{"sells":"One-click deploys for backends, workers, and data","serves":"Builders who need production infra without a platform team","helps_with":["backend deploy","workers","cron","databases"],"proof":["Git-based deploys for full stacks"],"avoid":["A frontend-only host","A no-code site builder"]}'::jsonb,
  now()
),
(
  'Cal.com', 'startup', 'https://cal.com',
  'Open scheduling infrastructure for meetings',
  'Cal.com is open scheduling for sales, hiring, and success calls. Complements a product that still says “email us” for demos.',
  '{house}', 'active', 20, true,
  '{"sells":"Scheduling infrastructure for meetings","serves":"Teams that book demos, hiring, and success calls","helps_with":["scheduling","demo booking","calendar","appointments"],"proof":["Open scheduling with embeds and APIs"],"avoid":["A plumber booking widget as the product","A generic form"]}'::jsonb,
  now()
),
(
  'Kit', 'startup', 'https://kit.com',
  'Email marketing for creators and indie businesses',
  'Kit is email marketing for creators. Helps a founder turn visitors into a list instead of relying on one launch post.',
  '{house}', 'active', 20, true,
  '{"sells":"Email marketing and automations for creators","serves":"Founders and creators building an owned audience","helps_with":["email marketing","owned audience","automations","newsletters"],"proof":["Creator-first email and landing pages"],"avoid":["Transactional product email","A CRM for enterprise sales"]}'::jsonb,
  now()
),
(
  'Attio', 'startup', 'https://attio.com',
  'CRM that starts from your relationships, not a pipeline template',
  'Attio is a flexible CRM on real relationship data. Useful when a team outgrows a spreadsheet but is not ready for Salesforce.',
  '{house}', 'active', 20, true,
  '{"sells":"A flexible CRM built on real relationships","serves":"Early teams that outgrew a spreadsheet","helps_with":["CRM","pipeline","relationship data","deal tracking"],"proof":["CRM that starts from your existing data"],"avoid":["A second CRM when they already have one","Enterprise Salesforce replacement theater"]}'::jsonb,
  now()
),
(
  'Linear', 'startup', 'https://linear.app',
  'Issue tracking built for high-performance software teams',
  'Linear is the issue tracker for product and engineering teams that want speed and clean roadmaps. A partner when a builder needs real project ops.',
  '{house}', 'active', 20, true,
  '{"sells":"Issue tracking and roadmaps for product teams","serves":"Engineering and product teams that want fast ops","helps_with":["issue tracking","roadmaps","sprints","product ops"],"proof":["Keyboard-first issue tracker"],"avoid":["A generic todo app","A clone of Linear"]}'::jsonb,
  now()
),
(
  'Figma', 'startup', 'https://www.figma.com',
  'Collaborative interface design for product teams',
  'Figma is the design tool for interfaces, prototypes, and systems. The right partner when generated UI still needs craft and a system.',
  '{house}', 'active', 20, true,
  '{"sells":"Collaborative interface design and prototypes","serves":"Product teams that need craft beyond generated UI","helps_with":["interface design","prototypes","design systems","brand"],"proof":["The default tool for product design teams"],"avoid":["A website builder","A slide tool"]}'::jsonb,
  now()
),
(
  'Intercom', 'startup', 'https://www.intercom.com',
  'AI customer service and in-product messaging',
  'Intercom is the inbox and messenger for support and onboarding. A growth partner when users have no place to get unstuck.',
  '{house}', 'active', 20, true,
  '{"sells":"In-product messaging and customer support","serves":"Teams that need to talk to users inside the product","helps_with":["support","onboarding","in-app chat","help center"],"proof":["Messenger and inbox for product companies"],"avoid":["A second support inbox","A marketing newsletter"]}'::jsonb,
  now()
),
(
  'Typeform', 'startup', 'https://www.typeform.com',
  'Conversational forms for research and lead capture',
  'Typeform makes forms that feel like a conversation. Complements a site that needs research, waitlists, or onboarding questions.',
  '{house}', 'active', 20, true,
  '{"sells":"Conversational forms for research and leads","serves":"Teams capturing waitlists, research, and intake","helps_with":["forms","waitlists","research","lead capture"],"proof":["Forms that feel like a conversation"],"avoid":["A full product survey suite they already have","A checkout form"]}'::jsonb,
  now()
),
(
  'Ahrefs', 'startup', 'https://ahrefs.com',
  'SEO data for keywords, links, and content gaps',
  'Ahrefs is the SEO toolkit for keywords, backlinks, and content gaps. A growth partner when a product has users from social but no search plan.',
  '{house}', 'active', 20, true,
  '{"sells":"SEO data for keywords, links, and content gaps","serves":"Founders who need demand from search","helps_with":["SEO","keywords","backlinks","content gaps"],"proof":["Crawler and keyword tools used by SEO teams"],"avoid":["A social scheduler","A generic analytics suite"]}'::jsonb,
  now()
),
(
  'Plaid', 'startup', 'https://plaid.com',
  'Bank connections and financial data APIs',
  'Plaid connects apps to bank accounts and financial data. The partner when a product wants money movement or balances without becoming a bank.',
  '{house}', 'active', 20, true,
  '{"sells":"Bank connections and financial data APIs","serves":"Products that need account linking or KYC data","helps_with":["bank linking","financial data","KYC","money movement"],"proof":["The default bank-connect API in fintech"],"avoid":["A consumer budgeting app","A payments processor"]}'::jsonb,
  now()
),
(
  'Mercury', 'startup', 'https://mercury.com',
  'Banking built for startups',
  'Mercury is a bank for startups: accounts, cards, and treasury. Complements a company that can invoice but still mixes founder and company money.',
  '{house}', 'active', 20, true,
  '{"sells":"Startup banking, cards, and treasury","serves":"Incorporated startups that need a company account","helps_with":["startup banking","cards","treasury","company money"],"proof":["Banking built for startups"],"avoid":["A consumer bank","A payments API"]}'::jsonb,
  now()
),
(
  'Deel', 'startup', 'https://www.deel.com',
  'Global payroll and contractor compliance',
  'Deel hires and pays people in many countries with compliance baked in. Complements a company that wants remote talent without a legal team.',
  '{house}', 'active', 20, true,
  '{"sells":"Global payroll and contractor compliance","serves":"Companies hiring across borders","helps_with":["global payroll","contractors","compliance","remote hiring"],"proof":["Hire and pay in many countries"],"avoid":["A US-only payroll toy","A job board"]}'::jsonb,
  now()
),
(
  'Carta', 'startup', 'https://carta.com',
  'Cap tables, equity, and fundraising ops',
  'Carta is the cap table and equity platform for private companies. A partner when founders still track ownership in a spreadsheet.',
  '{house}', 'active', 20, true,
  '{"sells":"Cap tables, equity, and fundraising ops","serves":"Private companies that need a clean cap table","helps_with":["cap table","equity","fundraising","409A"],"proof":["The default cap table for venture-backed companies"],"avoid":["A consumer brokerage","A generic spreadsheet"]}'::jsonb,
  now()
),
(
  'Clerky', 'startup', 'https://www.clerky.com',
  'Startup legal paperwork for formation and fundraising',
  'Clerky automates formation, SAFEs, and hiring docs for startups. Complements a live product that still has no clean company or IP assignment.',
  '{house}', 'active', 20, true,
  '{"sells":"Formation, SAFEs, and startup legal paperwork","serves":"Founders who need clean company and fundraising docs","helps_with":["formation","SAFEs","hiring docs","IP assignment"],"proof":["Startup legal paperwork without a full firm"],"avoid":["A general law firm directory","Consumer legal templates"]}'::jsonb,
  now()
),
(
  'Clay', 'startup', 'https://www.clay.com',
  'Enrichment and GTM workflows on top of your data',
  'Clay enriches leads and runs go-to-market workflows across tools. A growth partner when the founder still researches one tab at a time.',
  '{house}', 'active', 20, true,
  '{"sells":"Lead enrichment and GTM workflows","serves":"Founders doing outbound without an ops team","helps_with":["enrichment","outbound","GTM workflows","lead research"],"proof":["Waterfall enrichment across data providers"],"avoid":["A second CRM","A generic spreadsheet"]}'::jsonb,
  now()
),
(
  'Apollo.io', 'startup', 'https://www.apollo.io',
  'B2B contact data and outbound sequences',
  'Apollo is a B2B database and sequencer for outbound. Complements a product with a landing page but no repeatable way to book meetings.',
  '{house}', 'active', 20, true,
  '{"sells":"B2B contact data and outbound sequences","serves":"Teams that need a repeatable outbound motion","helps_with":["outbound","contact data","sequences","meeting booking"],"proof":["Database plus sequencer in one product"],"avoid":["A CRM they already live in","Consumer email"]}'::jsonb,
  now()
),
(
  'Convex', 'startup', 'https://www.convex.dev',
  'Reactive backend for products that stay in sync',
  'Convex is a reactive backend for TypeScript apps that need live data. A fit when a generated UI still has no durable multiplayer state.',
  '{house}', 'active', 20, true,
  '{"sells":"A reactive TypeScript backend with live data","serves":"Builders whose UI has no durable multiplayer state","helps_with":["realtime backend","multiplayer state","TypeScript backend"],"proof":["Queries and mutations that stay in sync"],"avoid":["A generic Postgres host","A website CMS"]}'::jsonb,
  now()
),
(
  'Mux', 'startup', 'https://www.mux.com',
  'Video infrastructure for apps that need playback at scale',
  'Mux is video infrastructure: encode, stream, and analytics. Complements a product that wants in-app video without becoming a streaming company.',
  '{house}', 'active', 20, true,
  '{"sells":"Encode, stream, and video analytics APIs","serves":"Products that need in-app video at scale","helps_with":["video infrastructure","streaming","video analytics"],"proof":["API for encode, playback, and quality"],"avoid":["A YouTube alternative","A marketing video editor"]}'::jsonb,
  now()
),
(
  'Crisp', 'startup', 'https://crisp.chat',
  'Shared inbox and live chat for small teams',
  'Crisp is a shared inbox and live chat for lean teams. Helps an early site capture leads and questions instead of losing them.',
  '{house}', 'active', 20, true,
  '{"sells":"Shared inbox and live chat for small teams","serves":"Early teams that need a simple place for questions","helps_with":["live chat","shared inbox","lead capture","support"],"proof":["Chat and inbox for lean teams"],"avoid":["Enterprise contact-center software","A second Intercom"]}'::jsonb,
  now()
),
(
  'beehiiv', 'startup', 'https://www.beehiiv.com',
  'Newsletter platform built for growth and monetization',
  'beehiiv is a newsletter platform with recommendations, ads, and paid tiers. A distribution partner when a product has a story but no owned audience.',
  '{house}', 'active', 20, true,
  '{"sells":"Newsletter publishing, growth, and monetization","serves":"Founders who need an owned audience","helps_with":["newsletters","owned audience","newsletter monetization"],"proof":["Recommendations, ads, and paid newsletters"],"avoid":["Transactional email","A blog CMS"]}'::jsonb,
  now()
),
(
  'Loom', 'startup', 'https://www.loom.com',
  'Async video for explaining product and process',
  'Loom is async video for walkthroughs, sales, and support. A partner when a complex product needs human explanation faster than docs.',
  '{house}', 'active', 20, true,
  '{"sells":"Async video for walkthroughs and support","serves":"Teams that explain product faster than they write docs","helps_with":["async video","walkthroughs","sales explainers","support videos"],"proof":["Record and share product walkthroughs"],"avoid":["A video hosting API","A webinar platform"]}'::jsonb,
  now()
),
(
  'Gusto', 'startup', 'https://gusto.com',
  'Payroll, benefits, and HR for small companies',
  'Gusto runs payroll, benefits, and HR for small US companies. The partner after the first hire, when contractor chaos becomes a risk.',
  '{house}', 'active', 20, true,
  '{"sells":"US payroll, benefits, and HR","serves":"Small companies making their first hires","helps_with":["payroll","benefits","HR","W-2 hiring"],"proof":["Payroll and benefits for small US companies"],"avoid":["Global contractor EOR","A job board"]}'::jsonb,
  now()
),
(
  'Framer', 'startup', 'https://www.framer.com',
  'Design and publish production marketing sites',
  'Framer lets teams ship marketing sites with real interactions, CMS, and SEO. Complements an app whose public site still looks like a placeholder.',
  '{house}', 'active', 20, true,
  '{"sells":"Design and publish production marketing sites","serves":"Teams whose product is ahead of their marketing site","helps_with":["marketing site","CMS","SEO pages","launch site"],"proof":["Design-to-publish for marketing sites"],"avoid":["A full app builder","A clone of the visitor product"]}'::jsonb,
  now()
),
(
  'Cursor', 'startup', 'https://cursor.com',
  'AI code editor for teams shipping in production',
  'Cursor is an AI-native code editor for people who still own the codebase. Complements a generated app when the next step is real engineering.',
  '{house}', 'active', 20, true,
  '{"sells":"An AI code editor for production work","serves":"Teams that need to own and refactor a real codebase","helps_with":["AI coding","refactors","code review","production engineering"],"proof":["AI-native editor used to ship production code"],"avoid":["A prompt-to-app builder clone","A no-code site builder"]}'::jsonb,
  now()
);
