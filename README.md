SmartBiz — AI-Powered Business Management Suite 
-
A full-stack ERP-lite platform for small and medium businesses to manage sales, inventory, customers, and daily operations — with OpenAI-powered insights, report generation, and email/content writing built in.

Features
-
Business Owner (Web & Mobile)
Dashboard overview — sales, inventory, profits at a glance
Customer and supplier management
Product and stock management (add / update / delete)
Sales and invoice management
Daily income and expense tracking
AI business insights — ask in plain English: "How did I perform last month?"
AI email composer — "Write a thank-you email to my supplier"
AI marketing post generator — "Write a Facebook post for our 50% off sale"
Admin Panel
Manage registered businesses and users
Review AI usage logs and system-wide statistics
Manage subscription or pricing plans

Tech Stack
-
Layer	Technology
Frontend (Web)	React + Vite, React Router v6, Axios, Recharts
Frontend (Mobile)	React Native (planned)
Backend	Spring Boot 3, MySQL
AI Integration	OpenAI API (GPT)
Authentication	JWT (JSON Web Tokens)
Deployment	AWS EC2 with custom domain

Project Structure
```
smartbiz/
├── smartbiz-backend/          # Spring Boot API
│   └── src/main/java/com/smartbiz/
│       ├── controller/        # REST endpoints
│       ├── dto/               # Request / response objects
│       ├── model/             # JPA entities
│       ├── repository/        # Spring Data repositories
│       └── service/           # Business logic
│
└── smartbiz-frontend/         # React web app
    └── src/
        ├── api/               # Axios client + per-resource hooks
        ├── store/             # Auth context (token, role)
        ├── router/            # App routes + ProtectedRoute
        └── pages/
            ├── auth/          # Login, Register
            ├── dashboard/     # Overview + charts
            ├── products/      # Inventory CRUD
            ├── sales/         # Sales + invoices
            ├── customers/     # Customer CRM
            ├── suppliers/     # Supplier management
            ├── expenses/      # Income & expense tracker
            └── ai/            # AI assistant chat
```
---
Getting Started
-
Prerequisites
Node.js 18+
Java 17+
MySQL 8+
An OpenAI API key

Backend Setup
-
Create the database
```sql
CREATE DATABASE smartbiz_db;
```
Configure environment
Open `smartbiz-backend/src/main/resources/application.properties` and update:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smartbiz_db
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

openai.api.key=your_openai_api_key
```
> ⚠️ Never commit real credentials or API keys to version control. Use environment variables in production.
Run the backend
```bash
cd smartbiz-backend
./mvnw spring-boot:run
```
The API will start at `http://localhost:8080`. Tables are created automatically via `spring.jpa.hibernate.ddl-auto=update`.

Frontend Setup
Install dependencies
```bash
cd smartbiz-frontend
npm install
```
Start the dev server
```bash
npm run dev
```
The app will open at `http://localhost:5173`.
> Make sure the backend is running first — login and register call the API immediately.
Build for production
```bash
npm run build
```
Output goes to the `dist/` folder, ready to deploy to a web server or S3.

API Overview
-
All endpoints (except auth) require a `Bearer` token in the `Authorization` header.
Resource	Base path
Auth	`POST /api/auth/register`, `POST /api/auth/login`
Dashboard	`GET /api/dashboard/summary`
Products	`GET/POST/PUT/DELETE /api/products`
Sales	`GET/POST/PUT/DELETE /api/sales`
Sale items	`GET/POST/PUT/DELETE /api/sale-items`
Customers	`GET/POST/PUT/DELETE /api/customers`
Suppliers	`GET/POST/PUT/DELETE /api/suppliers`
Invoices	`GET/POST/PUT/DELETE /api/invoices`
Expenses	`GET/POST/PUT/DELETE /api/expenses`
AI	`POST /api/ai/ask`
Auth response shape
```json
{
  "token": "eyJhbGci...",
  "message": "Login successful"
}
```
AI request shape
```json
{
  "question": "What were my top 5 selling products last month?"
}
```
---
Environment Variables
Backend (`application.properties`)
Key	Description
`spring.datasource.url`	MySQL JDBC connection URL
`spring.datasource.username`	MySQL username
`spring.datasource.password`	MySQL password
`openai.api.key`	Your OpenAI secret key
`openai.model`	Model name, e.g. `gpt-4o`
`server.port`	Defaults to `8080`
Frontend
Create a `.env` file in `smartbiz-frontend/` if you need to override the API base URL:
```env
VITE_API_BASE_URL=http://localhost:8080
```
Then update `src/api/axiosClient.js` to use `import.meta.env.VITE_API_BASE_URL`.

Deployment (AWS EC2)
-
Build the frontend: `npm run build` → upload `dist/` to your server or S3 + CloudFront
Package the backend: `./mvnw package` → upload the `.jar` to EC2
Run with: `java -jar smartbiz-backend.jar --spring.config.location=/etc/smartbiz/application.properties`
Use Nginx as a reverse proxy — serve the frontend on port 80/443, proxy `/api/*` to port 8080
Set up SSL with Let's Encrypt (`certbot`)

Security Note
-
JWT tokens are signed server-side and validated on every request
Role-based access control: `ROLE_ADMIN` can create/update/delete; `ROLE_USER` has read access
Never expose your `openai.api.key` or database password in the repository — use environment variables or AWS Secrets Manager in production
Tighten CORS in `CorsConfig.java` before going live — replace `allowedOrigins("*")` with your actual domain


This project was developed as a final project for the AFSD programme. 
