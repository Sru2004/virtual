# If data is not storing in the database

1. **Check backend connection**  
   Open in browser: **http://localhost:5000/api/health**
   - If `"database": "disconnected"` → backend is not connected to Atlas. Continue below.
   - If `"database": "connected"` and `"databaseName": "test"` → backend is connected; signup should save to Atlas.

2. **Whitelist your IP in Atlas**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com) → **Network Access** → **Add IP Address**.
   - Add your current IP address (run `npm run check-db` to see your IP) or use "Add Current IP Address"
   - Example: **152.58.14.228/32** (your IP may be different - check with the diagnostic script)
   - Wait ~1 minute, then restart the backend.

3. **Restart backend so it connects to Atlas**
   From the `backend` folder run:
   ```bash
   npm run start:fresh
   ```
   In the console you should see:
   - `✅ MongoDB connected (MONGODB_URI): database "test"`
   - `Backend ready. Data will be saved to Atlas database "test"`

4. **Try signup again**  
   In the backend console you should see:
   - `[Auth] Register: email=..., DB connected=true, database=test`
   - `[Auth] User saved to database "test", collection "users", id: ...`  
   If you see `[503] Request rejected` instead, the backend is not connected to the database — repeat steps 2–3.
