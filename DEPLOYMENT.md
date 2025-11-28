# 🚀 Deployment Guide: Samruddhi Backend

**Last Updated:** November 28, 2025  
**Status:** Production-Ready ✅

This backend is a **Hybrid Node.js + Python** application. It requires a runtime environment that supports both languages to run the ML Bed Prediction Model.

---

## 📊 **What's Working (Deployment-Ready)**

### ✅ **Core Features Implemented & Tested:**

1. **Hospital Management** (25+ endpoints)

   - `/hospitals` - List hospitals with filters
   - `/hospitals/:id/dashboard` - Real-time capacity dashboard
   - `/beds` - Query available beds by type
   - `/doctors` - Find doctors by specialization
   - `/admissions` - Create/discharge patients (atomic operations)

2. **Consent Management** (Shared Redis Architecture)

   - `POST /consent/grant` - Patient grants consent
   - `POST /consent/revoke` - Instant revocation
   - `GET /consent/status/:id` - Check validity
   - `GET /consent/my` - Patient's consent list
   - `GET /consent/received` - Hospital's received consents
   - `GET /consent/:id/qr` - QR code generation

3. **EHR System** (MongoDB-backed)

   - Read endpoints: prescriptions, test-reports, medical-history, IoT devices
   - Write endpoints: Add prescriptions, test results, medical records
   - Consent middleware validates every access

4. **Patient Registration**

   - `POST /patients/register` - Register with ABHA ID
   - `GET /patients/search` - Find by ABHA/email
   - `PATCH /patients/:id` - Update profile

5. **ML Prediction** (Python + scikit-learn)

   - `POST /ml/predict/:hospitalId` - Bed demand forecasting
   - Weather + historical data integration

6. **Authentication** (Supabase Auth)
   - JWT validation middleware
   - Role-based access control
   - Custom claims (patient_id, hospital_id)

### ⚠️ **Known Limitations:**

- MongoDB returns empty arrays if no seed data exists (not an error)
- ML prediction requires Python dependencies (included in Docker)
- QR code generation works but requires auth token

---

## ❌ Why not Vercel?

Vercel is designed for **Serverless Functions**. It is **NOT suitable** for this project because:

1. **ML Dependencies:** Libraries like `pandas`, `scikit-learn`, and `xgboost` are too large for serverless function size limits (usually 50MB-250MB).
2. **Persistent Process:** The backend needs to spawn a Python process for predictions, which is difficult and slow in a serverless environment.
3. **Runtime:** Vercel supports Node.js OR Python functions, but running a Node.js server that _calls_ a Python script is complex and prone to timeouts on Vercel.

---

## ✅ Recommended: Render.com (Docker Deployment)

### **Prerequisites:**

1. GitHub account with repository pushed
2. Managed services provisioned:
   - **Supabase** project (Postgres + Auth)
   - **Upstash Redis** instance
   - **MongoDB Atlas** cluster

### **Step-by-Step Render Deployment:**

#### **1. Push Code to GitHub**

```bash
git add .
git commit -m "Production-ready deployment"
git push origin main
```

#### **2. Sign Up for Render**

