# Quick Fix: MongoDB Connection Issue

## Your Current IP Address
**152.58.14.228** (detected automatically)

## Step-by-Step Fix (Takes 2 minutes)

### 1. Open MongoDB Atlas Network Access
👉 **Direct Link**: https://cloud.mongodb.com/v2#/security/network/whitelist

### 2. Add Your IP Address
- Click the green **"Add IP Address"** button
- Enter: `152.58.14.228/32`
- Add comment: "Development Server"
- Click **"Confirm"**

### 3. Wait for Changes
- Wait **1-2 minutes** for MongoDB Atlas to update

### 4. Restart Backend
```bash
cd backend
npm run start:fresh
```

### 5. Verify Connection
Check the backend console - you should see:
```
✅ MongoDB connected (MONGODB_URI): database "test" — data will be saved here.
```

Or check: http://localhost:5000/api/health

---

## Alternative: Allow from Anywhere (Testing Only)
If you want to allow connections from any IP (less secure):
- Add IP: `0.0.0.0/0`
- ⚠️ **Warning**: Only use this for testing, not production!

---

## Check Your Current IP Anytime
Run this command to see your current IP:
```bash
cd backend
npm run check-db
```

---

## Still Not Working?

1. **Verify IP**: Your IP might have changed. Run `npm run check-db` to see current IP
2. **Check MongoDB Credentials**: Verify username/password in `.env` file
3. **Check Cluster Status**: Make sure your MongoDB Atlas cluster is not paused
4. **Wait Longer**: Sometimes it takes 2-3 minutes for IP whitelist changes

---

## Current Configuration
- **MongoDB URI**: `mongodb+srv://srujanatoukare:****@cluster0.cp7lq.mongodb.net/test`
- **Database**: `test`
- **IP to Whitelist**: `152.58.14.228/32`
