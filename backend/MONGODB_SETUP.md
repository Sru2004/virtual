# MongoDB connection options

The backend needs MongoDB. Choose one:

---

## Option 1: Local MongoDB (recommended for development)

**Install (Windows – run in PowerShell as Administrator):**
```powershell
winget install MongoDB.Server
```

**Start MongoDB:**  
After install, the service usually starts automatically. If not:
```powershell
Start-Service MongoDB
```

**Use it:**  
Restart your backend. It will try Atlas first, then **automatically use `mongodb://localhost:27017/visualart`** if Atlas fails. No `.env` change needed.

To force local only, create `backend/.env` with:
```
MONGODB_URI=mongodb://localhost:27017/visualart
```

---

## Option 2: MongoDB Atlas (cloud)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → your project → **Network Access**.
2. Click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) for development, or add your current IP.
3. Copy your cluster connection string and set in `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```
4. Restart the backend.

---

The backend **retries** connection and will **reconnect** automatically if MongoDB becomes available later (e.g. after you start the service).
