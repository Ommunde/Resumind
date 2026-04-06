# Resumind (MERN + Puter)

AI-assisted resume feedback: **MongoDB**, **Express**, **React (Vite)**, **Node** for auth and persistence; **Puter.js** in the browser for file uploads to Puter and AI (`puter.ai.chat`).

## Local development

1. **MongoDB** running locally or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Server env**

   ```bash
   cp server/.env.example server/.env
   ```

   Set `MONGODB_URI`, `JWT_SECRET` (long random string), and `CLIENT_ORIGIN=http://localhost:5173`.

3. **Install & run**

   ```bash
   npm install
   npm run dev
   ```

   - API: [http://localhost:5000](http://localhost:5000) (`/api/health`)
   - Client: [http://localhost:5173](http://localhost:5173) (proxies `/api` to the server)

4. **Flow**

   - Register / log in (JWT).
   - Open **Puter** sign-in from the upload page when prompted (needed for AI + Puter FS).
   - Upload a PDF; analysis runs via Puter; result and files are stored on your server.

## Production

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project layout

| Path       | Role                                      |
| ---------- | ----------------------------------------- |
| `client/`  | React SPA, Puter script, PDF.js preview  |
| `server/`  | Express API, JWT, MongoDB, resume files  |


Deployed : https://resumind-client.vercel.app/
