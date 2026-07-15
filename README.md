# HostelDesk 🏢

> **Smart Hostel Complaint & Maintenance Management Platform**

HostelDesk is a comprehensive, modern SaaS platform designed to digitize and streamline the maintenance operations of college hostels, replacing chaotic WhatsApp-based complaint management systems with a structured, accountable, and transparent workflow.

## 🌟 Key Features

### For Students
- **Smart QR Scanning**: Scan a room's QR code to instantly raise a pre-filled complaint.
- **Real-time Tracking**: Track the status of complaints from RAISED to CLOSED.
- **Instant Notifications**: Get notified when workers are assigned or arrive.

### For Maintenance Staff (Workers)
- **Job Board**: View assigned and open jobs.
- **Accept/Reject**: Choose jobs based on specialization and availability.
- **Digital Proof**: Upload photos of completed work for verification.

### For Administration & Management
- **Role-Based Access Control**: Separate dashboards for Admins, Supervisors, and Management.
- **SLA Tracking**: Automated SLA breach alerts if complaints are not resolved in time.
- **Analytics & Reporting**: Comprehensive insights into issue trends, worker performance, and maintenance costs.
- **Inventory Management**: Track spare parts usage and stock levels.

## 🏗️ Technology Stack

**Backend:**
- Node.js & Express.js
- TypeScript
- PostgreSQL (Database)
- Prisma (ORM)
- Socket.io (Real-time events)
- JWT (Authentication)
- Cloudinary (Image storage)
- Zod (Validation)

**Frontend:**
- React 18 (Vite)
- TypeScript
- TailwindCSS (Styling)
- Zustand (State management)
- TanStack Query (Data fetching)
- Framer Motion (Animations)
- Recharts (Data visualization)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- npm or pnpm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in your database credentials and Cloudinary keys.
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```
6. Start the server:
   ```bash
   npm run dev
   ```
   *Server runs on http://localhost:5000*

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *Frontend runs on http://localhost:5173*

## 🔑 Demo Credentials

The database seed script generates users with the password `Password123`.

- **Management**: `director@hosteldesk.com`
- **Supervisor**: `supervisor1@hosteldesk.com`
- **Admin**: `admin1@hosteldesk.com`
- **Worker**: `worker1@hosteldesk.com`
- **Student**: `student1@hosteldesk.com`

## 📁 Project Structure

### Backend
The backend follows a Clean Architecture approach:
- `src/controllers/`: Request handlers and business logic.
- `src/routes/`: API route definitions.
- `src/middlewares/`: Authentication, error handling, rate limiting.
- `src/cron/`: Scheduled background tasks (SLA, reminders).
- `src/socket/`: WebSocket event handlers.
- `prisma/`: Database schema and seed scripts.

### Frontend
- `src/components/ui/`: Reusable, atomic UI components (Buttons, Inputs, Cards).
- `src/components/layout/`: Page layouts, Sidebar, Header, Protected Routes.
- `src/pages/`: Role-specific dashboard views and features.
- `src/store/`: Zustand global state.
- `src/lib/`: Axios interceptors, Socket client, utility functions.

## 🛡️ Security Features
- **JWT Auth**: Access tokens and Refresh tokens.
- **RBAC**: Strict Role-Based Access Control on both frontend routes and backend APIs.
- **Rate Limiting**: Protection against brute-force attacks.
- **Sanitization**: Request validation using Zod.
- **CORS**: Configured exclusively for the frontend origins.

## 📄 License
This project is proprietary and confidential. Unauthorized copying of this file, via any medium is strictly prohibited.
<<<<<<< HEAD
=======
=======
>>>>>>> 2de13d2209155531badcfa5fca600efd8de4c977
