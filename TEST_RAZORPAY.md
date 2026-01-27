# 🧪 Razorpay Local Testing Guide with ngrok

## Quick Start (5 minutes)

### 1. Install ngrok
```bash
# macOS
brew install ngrok

# OR download from https://ngrok.com/download
```

### 2. Setup ngrok (one-time)
```bash
# Sign up at https://dashboard.ngrok.com/signup
# Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### 3. Start Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install razorpay if not already installed
pip install razorpay==1.4.1

# Run migrations (first time only)
alembic revision --autogenerate -m "Add wallet and payment models"
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
🔓 CORS: Development mode with ngrok support enabled
```

### 4. Start ngrok (in new terminal)
```bash
ngrok http 8000
```

**Copy the HTTPS forwarding URL**, something like:
```
https://abc123def456.ngrok-free.app
```

### 5. Update Frontend Config
Create `frontend/.env.local`:
```bash
VITE_API_BASE_URL=https://abc123def456.ngrok-free.app
```

Replace with YOUR actual ngrok URL!

### 6. Start Frontend
```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

### 7. Configure Razorpay Webhook

1. Go to **Razorpay Dashboard** → https://dashboard.razorpay.com/
2. Click **Settings** → **Webhooks**
3. Click **"+ Create New Webhook"**
4. Enter:
   - **Webhook URL**: `https://YOUR-NGROK-URL.ngrok-free.app/api/v1/wallet/webhook`
   - **Alert Email**: your@email.com
5. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ payout.processed
   - ✅ payout.failed
6. Click **Create Webhook**
7. **IMPORTANT**: Copy the **Webhook Secret** (starts with `whsec_`)
8. Update `backend/.env`:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```
9. Restart your backend server

---

## 🧪 Test Payment Flow

### Step 1: Navigate to Wallet
Open: http://localhost:5173/dashboard/wallet

### Step 2: Add Money
1. Click **"Add Money"** button
2. Enter amount: **100** (₹100)
3. Click **"Proceed to Pay"**
4. Razorpay checkout will open

### Step 3: Use Test Card
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: `123`
- **Expiry**: `12/25` (any future date)
- **Name**: Any name
- Click **"Pay Now"**

### Step 4: Verify Success
- You should see: "Payment successful! Wallet credited."
- Wallet balance should show: ₹100.00
- Transaction should appear in history

---

## 🔍 Debugging Tools

### 1. ngrok Web Interface
Open: http://127.0.0.1:4040

View all HTTP requests including:
- Payment verification calls
- Webhook events from Razorpay

### 2. Backend Logs
Watch your backend terminal for:
```
INFO: Payment completed: Transaction 1, Amount: 100.0
INFO: 127.0.0.1 - "POST /api/v1/wallet/verify-payment HTTP/1.1" 200 OK
```

### 3. Razorpay Dashboard
- Go to **Payments** → View all test payments
- Go to **Webhooks** → View webhook delivery logs
- Check if webhooks are being delivered successfully

### 4. Browser DevTools
- Open **Network** tab
- Look for failed API calls
- Check console for errors

---

## ✅ Test Checklist

- [ ] Backend running on port 8000
- [ ] ngrok tunnel active
- [ ] Frontend using ngrok URL in `.env.local`
- [ ] Can access FastAPI docs at: `https://YOUR-NGROK-URL.ngrok-free.app/docs`
- [ ] Razorpay webhook configured
- [ ] Webhook secret in `.env`
- [ ] Backend restarted after adding webhook secret
- [ ] Can see wallet page at http://localhost:5173/dashboard/wallet
- [ ] "Add Money" modal opens
- [ ] Razorpay checkout opens
- [ ] Test payment completes
- [ ] Wallet balance increases
- [ ] Transaction appears in history
- [ ] Backend logs show payment completion
- [ ] ngrok shows webhook received (at localhost:4040)

---

## 🐛 Common Issues

### Issue: "CORS Error"
**Solution**: Make sure backend shows:
```
🔓 CORS: Development mode with ngrok support enabled
```
If not, check `backend/.env` has `ALLOW_NGROK=true`

