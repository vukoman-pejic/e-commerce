# E-Commerce API

Simple Express.js API with PostgreSQL backend, implementing user purchases and bonus distribution (direct and team bonuses).

---

## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Assumptions](#assumptions)  
3. [Installation & Setup](#installation--setup)  
4. [Database Migrations](#database-migrations)  
5. [Running the Server](#running-the-server)  
6. [API Endpoints](#api-endpoints)   

---

## Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)  
- [npm](https://www.npmjs.com/)  
- [PostgreSQL](https://www.postgresql.org/)  
- [Redis](https://redis.io/)  

---

## Assumptions

- Authentication is not implemented.  
- Products are static (no CRUD API for products). Two products exist in the database:  
  - Package 1 – 100.00  
  - Package 2 – 500.00  
- Direct bonus is 10% of the product price and paid instantly.  
- Team bonus is 5% per upline and scheduled one hour after purchase.  
- Team bonuses are capped to **90% of the product price** to avoid overpayment if there are upper payments.  
- Users have `account_balance`. Purchase is allowed only if balance is sufficient. Bonuses are added to balance when paid.  

---

## Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/vukoman-pejic/e-commerce.git
cd e-commerce
```

2. Install dependencies:

```bash
npm install
```

3. Create .env in root:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e-commerce
DB_USER=postgres
DB_PASSWORD=your_db_password

DATABASE_URL=postgres://postgres:your_db_password@localhost:5432/e-commerce

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

4. Create PostgreSQL database:

```bash
CREATE DATABASE "e-commerce";
```

5. Start Redis server:

```bash
redis-server
```

---

## Database Migrations

- Run migrations:

```bash
npm run migrate:up
```

- Rollback last migration:

```bash
npm run migrate:down
```

Tables created:
- app_user
- product
- purchase
- bonus_payout

---

## Running the Server

- Development:

```bash
npm run dev
```

- Production:

```bash
npm start
```
Server runs at http://localhost:3000.

---

## API Endpoints

# Users

- POST /users – Add user

Body example:

```bash
{
  "first_name": "John",
  "last_name": "Doe",
  "invited_by_user_id": 1,
  "account_balance": 300
}
```

# Purchases

- POST /purchases – Create purchase

Body example:

```bash
{
   "user_id": 1,
   "product_id": 2
}
```
Behavior:

- Checks account_balance.

- Deducts purchase price.

- Direct bonus paid instantly.

- Team bonuses scheduled with delay (1 hour) via BullMQ.