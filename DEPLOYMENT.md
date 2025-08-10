# 🚀 Deployment Guide for Habit Tracker App

## **Option 1: Frontend on Vercel + Backend on Alternative (Recommended)**

### **Step 1: Deploy Frontend to Vercel**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project root:**
   ```bash
   vercel --prod
   ```

4. **Configure environment variables in Vercel dashboard:**
   - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://your-app.railway.app`)
   - `VITE_VAPID_PUBLIC_KEY`: Your VAPID public key for push notifications

### **Step 2: Deploy Backend to Railway (Recommended)**

1. **Create Railway account** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Set environment variables:**
   - `NODE_ENV=production`
   - `PORT=5000`
   - `SESSION_SECRET`: A secure random string
4. **Deploy automatically** on git push

### **Step 3: Update Frontend Environment**

After getting your backend URL, update the environment variable in Vercel dashboard.

---

## **Option 2: Full-Stack on Vercel (Advanced)**

### **Convert Express Backend to Vercel API Routes**

1. **Create `api/` directory in project root:**
   ```
   api/
   ├── habits/
   │   ├── index.ts
   │   └── [id].ts
   ├── completions/
   │   └── [habitId]/
   │       └── [date].ts
   └── notifications/
       └── index.ts
   ```

2. **Move server logic to API routes**
3. **Update database connection for serverless**

---

## **Environment Variables Setup**

### **Frontend (Vercel)**
```env
VITE_API_BASE_URL=https://your-backend-url.railway.app
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### **Backend (Railway)**
```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_secure_session_secret
DATABASE_URL=your_database_connection_string
```

---

## **Database Considerations**

### **For Production:**
- **PostgreSQL**: Use Railway's PostgreSQL service
- **MongoDB Atlas**: Free tier available
- **Supabase**: Free tier with PostgreSQL

### **Update Database Connection:**
```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'your_fallback_connection';
const client = postgres(connectionString);
export const db = drizzle(client);
```

---

## **PWA Configuration for Production**

### **Update Service Worker:**
```javascript
// client/public/sw.js
const CACHE_NAME = 'habitflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];
```

### **HTTPS Required:**
- Vercel provides HTTPS automatically
- Ensure backend also uses HTTPS

---

## **Deployment Commands**

### **Build and Test Locally:**
```bash
npm run build
npm run preview
```

### **Deploy to Vercel:**
```bash
vercel --prod
```

### **Update Environment Variables:**
```bash
vercel env add VITE_API_BASE_URL
vercel env add VITE_VAPID_PUBLIC_KEY
```

---

## **Post-Deployment Checklist**

- [ ] Frontend loads without errors
- [ ] API calls work (check network tab)
- [ ] PWA install button appears
- [ ] Service worker registers successfully
- [ ] Push notifications work (if implemented)
- [ ] Database connections are stable
- [ ] Environment variables are set correctly

---

## **Troubleshooting**

### **Common Issues:**
1. **CORS errors**: Ensure backend allows your Vercel domain
2. **API 404s**: Check environment variables and API routes
3. **PWA not working**: Verify HTTPS and service worker
4. **Database connection**: Check connection strings and credentials

### **Useful Commands:**
```bash
# Check Vercel deployment status
vercel ls

# View deployment logs
vercel logs

# Redeploy
vercel --prod
```

---

## **Cost Estimation**

- **Vercel (Frontend)**: Free tier available, $20/month for Pro
- **Railway (Backend)**: $5/month for starter plan
- **Database**: Free tier available on most platforms
- **Total**: ~$5-25/month depending on usage

---

## **Next Steps**

1. Choose your deployment option
2. Set up backend hosting (Railway recommended)
3. Deploy frontend to Vercel
4. Configure environment variables
5. Test all functionality
6. Set up custom domain (optional)

Need help with any specific step? Let me know!
