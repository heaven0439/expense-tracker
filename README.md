ExpenseTracker Pro
A web-based personal finance application engineered for performance, security, and data portability.

Live Deployment: https://expensetraackerroshan.netlify.app/

Architecture Overview
This application utilizes a serverless cloud architecture to ensure persistent data security and cross-device synchronization, specifically upgrading from device-dependent local storage to a robust remote database system.

Frontend: HTML5, CSS3 (Tailwind CSS via CDN), and Vanilla JavaScript.

Authentication: Firebase Authentication manages secure identity verification, supporting both standard Email/Password credentials and Google OAuth integration.

Backend & Database: Supabase (PostgreSQL) functions as the serverless backend, accessed via REST API to handle seamless CRUD operations for user transactions.

Analytics: Chart.js is implemented for dynamic, client-side data visualization.

Hosting: Deployed on Netlify.

Core Features
Secure Authentication: Hybrid identity management ensuring user data isolation.

Serverless Data Persistence: Real-time database syncing that prevents data loss and allows seamless access across multiple devices.

Financial Analytics: Interactive doughnut charts for visual expense and income tracking.

Advanced Filtering: Client-side data sorting by transaction category (Income/Expense) and temporal parameters (Today, This Week, This Month).

Data Export: Built-in CSV generation for accounting and external record-keeping.

Responsive Interface: Mobile-first layout adapting to desktop environments via CSS Flexbox and Grid.