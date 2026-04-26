# ✈ SKYLINE ARS — Backend API

> Express.js REST API for the Airline Reservation Management System
> **Deploy on Railway** | Frontend on Vercel

---

## 🚀 Deploy on Railway (Step-by-Step)

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **"New Project" → "Deploy from GitHub Repo"**
3. Select this `skyline-ars-backend` repository
4. Railway auto-detects Node.js and runs `npm start`
5. Go to **Settings → Environment Variables** and add:
   ```
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
6. Railway gives you a URL like `https://skyline-ars-backend.up.railway.app`
7. Copy that URL — paste it into your frontend `.env` as `REACT_APP_API_URL`

---

## 📁 Project Structure

```
skyline-backend/
├── server.js          ← Main entry point (Express app)
├── db.js              ← In-memory database (seed data)
├── package.json       ← Dependencies
├── .env.example       ← Environment variable template
├── .gitignore
└── routes/
    ├── auth.js        ← Login, register, user management
    ├── flights.js     ← Flight CRUD operations
    ├── bookings.js    ← Booking creation & cancellation
    └── maintenance.js ← 6-phase simulation, COCOMO II, backup/restore
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/login`     | Login (admin/passenger)  |
| POST   | `/api/auth/register`  | Register new passenger   |
| GET    | `/api/auth/users`     | Get all passengers       |
| DELETE | `/api/auth/users/:id` | Delete a passenger       |

### Flights
| Method | Endpoint                     | Description            |
|--------|------------------------------|------------------------|
| GET    | `/api/flights`               | Get all flights        |
| GET    | `/api/flights/:id`           | Get single flight      |
| POST   | `/api/flights`               | Add a new flight       |
| DELETE | `/api/flights/:id`           | Delete a flight        |
| PATCH  | `/api/flights/:id/status`    | Update flight status   |

### Bookings
| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/api/bookings`                | Get all bookings         |
| GET    | `/api/bookings/:ref`           | Get booking by reference |
| POST   | `/api/bookings`                | Create a new booking     |
| PATCH  | `/api/bookings/:ref/cancel`    | Cancel a booking         |
| DELETE | `/api/bookings/:id`            | Hard delete a booking    |

### Maintenance
| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/maintenance/issues`         | Get all maintenance issues   |
| POST   | `/api/maintenance/issues`         | Log a new issue              |
| PATCH  | `/api/maintenance/issues/:id/resolve` | Mark issue as resolved   |
| GET    | `/api/maintenance/state`          | Get simulation state         |
| POST   | `/api/maintenance/phase/:n`       | Run maintenance phase (0–5)  |
| POST   | `/api/maintenance/reset`          | Reset simulation             |
| POST   | `/api/maintenance/backup`         | Create system backup         |
| POST   | `/api/maintenance/restore`        | Restore from backup          |
| GET    | `/api/maintenance/logs`           | Get system logs              |
| POST   | `/api/maintenance/cocomo`         | COCOMO II cost calculation   |

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start development server
npm run dev

# Server runs at http://localhost:5000
```

---

## 👥 Team

- Muhammad Shayan (24F-CS-19)
- Insa Azhar (24F-CS-20)
- Ahmed Waseem (24F-CS-21)

**Course:** Software Engineering | **Instructor:** Dr. Fida Hussain Khoso
**University:** Dawood University of Engineering & Technology
