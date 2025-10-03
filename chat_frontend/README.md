# Healthcare AI Assistant – Frontend (React)

Modern two-agent chat interface built with a lightweight React setup and custom CSS following the "Ocean Professional" theme.

## Key Features
- Main chat window with distinct styles for:
  - AI Agent 1 (intake/questions)
  - AI Agent 2 (recommendations)
  - User messages
- Sidebar for patient list and quick history access
- Bottom input section with Enter-to-send (Shift+Enter for newline)
- Responsive, clean UI with subtle gradients, rounded corners, and shadows
- Simple REST client in `src/services/api.js`

## Environment
Copy `.env.example` to `.env` and set the backend URL:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```
Guidelines:
- Do NOT include a trailing slash.
- Do NOT append `/api`. The app calls routes like `${BASE_URL}/patients`.
- For the hosted backend in this project, you can set:
  `REACT_APP_BACKEND_URL=https://vscode-internal-24827-beta.beta01.cloud.kavia.ai:3001`
If not set, the app will use `/api` as a relative base path (configure your dev proxy accordingly via `src/setupProxy.js`).

## Scripts
- `npm start` – Start development server
- `npm run build` – Production build
- `npm test` – Run tests

## File Highlights
- `src/App.js` – Layout, state, sidebar, chat logic, and input area
- `src/App.css` – Ocean Professional theme and components styling
- `src/services/api.js` – REST API functions for patients and chat

## Notes
This frontend expects a FastAPI backend exposing:
- `GET /patients` – list of patients
- `GET /patients/{id}/history` – chat history
- `POST /patients` – create/update patient
- `POST /chat/send` – send message and receive two-agent responses
