# AI Programming Tutor — MSc Dissertation Project

A hint-first AI programming tutor. Flask REST API + PostgreSQL on the
backend, React (Vite) on the frontend, tutoring powered by the Gemini
API. Built with a clean separation between backend, frontend, and
database — each module split into its own file rather than one large
file per layer.

## Project structure

```
ai-programming-tutor/
├── backend/
│   ├── app/
│   │   ├── models/          One model per file (user, chat, message, survey)
│   │   ├── routes/          One blueprint per file (auth, chat, admin, survey)
│   │   ├── services/        gemini_service.py — hint-first tutoring logic
│   │   ├── utils/           decorators.py — admin_required guard
│   │   └── __init__.py      App factory
│   ├── scripts/
│   │   └── create_admin.py  Interactive terminal admin creation (see below)
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/              axios.js — API client + JWT header
│       ├── components/       Sidebar, Navbar, ChatBubble, ProtectedRoute
│       │                     (each in its own folder with paired .jsx + .css)
│       ├── pages/             Login, Register, Chat, Survey, Admin
│       ├── context/          AuthContext.jsx — login/logout state
│       └── styles/           variables.css + global.css design system
└── database/
    └── schema.sql            Reference SQL (Flask-Migrate is primary)
```

## 1. Database

```sql
CREATE DATABASE tutor_db;
CREATE USER tutor_user WITH PASSWORD 'tutor_pass';
GRANT ALL PRIVILEGES ON DATABASE tutor_db TO tutor_user;
```

## 2. Backend setup

**macOS / Linux:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: DATABASE_URL, GEMINI_API_KEY, SECRET_KEY, JWT_SECRET_KEY

flask db init
flask db migrate -m "initial tables"
flask db upgrade
```

**Windows (PowerShell)** — run each line separately, PowerShell doesn't
support `&&`:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

Copy-Item .env.example .env
flask db init
flask db migrate -m "initial tables"
flask db upgrade
```

If `psycopg2-binary` fails to build on Windows with a "Microsoft
Visual C++ 14.0 required" error, it means pip couldn't find a
prebuilt wheel: run `pip install --only-binary :all: psycopg2-binary`.

### Create the admin account (terminal only — exactly one admin, ever)

There is no seeded/default admin. You create it once, interactively:

```bash
python scripts/create_admin.py
```

You'll be prompted for a name, email, and a hidden (masked) password.
Running this script again after an admin already exists will refuse
and exit — only one admin account is allowed, enforced both by the
script and by a unique partial index in the database
(`idx_single_admin` in `database/schema.sql`).

### Run the API
```bash
python run.py
```
Runs at `http://localhost:5000`.

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env      # Windows: Copy-Item .env.example .env
npm run dev
```
Runs at `http://localhost:5173`.

## 4. Using the app

- **Students**: `/register` to create an account → `/login` → lands on
  `/chat`. The sidebar lists all previous chat sessions; clicking one
  reopens its full message history. A "Survey" button in the top bar
  opens the post-use survey.
- **Admin**: log in with the credentials created via
  `scripts/create_admin.py` → lands on `/admin`, showing total users,
  total chats, total survey responses, and a per-user table. Clicking
  "View" on a user shows their individual survey answers. The
  **"Manage Survey"** button opens `/admin/survey`, where the admin
  writes and publishes the post-use survey questions (Likert 1–5 or
  open text) directly from the browser — no seed file needed.

## API summary

| Method | Endpoint                                | Who            | Purpose                            |
|--------|------------------------------------------|----------------|--------------------------------------|
| POST   | /api/auth/register                       | Public         | Student signup                        |
| POST   | /api/auth/login                          | Public         | Login (student or admin)              |
| GET    | /api/chat                                | Student        | List own previous chats (sidebar)     |
| POST   | /api/chat                                | Student        | Start new chat                        |
| GET    | /api/chat/<id>/messages                  | Student        | Load messages of a past chat          |
| POST   | /api/chat/<id>/messages                  | Student        | Send message, get tutor reply         |
| GET    | /api/survey/questions                    | Student/Admin  | List published survey questions       |
| POST   | /api/survey/questions                    | Admin          | Create a survey question              |
| DELETE | /api/survey/questions/<id>                | Admin          | Remove a survey question              |
| POST   | /api/survey/responses                    | Student        | Submit survey answers                 |
| GET    | /api/admin/users                         | Admin          | Total users + activity summary        |
| GET    | /api/admin/users/<id>/chats               | Admin          | A user's chat sessions                |
| GET    | /api/admin/users/<id>/survey-responses    | Admin          | A user's survey answers for analysis  |

## Notes

- Real identity (full name + email) is used for student accounts, as
  requested. The dissertation proposal originally committed to
  anonymised data for ethics approval — confirm with the supervisor
  whether this is acceptable before running the actual student pilot.
- Gemini's system prompt enforces hint-first tutoring — see
  `backend/app/services/gemini_service.py`.
- Get a `GEMINI_API_KEY` from Google AI Studio and put it in
  `backend/.env`. Without it, the tutor returns a placeholder message
  so the app still runs end-to-end for testing the UI.