- Go to [render.com](https://render.com)
- Sign up with GitHub (fastest)

#### **3. Create New Web Service**

- Dashboard → "New +" → "Web Service"
- Connect your GitHub account
- Select repository: `Samruddhi_Backend`
- Click "Connect"

#### **4. Configure Service Settings**

| Setting               | Value                                  |
| --------------------- | -------------------------------------- |
| **Name**              | `samruddhi-backend`                    |
| **Runtime**           | Docker                                 |
| **Region**            | Singapore (or closest to your users)   |
| **Branch**            | `main`                                 |
| **Instance Type**     | Starter ($7/month) or Free (slower ML) |
| **Dockerfile Path**   | `./Dockerfile` (auto-detected)         |
| **Health Check Path** | `/health/ready`                        |

#### **5. Add Environment Variables**

Click "Environment" tab and add these (copy from your `.env.local`):

```bash
# Required - Core
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Required - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # From Supabase dashboard
SUPABASE_SERVICE_ROLE=eyJhbGc...  # NEVER commit to git!

# Required - Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Required - MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/samruddhi_ehr

# Required - JWT Secret
JWT_SECRET=generate-with-openssl-rand-base64-32
```

**🔐 Security Tips:**

- Never commit `.env.local` to GitHub
- Use Render's "Secret File" feature for sensitive keys
- Rotate secrets regularly in production

#### **6. Deploy**

- Click "Create Web Service"
- Render will:
  1. Clone your repo
  2. Build Docker image (installs Node.js + Python deps)
  3. Run health checks
  4. Assign public URL: `https://samruddhi-backend.onrender.com`

**Build Time:** ~5-8 minutes (first build)

#### **7. Verify Deployment**

Test health endpoints:

```bash
# Check if server is alive
curl https://samruddhi-backend.onrender.com/health/live

# Check database connections
curl https://samruddhi-backend.onrender.com/health/ready

# Test hospitals endpoint
curl https://samruddhi-backend.onrender.com/hospitals?limit=3
```

Expected responses:

```json
{"status":"ok"}
{"status":"ready"}
[{"id":"...","name":"Apollo Hospital",...}]
```

---

## 🧪 **End-to-End Testing**

After deployment, run comprehensive tests:

### **Option 1: Use Provided Test Script**

```bash
# Update BASE_URL in scripts/test_consent_detailed.js
# Change from http://localhost:3000 to your Render URL

# Run full consent flow test
node scripts/test_consent_detailed.js
```

### **Option 2: Manual Testing via cURL**

```bash
# Set your Render URL
export API_URL="https://samruddhi-backend.onrender.com"

# 1. Test hospital discovery
curl "$API_URL/hospitals?limit=5"

# 2. Test patient registration (requires Supabase auth token)
curl -X POST "$API_URL/patients/register" \
  -H "Authorization: Bearer YOUR_PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "dob": "1990-01-01",
    "gender": "male",
    "address": {"street":"123 Test","city":"Mumbai","state":"MH","pincode":"400001"}
  }'

# 3. Test consent grant
curl -X POST "$API_URL/consent/grant" \
  -H "Authorization: Bearer YOUR_PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "YOUR_PATIENT_ID",
    "recipientId": "STAFF_ID",
    "recipientHospitalId": "HOSPITAL_ID",
    "scope": ["prescriptions"],
    "durationDays": 7
  }'

# 4. Test EHR access (requires both auth + consent tokens)
curl "$API_URL/ehr/patient/PATIENT_ID/prescriptions" \
  -H "Authorization: Bearer STAFF_JWT" \
  -H "X-Consent-Token: CONSENT_JWT"
```

---

## 🔧 **Troubleshooting**

### **Build Failures**

**Problem:** Docker build times out or fails  
**Solution:**

```bash
# Check Render logs for specific error
# Common issues:
# 1. Missing requirements.txt → Ensure Python deps listed
# 2. npm ci fails → Check package-lock.json is committed
# 3. TypeScript errors → Run `npm run build` locally first
```

**Problem:** Health check failing  
**Solution:**

```bash
# Verify environment variables are set correctly
# Check Render logs: Dashboard → Logs → Latest Deploy
# Look for database connection errors

# Common fixes:
# - SUPABASE_URL must include https://
# - MONGO_URI must have correct credentials
# - Redis URL must be Upstash REST endpoint
```

### **Runtime Errors**

**Problem:** 500 errors on EHR endpoints  
**Solution:** MongoDB connection timeout or empty collection (not an error)

```bash
# Check Render logs for "MongoDB connected successfully"
# If not appearing, verify MONGO_URI format
# Test MongoDB connection directly from Atlas dashboard
```

**Problem:** Consent endpoints returning 401  
**Solution:** Invalid Supabase JWT or missing auth middleware

```bash
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE are correct
# Test token validation: decode JWT at jwt.io
# Ensure Authorization header format: "Bearer <token>"
```

**Problem:** ML predictions fail  
**Solution:** Python dependencies missing or model file not found

```bash
# Check Dockerfile includes: pip3 install -r requirements.txt
# Verify requirements.txt has: pandas, numpy, scikit-learn, joblib
# Check logs for Python import errors
```

---

## 🚦 **Production Checklist**

Before going live:

- [ ] All environment variables set in Render dashboard
- [ ] Health checks passing (`/health/ready` returns 200)
- [ ] Database migrations applied to Supabase
- [ ] Seed data loaded (hospitals, beds, doctors)
- [ ] Redis connection tested (consent grant/revoke works)
- [ ] MongoDB accessible (EHR endpoints return data or empty arrays)
- [ ] CORS configured for your frontend domain
- [ ] Rate limiting enabled (add express-rate-limit if needed)
- [ ] Logging configured (check Render logs dashboard)
- [ ] Backup strategy for Supabase + MongoDB
- [ ] SSL/TLS enabled (automatic on Render)
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up (Render → Notifications)

---

## 📈 **Scaling & Performance**

### **Free Tier Limits:**

- Spins down after 15 min inactivity (cold starts ~30s)
- 512MB RAM, 0.1 CPU
- **Not recommended for production**

### **Starter Tier ($7/month):**

- Always on (no cold starts)
- 512MB RAM, 0.5 CPU
- Good for MVP and demo

### **Standard Tier ($25/month):**

- 2GB RAM, 1 CPU
- Recommended for production with ML predictions
- Faster build times

### **Horizontal Scaling:**

- Add more instances in Render dashboard
- Use load balancer (automatic on Render)
- Separate ML service if needed (deploy Python API separately)

---

## 🌐 **Custom Domain Setup**

1. Render Dashboard → Service Settings → Custom Domain
2. Add your domain: `api.samruddhi.health`
3. Update DNS records (Render provides instructions)
4. SSL auto-configured via Let's Encrypt

---

## 📦 **Alternative Platforms**

If Render doesn't work, try these (same Dockerfile works):

### **Railway.app**

```bash
railway login
railway init
railway up
railway variables set SUPABASE_URL=...
```

### **Fly.io**

```bash
flyctl launch
flyctl secrets set SUPABASE_URL=...
flyctl deploy
```

### **DigitalOcean App Platform**

- Similar to Render
- Upload Dockerfile via dashboard
- Set env vars in UI

### **AWS ECS / Azure App Service**

- More complex but enterprise-grade
- Requires container registry (ECR/ACR)
- Best for large-scale production

---

## 🔒 **Security Best Practices**

1. **Secrets Management:**

   - Never commit `.env.local` or secrets to Git
   - Use Render's environment variable encryption
   - Rotate JWT_SECRET monthly

2. **Database Security:**

   - Enable Supabase Row Level Security (RLS)
   - Use MongoDB IP whitelist (add Render IPs)
   - Limit Redis access to your backend only

3. **API Security:**

   - Add rate limiting: `npm install express-rate-limit`
   - Enable CORS only for trusted domains
   - Validate all inputs with Zod schemas (already done)
   - Use HTTPS only (automatic on Render)

4. **Monitoring:**
   - Enable Render log retention
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure Sentry for error tracking

---

## 🆘 **Support & Resources**

- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Upstash Redis:** https://docs.upstash.com
- **MongoDB Atlas:** https://docs.atlas.mongodb.com

**Need Help?**

- Check Render logs: Dashboard → Logs
- Test locally first: `npm run dev`
- Verify env vars: `render console` (CLI)

---

## 📝 **Post-Deployment Tasks**

After successful deployment:

1. **Update Frontend Config:**

   ```javascript
   // frontend/src/config.js
   export const API_URL = "https://samruddhi-backend.onrender.com";
   ```

2. **Test Mobile App Integration:**

   - Update base URL in mobile app
   - Test consent flow with QR codes
   - Verify real-time revocation works

3. **Load Test Data:**

   ```bash
   # Update BASE_URL in scripts
   node scripts/seed_complete_data.js
   ```

4. **Monitor First Week:**
   - Check error rates in Render dashboard
   - Monitor response times
   - Verify no cold start issues (if using paid tier)

---

## ✅ **Quick Deploy Checklist**

Use this for rapid deployment:

```bash
# 1. Ensure code is ready
npm run build  # Should pass
npm run lint   # Should pass

# 2. Commit and push
git add .
git commit -m "Deploy to Render"
git push origin main

# 3. Create Render service (via dashboard)
# - Connect GitHub repo
# - Select Docker runtime
# - Add env vars from .env.local

# 4. Wait for build (~5-8 min)

# 5. Test endpoints
curl https://your-app.onrender.com/health/ready

# 6. Run E2E tests
node scripts/test_consent_detailed.js

# ✅ DONE!
```

---

**🎉 Your Samruddhi Backend is now live and production-ready!**

For CI/CD automation, see `.github/workflows/deploy.yml` (coming soon).

5. **Environment Variables:**
   Add these in the "Environment" tab:

   - `SUPABASE_URL`: (Your Supabase URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Your Service Role Key)
   - `GOOGLE_API_KEY`: (Your Google API Key for weather)
   - `NODE_ENV`: `production`

6. **Deploy!**
   Render will build the Docker image (installing Node + Python) and start the server.

---

### Option B: Deploy on Railway

1. **Sign up for [Railway.app](https://railway.app)**
2. **New Project** → **Deploy from GitHub repo**.
3. Railway automatically detects the `Dockerfile`.
4. Go to **Variables** and add your `.env` secrets.
5. Railway will build and deploy.

---

## 🛠️ Verifying Deployment

Once deployed, test the health endpoint:
`GET https://your-app-name.onrender.com/health`

Test the ML Prediction:
`POST https://your-app-name.onrender.com/ml/predict/:hospitalId`
