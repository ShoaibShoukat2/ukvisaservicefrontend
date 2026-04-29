# UKVI Services — Frontend

React + Vite + Tailwind CSS frontend for the UKVI Services fee payment portal.

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- JWT Authentication

## Features

- Browse UK Visa & IHS fee options
- User registration & login
- Shopping cart & Stripe checkout
- My Orders — view order history
- Profile management
- Payment success/cancel pages
- Fully connected to Django REST backend

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=https://visaservice.pythonanywhere.com/api
```

### 3. Run development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set **Root Directory** → `ukviservices/frontend`
4. Add environment variable: `VITE_API_BASE_URL=https://visaservice.pythonanywhere.com/api`
5. Deploy

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx        # All components & pages
│   ├── main.jsx       # Entry point
│   └── index.css      # Tailwind imports
├── .env               # Environment variables (not in git)
├── .env.example       # Sample env file
├── index.html
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

## API Endpoints Used

| Endpoint | Description |
|---|---|
| `GET /api/config/` | Site configuration |
| `GET /api/products/` | Fee options |
| `POST /api/auth/register/` | Register |
| `POST /api/auth/login/` | Login |
| `POST /api/auth/logout/` | Logout |
| `GET/PUT /api/auth/profile/` | User profile |
| `POST /api/orders/create/` | Create order + Stripe |
| `GET /api/orders/my/` | My orders |
| `GET /api/orders/:id/` | Order detail |
