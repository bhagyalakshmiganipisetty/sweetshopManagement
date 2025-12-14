## Sweet Shop Management System

Full-stack implementation of the Sweet Shop Management System kata that demonstrates database-backed APIs, JWT-secured authentication, React SPA, and an auxiliary Flask metrics service.

### Architecture
- **Backend API** – Django + Django REST Framework + PostgreSQL for persistent sweets, purchases, and admin workflows. JWT (SimpleJWT) secures protected endpoints.
- **Flask Metrics Service** – lightweight companion that aggregates sweets per category directly from the database for dashboard insights.
- **Frontend** – React + Vite single-page app that covers registration/login, browsing, searching, purchasing, and admin CRUD flows.
- **Testing** – Pytest + Django test client cover registration, admin CRUD, and purchasing logic. Vite build validates the React bundle.

### Prerequisites
- Python 3.11+
- Node.js 20.19+ (Vite warns on earlier versions)
- PostgreSQL 14+ (or compatible)

### Backend Setup (`backend/`)
1. `python -m venv .venv && .\.venv\Scripts\activate`
2. `pip install -r requirements.txt`
3. Create `.env` based on `.env.example` and ensure `DATABASE_URL` points to your PostgreSQL database.
4. `python manage.py migrate`
5. `python manage.py createsuperuser`
6. `python manage.py runserver` (defaults to `http://localhost:8000`)

Available endpoints:
- `POST /api/auth/register/`
- `POST /api/auth/login/` (returns JWT + user payload)
- `POST /api/auth/token/refresh/`
- CRUD on `/api/sweets/` (admin only for POST/PUT/DELETE)
- `POST /api/sweets/{id}/purchase/`
- `POST /api/sweets/{id}/restock/` (admin only)
- `GET /api/sweets/search/` with `name`, `category`, `min_price`, `max_price` params (same filter set applies to `/api/sweets/`)
- API schema/docs: `/api/schema/`, `/api/docs/`

### Flask Metrics Service (`flask_service/`)
1. `python -m venv .venv && .\.venv\Scripts\activate` (or reuse backend venv)
2. `pip install -r requirements.txt`
3. Ensure `DATABASE_URL` matches the backend.
4. `python app.py` → serves on `http://localhost:5001/metrics/sweets`.

### Frontend Setup (`frontend/`)
1. `npm install`
2. Create `.env` from `.env.example` (point to backend + metrics URLs).
3. Dev server: `npm run dev` (defaults to `http://localhost:5173`)
4. Production build check: `npm run build`

### Roles & Permissions
- **Admin (is_staff=True)**: can create/update/delete sweets, restock inventory, and manage the catalog through both the API (`/api/sweets/` write operations) and the React admin forms. Admin tokens carry `user.is_staff: true`.
- **Standard user**: can register, log in, browse/search sweets, and call the purchase endpoint. Any attempt to hit admin-only endpoints returns HTTP 403; the frontend hides admin controls when `is_staff` is false.

### Screenshots
![Sweet Shop dashboard](sweet/Screenshot%202025-12-14%20184204.png)
![Sweet catalog management](sweet/Screenshot%202025-12-14%20184230.png)
![Admin CRUD view](sweet/Screenshot%202025-12-14%20184426.png)

### Testing
- Backend: `cd backend && pytest` (current suite: `sweets/tests/test_api.py` – 3 passing tests)
- Frontend: `cd frontend && npm run build` ensures the React bundle compiles.

#### Latest Test Report
```
$ cd backend && pytest
============================= test session starts =============================
platform win32 -- Python 3.11.0, pytest-9.0.2, pluggy-1.6.0
django: version: 5.2.9, settings: sweetshop_backend.settings (from ini)
rootdir: D:\sweetshop
plugins: anyio-4.11.0, langsmith-0.4.43, django-4.11.1
collected 3 items

sweets/tests/test_api.py ...                                             [100%]

============================= 3 passed in 17.37s ==============================

$ cd frontend && npm run build
vite v7.2.7 building client environment for production...
✓ built in 7.79s (warns if Node < 20.19.0; build still succeeds)
```

### My AI Usage
- **Tool**: ChatGPT (OpenAI GPT-based Codex CLI)
- **How**: leveraged to outline architecture, generate Django REST boilerplate, craft React components/hooks, create Flask metrics service, and draft documentation/testing scaffolds.
- **Reflection**: Using AI accelerated scaffolding and cross-stack consistency so I could focus on enforcing business rules (purchase/restock validation, admin-only paths) and frontend UX polish. Tests and documentation were still authored with manual review to ensure correctness.
