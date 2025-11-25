# Reward Dashboard

A full-stack web application for managing colleague recognition badges with voting capabilities.

## Features

- 🔐 **JWT Authentication** - Secure login and registration
- 👥 **Colleague Management** - Admin CRUD operations for team members
- 🏆 **Badge System** - Award badges to colleagues with monthly quotas
- 👍 **Voting System** - Upvote/downvote badges
- 📊 **Dashboard Stats** - Real-time statistics and quota tracking
- 🎨 **Responsive UI** - Clean, modern interface built with React

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for Python
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database
- **JWT** - Token-based authentication
- **CORS** - Cross-origin resource sharing enabled

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Fast build tool

## Project Structure

```
reward-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py       # API endpoints
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── database.py         # Database configuration
│   │   ├── security.py         # JWT auth utilities
│   │   └── main.py             # FastAPI app with CORS
│   └── requirements.txt        # Python dependencies
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.ts       # API client
    │   ├── components/
    │   │   ├── ColleagueCard.tsx
    │   │   ├── CreateColleagueModal.tsx
    │   │   └── CreateBadgeModal.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx # Authentication context
    │   ├── pages/
    │   │   ├── Dashboard.tsx   # Main dashboard
    │   │   ├── Login.tsx       # Login page
    │   │   └── Register.tsx    # Registration page
    │   ├── App.tsx             # Main app with routing
    │   └── main.tsx            # Entry point
    └── package.json            # Node dependencies
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user info

### Colleagues
- `GET /api/colleagues` - List all colleagues
- `GET /api/colleagues/{id}` - Get colleague with badges
- `POST /api/colleagues` - Create colleague (admin only)
- `PUT /api/colleagues/{id}` - Update colleague (admin only)
- `DELETE /api/colleagues/{id}` - Delete colleague (admin only)

### Badges
- `GET /api/badges` - List badges (with filters)
- `POST /api/badges` - Award a badge (enforces monthly quota)

### Votes
- `POST /api/votes` - Vote on a badge
- `DELETE /api/votes/{badge_id}` - Remove vote

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/quota/current` - Get current user's monthly quota

## Business Rules

1. **Monthly Quota**: Each user can award a maximum of 5 badges per month
2. **Unique Badges**: A colleague cannot receive the same badge type twice in the same month
3. **Admin Privileges**: Only admins can create, update, or delete colleagues
4. **Voting**: Users can vote (up/down) on badges, but can only vote once per badge

## Database Models

### User
- Authentication and authorization
- Tracks monthly quota usage

### Colleague
- Team member profiles
- Department, position, bio, avatar

### Badge
- Recognition awards
- Linked to colleague and awarding user
- Monthly tracking

### Vote
- User votes on badges
- One vote per user per badge

### MonthlyQuota
- Tracks badge quota per user per month
- Default max: 5 badges

## Development

### Building for Production

Backend:
```bash
# Run with production settings
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:
```bash
npm run build
```

### Environment Variables

Backend:
- `SECRET_KEY` - JWT secret (change in production!)

Frontend:
- `VITE_API_URL` - Backend API URL (defaults to `http://localhost:8000/api`)

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration for frontend access
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic

## License

See LICENSE file for details.
