# Fix Database Connection Issue

## Problem
Database is showing as "disconnected" - MongoDB Atlas connection is failing because your IP address is not whitelisted.

## Solution: Whitelist IP Address in MongoDB Atlas

### Step 1: Log into MongoDB Atlas
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Log in with your MongoDB Atlas account

### Step 2: Navigate to Network Access
1. Click on **"Network Access"** in the left sidebar (under Security)
2. Or go directly to: [https://cloud.mongodb.com/v2#/security/network/whitelist](https://cloud.mongodb.com/v2#/security/network/whitelist)

### Step 3: Add IP Address
1. Click the **"Add IP Address"** button (green button)
2. You have two options:

   **Option A: Add Specific IP (Recommended)**
   - Enter: `152.58.15.36/32`
   - Add a comment: "Development Server"
   - Click **"Confirm"**

   **Option B: Allow from Anywhere (For Testing Only)**
   - Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (less secure, but works for testing)
   - Click **"Confirm"**

### Step 4: Wait for Changes to Take Effect
- Wait **1-2 minutes** for MongoDB Atlas to update the network access rules

### Step 5: Restart Backend Server
After whitelisting the IP, restart your backend:

```bash
cd backend
npm run start:fresh
```

### Step 6: Verify Connection
1. Check the backend console - you should see:
   ```
   ✅ MongoDB connected (MONGODB_URI): database "test" — data will be saved here.
   ```

2. Or check the health endpoint:
   ```
   http://localhost:5000/api/health
   ```
   
   Should show:
   ```json
   {
     "status": "OK",
     "database": "connected",
     "databaseName": "test"
   }
   ```

## Current Configuration
- **MongoDB URI**: `mongodb+srv://srujanatoukare:****@cluster0.cp7lq.mongodb.net/test`
- **Database**: `test`
- **IP to Whitelist**: `152.58.15.36/32`

## Troubleshooting

### Still Not Connecting?
1. **Verify IP Address**: Your current public IP might be different. Check at [https://whatismyipaddress.com](https://whatismyipaddress.com)
2. **Check MongoDB Credentials**: Verify username and password are correct
3. **Check Cluster Status**: Make sure your MongoDB Atlas cluster is not paused (free tier pauses after inactivity)
4. **Wait Longer**: Sometimes it takes 2-3 minutes for IP whitelist changes to propagate

### Error Messages
- **"Authentication failed"**: Check username/password in `.env` file
- **"Timeout"**: IP not whitelisted or cluster is paused
- **"ECONNREFUSED"**: IP not whitelisted

## Quick Test
After whitelisting, test the connection:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"OK","message":"VisualArt Backend is running","database":"connected","databaseName":"test"}
```