### Issue: "Payment verification failed"
**Solution**:
1. Check Razorpay keys in `backend/.env`
2. Ensure keys start with `rzp_test_`
3. Check backend logs for specific error

### Issue: "Webhook not received"
**Solution**:
1. Check ngrok is still running (URLs expire if ngrok restarts)
2. Verify webhook URL in Razorpay dashboard matches current ngrok URL
3. Check webhook secret is correct in `.env`
4. Restart backend after updating webhook secret

### Issue: "Invalid signature"
**Solution**:
1. Check `RAZORPAY_KEY_SECRET` matches your dashboard
2. Webhook secret must match Razorpay's generated secret
3. Don't use your API secret as webhook secret (they're different)

### Issue: ngrok URL changes
**Solution**:
- Free ngrok gives you a new URL each restart
- Update `frontend/.env.local` with new URL
- Update Razorpay webhook URL
- Restart frontend

### Issue: "Transaction not found"
**Solution**: Database migration might have failed
```bash
cd backend
alembic upgrade head
```

---

## 🎯 Expected Behavior

### Successful Payment Flow:
1. **Frontend** → Creates order → Backend returns order_id
2. **Frontend** → Opens Razorpay checkout
3. **User** → Completes payment
4. **Razorpay** → Returns payment details to frontend
5. **Frontend** → Sends verification request to backend
6. **Backend** → Verifies signature → Credits wallet → Returns success
7. **Razorpay** → Sends webhook to backend (async)
8. **Backend** → Receives webhook → Logs event

### Backend Logs (Success):
```
INFO: Created Razorpay order: order_ABC123
INFO: Payment completed: Transaction 1, Amount: 100.0
INFO: 127.0.0.1 - "POST /api/v1/wallet/topup HTTP/1.1" 200 OK
INFO: 127.0.0.1 - "POST /api/v1/wallet/verify-payment HTTP/1.1" 200 OK
INFO: Payment captured: pay_XYZ789
INFO: 127.0.0.1 - "POST /api/v1/wallet/webhook HTTP/1.1" 200 OK
```

### ngrok Interface (localhost:4040):
You should see:
- POST /api/v1/wallet/topup → 200
- POST /api/v1/wallet/verify-payment → 200
- POST /api/v1/wallet/webhook → 200 (from Razorpay)

---

## 🚀 Ready for Production

When moving to production:

1. **Update `.env`**:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
   RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
   RAZORPAY_MODE=live
   ALLOW_NGROK=false  # Disable ngrok
   ```

2. **Update Webhook URL**:
   Change from ngrok to production URL:
   ```
   https://minimalthreads.in/api/v1/wallet/webhook
   ```

3. **Test with Real Money**:
   - Start with small amount (₹10)
   - Use real card
   - Verify wallet updates
   - Check webhook delivery

---

## 📞 Need Help?

### Quick Diagnostics:
```bash
# Check if backend is accessible
curl https://YOUR-NGROK-URL.ngrok-free.app/health

# Check if wallet endpoint works
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR-NGROK-URL.ngrok-free.app/api/v1/wallet/balance

# Test webhook endpoint
curl -X POST https://YOUR-NGROK-URL.ngrok-free.app/api/v1/wallet/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test" \
  -d '{"event": "test"}'
```

### Logs to Check:
1. **Backend Terminal**: Payment processing logs
2. **ngrok Interface** (localhost:4040): HTTP traffic
3. **Razorpay Dashboard**: Payment status, webhook logs
4. **Browser Console**: Frontend errors

---

## 🎉 Success Indicators

You know it's working when:
- ✅ Wallet balance updates immediately after payment
- ✅ Transaction appears in history with "completed" status
- ✅ Backend logs show "Payment completed"
- ✅ ngrok shows POST to /wallet/webhook from Razorpay
- ✅ Razorpay dashboard shows payment as "Captured"
- ✅ Webhook delivery shows "Success" in Razorpay

Happy Testing! 🚀
