# Enterprise Vendor Evaluation & Contract Management System

An end-to-end enterprise solution for managing vendor performance evaluations, purchase orders/contracts (PO/LOA), scoring matrices, and multi-tier user workflows (Admin, Engineer-in-Charge / EIC, and Vendor).

---

## 📑 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone and Navigate](#1-clone-and-navigate)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Setup the Database & Seed Data](#4-setup-the-database--seed-data)
  - [5. Run the Application](#5-run-the-application)
- [Default Demo Credentials](#default-demo-credentials)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 🌟 Overview

The **Vendor Evaluation System** streamlines procurement audits, contract compliance, and quantitative vendor scoring.

- **Role-Based Workflows**: Tailored portals for **Admin**, **EIC (Engineer-in-Charge)**, and **Vendor**.
- **Comprehensive Evaluation Matrix**: Weighted evaluations across 10 distinct operational criteria (Quality, Timeliness, Safety, etc.) with automatic grade mapping (Excellent, Very Good, Good, Satisfactory, Unsatisfactory).
- **Contract & PO Lifecycle**: Track PO/LOA metadata, award values, validity periods, and associated evaluations.
- **Audit Logging & Notifications**: Complete audit trails for accountability and real-time status notifications.

---

## 🛠 Tech Stack

- **Frontend**:
  - React 18 with TypeScript
  - Tailwind CSS & Lucide Icons
  - Vite (build tool and dev server with API proxying)
- **Backend**:
  - Node.js & Express with TypeScript
  - Prisma ORM
  - SQLite (default embedded database)
  - JWT Authentication & bcryptjs password hashing
  - Zod for request validation & Helmet for security headers

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (packaged with Node.js)

---

## 🚀 Quick Start Guide

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd "Vendor Evaluator"
```

### 2. Install Dependencies

Install root backend dependencies as well as client frontend dependencies:

```bash
# 1. Install root (backend) dependencies
npm install

# 2. Install client (frontend) dependencies
npm --prefix client install
```

> **Note:** Alternatively, you can run `cd client && npm install && cd ..`.

### 3. Configure Environment Variables

The backend uses a `.env` file in the project root. A sample template is provided in `.env.example`.

If `.env` does not exist, copy it:

```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Default `.env` configuration:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="enterprise_super_secure_jwt_secret_key_928174982734"
JWT_EXPIRES_IN="24h"
CLIENT_URL="http://localhost:5173"
```

### 4. Setup the Database & Seed Data

The project uses Prisma ORM with SQLite. Initialize the database schema and populate it with initial sample data (thresholds, criteria, admins, EICs, vendors, and sample contracts):

```bash
# Generate Prisma Client
npm run prisma:generate

# Sync schema to the local SQLite database
npm run prisma:push

# Seed the database with demo users and sample data
npm run prisma:seed
```

### 5. Run the Application

To run both backend and frontend, open two separate terminal windows:

#### Terminal 1: Backend Server
```bash
npm run server
```
- The backend API will start on: **`http://localhost:5000`**
- Health & API Base: **`http://localhost:5000/api`**

#### Terminal 2: Frontend Client
```bash
npm run client
```
- The Vite client will start on: **`http://localhost:5173`**
- Open **[http://localhost:5173](http://localhost:5173)** in your browser.

> Requests from the frontend to `/api` are automatically proxied to the backend at `http://localhost:5000`.

---

## 🔑 Default Demo Credentials

The database seed (`npm run prisma:seed`) pre-populates test accounts for all roles:

| Role | Email | Password | Notes / Department |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@enterprise.org` | `Admin@123` | Central Procurement & Contracts |
| **Admin** | `admin.finance@enterprise.org` | `Admin@123` | Finance & Commercial Audit |
| **Admin** | `admin.auditor@enterprise.org` | `Admin@123` | Quality Assurance & Vigilance |
| **EIC** | `eic.sharma@enterprise.org` | `Eic@123` | Heavy Engineering Div |
| **EIC** | `eic.patel@enterprise.org` | `Eic@123` | Thermal & Energy Systems |
| **EIC** | `eic.verma@enterprise.org` | `Eic@123` | Civil Infrastructure Works |
| **Vendor** | `vendor.apex@enterprise.org` | `Vendor@123` | Apex Industrial Fabricators Ltd |
| **Vendor** | `vendor.bharat@enterprise.org` | `Vendor@123` | Bharat Heavy Power Infra Pvt Ltd |
| **Vendor** | `vendor.crestline@enterprise.org` | `Vendor@123` | Crestline Logistics & Haulage LLP |

---

## 📜 Available Scripts

In the **root directory**:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run server` | `tsx watch src/server.ts` | Start backend with hot reload on port `5000` |
| `npm run client` | `npm --prefix client run dev` | Start frontend Vite server on port `5173` |
| `npm run prisma:generate` | `prisma generate` | Re-generate Prisma Client typings |
| `npm run prisma:push` | `prisma db push` | Push Prisma schema changes to SQLite |
| `npm run prisma:seed` | `tsx prisma/seed.ts` | Seed database with demo records & test accounts |
| `npm run build:server` | `tsc` | Compile TypeScript backend |
| `npm run build:client` | `npm --prefix client run build` | Build production client bundle into `client/dist` |
| `npm start` | `tsx src/server.ts` | Run backend in production mode |

In the **`client/` directory**:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Start client development server |
| `npm run build` | `tsc && vite build` | Type-check and build frontend for production |
| `npm run preview` | `vite preview` | Locally preview the production build |

---

## 📁 Project Structure

```text
Vendor Evaluator/
├── client/                     # Frontend React + TypeScript + Vite app
│   ├── src/
│   │   ├── components/         # Shared UI components (Layout, Modals, Navbar, etc.)
│   │   ├── context/            # Auth and application state contexts
│   │   ├── features/           # Feature-specific components
│   │   ├── pages/              # Role-specific dashboards & view pages
│   │   ├── services/           # Axios/Fetch API client layer
│   │   ├── types/              # Frontend TypeScript definitions
│   │   ├── App.tsx             # Root React component & routing
│   │   └── main.tsx            # React application entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts          # Vite configuration with /api proxy
├── prisma/
│   ├── schema.prisma           # Database models & relationships
│   ├── seed.ts                 # Database seed script
│   └── dev.db                  # Local SQLite database file
├── src/                        # Backend Express application
│   ├── config/                 # Environment & app configuration
│   ├── constants/              # System constants and role definitions
│   ├── controllers/            # Route request handlers
│   ├── middleware/             # Auth, role-check, and validation middleware
│   ├── routes/                 # Express API endpoints
│   ├── services/               # Business logic & database queries
│   ├── utils/                  # Helper functions and calculators
│   ├── app.ts                  # Express application configuration
│   └── server.ts               # HTTP server entry point
├── .env                        # Local environment variables
├── .env.example                # Example environment variables template
├── package.json                # Root package configuration & backend dependencies
├── tsconfig.json               # Backend TypeScript configuration
└── README.md                   # Project documentation
```

---

## ❓ Troubleshooting & FAQs

### 1. `Port 5000 or 5173 is already in use`
- Modify the `PORT` in `.env` if 5000 is occupied.
- To change the frontend port, update `server.port` in [client/vite.config.ts](file:///c:/Users/piyus/OneDrive/Desktop/Vendor%20Evaluator/client/vite.config.ts) and the `CLIENT_URL` in `.env`.

### 2. `Prisma Client not initialized or out of sync`
Run the following commands to re-generate the client and ensure schema alignment:
```bash
npm run prisma:generate
npm run prisma:push
```

### 3. `Need to reset the database to clean demo state`
You can re-run the seed script at any time to wipe and repopulate standard test records:
```bash
npm run prisma:seed
```
Alternatively, delete `prisma/dev.db` and run `npm run prisma:push && npm run prisma:seed`.
#   V e n d o r - E v a l u a t o r  
 