# Deploy the Full Project

Deploy **frontend** (Vite/React) to **Vercel** and **backend** (Node/Express) to **Render**. MongoDB Atlas is already in the cloud.

---

## 1. Backend (Render.com)

1. Go to [render.com](https://render.com) and sign in (or sign up).
2. **New** → **Web Service**.
3. Connect your GitHub repo (e.g. `Sru2004/VirtualArtGallary`).
4. **Root Directory:** set to `backend` (so Render runs `npm install` and `npm start` from the backend folder).
5. **Build Command:** `npm install`
6. **Start Command:** `npm run start`
7. **Environment variables** (Add in Render dashboard):
   - `MONGODB_URI` = your Atlas connection string (e.g. `mongodb+srv://...@cluster0.xxx.mongodb.net/test?retryWrites=true&w=majority`)
   - `JWT_SECRET` = a long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com))
   - `NODE_ENV` = `production`
8. **Create Web Service.** Note the backend URL (e.g. `https://visualart-api.onrender.com`).
9. After you deploy the frontend, add env var **`FRONTEND_URL`** = your Vercel URL (e.g. `https://your-project.vercel.app`) so CORS allows it.

---

## 2. MongoDB Atlas (if not done)

- **Network Access:** Add `0.0.0.0/0` so Render’s servers can connect (or add Render’s IPs if you prefer).
- **Database:** Use the same database name as in `MONGODB_URI` (e.g. `test`).

---

## 3. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New** → **Project** → import your GitHub repo.
3. **Root Directory:** leave as **root** (frontend is at repo root).
4. **Build Command:** `npm run build` (default).
5. **Output Directory:** `dist` (default for Vite).
6. **Environment variables** (Add in Vercel):
   - **Name:** `VITE_API_URL`  
   - **Value:** your backend URL + `/api`  
     Example: `https://visualart-api.onrender.com/api`
7. **Deploy.**

After deploy, Vercel gives you a URL like `https://your-project.vercel.app`.

---

## 4. CORS (backend must allow your frontend URL)

The backend already reads **`FRONTEND_URL`** and allows any `*.vercel.app` origin. In **Render** → your backend service → **Environment** → add:

- **`FRONTEND_URL`** = `https://your-project.vercel.app` (your actual Vercel URL)

Redeploy the backend after adding it.

---

## 5. Summary

| Part       | Where      | URL example                          |
|-----------|------------|--------------------------------------|
| Frontend  | Vercel     | `https://your-project.vercel.app`    |
| Backend   | Render     | `https://visualart-api.onrender.com`|
| Database  | Atlas      | (connection string in backend env)  |

- **Frontend** uses `VITE_API_URL` so all API calls go to your deployed backend.
- **Backend** uses `MONGODB_URI` and `JWT_SECRET`; allow your Vercel URL in CORS.

---

## Optional: Deploy backend with Render Blueprint

If your repo has **`render.yaml`** at the **repo root**:

1. **New** → **Blueprint** on Render.
2. Connect the repo; Render will read `render.yaml` (root directory for the service is set to `backend` in the file).
3. Set **`MONGODB_URI`** and **`FRONTEND_URL`** (and optionally **`JWT_SECRET`**) in the service’s **Environment**.
4. Deploy. Use the generated backend URL as **`VITE_API_URL`** in Vercel (e.g. `https://visualart-api.onrender.com/api`).
