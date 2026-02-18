# MongoDB Setup Guide for Deployment

This guide explains how to set up MongoDB Atlas (cloud) for your deployed application. Local MongoDB won't work for deployment because it's only accessible from the machine it runs on.

## Quick Summary

| Step | Action                       | Time   |
| ---- | ---------------------------- | ------ |
| 1    | Create MongoDB Atlas Account | 2 min  |
| 2    | Create Free Cluster          | 3 min  |
| 3    | Get Connection String        | 1 min  |
| 4    | Whitelist IP Address         | 1 min  |
| 5    | Update .env file             | 1 min  |
| 6    | Restart Backend              | 30 sec |

---

## Step 1: Create MongoDB Atlas Account

1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"** or **"Start Free"**
3. Sign up with your email (Google, GitHub, or email)
4. Verify your email

---

## Step 2: Create a Free Cluster

1. After logging in, click **"Create a Deployment"**
2. Select **"Free"** (M0) tier
3. Choose a **Cloud Provider** (AWS, Google Cloud, or Azure)
4. Select a **Region** closest to you
5. Click **"Create Deployment"**
6. Wait 1-3 minutes for cluster creation

---

## Step 3: Get Connection String

1. Click **"Connect"** on your cluster
2. Select **"Connect your application"**
3. You'll see a connection string like:

```
   mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority

```

4. Copy this connection string
5. Replace `<username>` and `<password>` with your database user credentials

---

## Step 4: Create Database User (if not done)

1. In Atlas, go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose authentication method: **"Password"**
4. Enter username and password
5. For permissions, select **"Read and Write to any database"**
6. Click **"Add User"**

---

## Step 5: Whitelist IP Address

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For **development/testing**: Add `0.0.0.0/0` (allows access from anywhere)
4. For **production**: Add your specific IP address
5. Click **"Confirm"**

> ⚠️ **Important**: Run `npm run check-db` in the backend folder to see your current IP address, then add that IP with `/32` suffix (e.g., `152.58.14.228/32`).

---

## Step 6: Update .env File

1. Copy the `.env.example` file to `.env`:

```
   copy .env.example .env

```

(or on Mac/Linux: `cp .env.example .env`)

2. Open `.env` in a text editor

3. Replace the MONGODB_URI line with your Atlas connection string:

```
env
   # Before (default):
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority

   # After (example):
   MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority

```

4. Also update JWT_SECRET for security:

```
env
   JWT_SECRET=some_random_string_at_least_32_characters_long

```

---

## Step 7: Restart Backend

From the backend folder, run:

```
bash
# Install dependencies (first time only)
npm install

# Start the server
npm run start:fresh
```

Or if you have a start script:

```
bash
npm run start
```

---

## Verify Connection

1. Check the terminal output for:

```
   ✅ MongoDB connected (MONGODB_URI): database "yourdbname" — data will be saved here.

```

2. Visit: `http://localhost:5000/api/health`
   - Should show: `{ "status": "OK", "database": "connected" }`

---

## Troubleshooting

### Error: "Authentication failed"

- Double-check username and password in MONGODB_URI
- Make sure database user is created in "Database Access"

### Error: "Timeout"

- Check if IP is whitelisted in "Network Access"
- Make sure cluster is deployed and not paused

### Error: "ECONNREFUSED"

- IP not whitelisted
- Cluster might be paused (free tier pauses after inactivity)

### Still Not Working?

1. Check your public IP at: https://whatismyipaddress.com
2. Add that IP to Network Access
3. Or use `0.0.0.0/0` for testing

---

## For Vercel/Render Deployment

When deploying to Vercel, Render, or similar platforms:

1. Add `MONGODB_URI` in your hosting provider's environment variables
2. Make sure Network Access allows the hosting provider's IPs (or use `0.0.0.0/0`)
3. Redeploy after adding environment variables

---

## Security Notes

- ✅ Never commit `.env` file to Git
- ✅ Use strong JWT_SECRET in production
- ✅ Consider restricting Network Access to specific IPs in production
- ✅ Rotate database passwords periodically
