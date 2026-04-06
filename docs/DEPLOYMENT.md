# Deploying Resumind (MERN + Puter)

## Architecture

- **API (Node/Express)** — JWT auth, MongoDB, stores PDF + PNG under `server/uploads/`.
- **Client (static React)** — hosted separately; calls API via `VITE_API_URL`.
- **Puter** — loaded in the browser only; users sign in to Puter for AI and temporary cloud file paths.

## 1. MongoDB

Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Whitelist your host IP or `0.0.0.0/0` for managed platforms. Copy the connection string as `MONGODB_URI`.

## 2. Deploy the API

Suitable hosts: **Render**, **Railway**, **Fly.io**, **DigitalOcean App Platform**, any VPS with Node.

1. Root directory: `server`.
2. Build command: none (plain Node).
3. Start command: `npm start`.
4. Environment variables:

   | Variable       | Example                                      |
   | -------------- | -------------------------------------------- |
   | `MONGODB_URI`  | `mongodb+srv://...`                           |
   | `JWT_SECRET`   | Long random string                           |
   | `PORT`         | Often set automatically by host               |
   | `CLIENT_ORIGIN`| Your frontend origin(s), comma-separated    |

   Example `CLIENT_ORIGIN`:

   ```
   https://resumind.vercel.app
   ```

5. **Persistent disk** — Map a volume to `server/uploads` (or the path you use) so files survive restarts. If the host has no disk, switch to S3/GridFS later.

## 3. Deploy the client

Suitable hosts: **Vercel**, **Netlify**, **Cloudflare Pages**, static S3 + CloudFront.

1. Root directory: `client`.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Environment variable:

   ```
   VITE_API_URL=https://your-api.onrender.com
   ```

   No trailing slash. The app calls `${VITE_API_URL}/api/...`.

5. Redeploy the client whenever the API URL changes.

## 4. Puter

- No server config: `https://js.puter.com/v2/` stays in `client/index.html`.
- Users must allow popups / third-party cookies if Puter sign-in requires it.

## 5. Smoke test

1. Open the deployed site.
2. Register → log in.
3. Sign in to Puter from `/puter` or the upload banner.
4. Upload a PDF and confirm redirect to `/resume/:id`.
5. Refresh home — the card should list the submission.

## Single-origin option (advanced)

You can serve `client/dist` as static files from Express in production (one process, one domain). Mount `express.static` on the built folder and add a catch-all route for SPA routing. Ensure `CLIENT_ORIGIN` matches that single origin.
