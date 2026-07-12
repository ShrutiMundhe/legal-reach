# ✅ Firebase + Jitsi Setup Guide

## 🚀 Quick Setup (2 minutes)

### Step 1: Create Firebase Project
1. Go to: https://console.firebase.google.com/
2. Click "Add project"
3. Name it: `legalreach-firebase`
4. Click "Create project"

### Step 2: Get Firebase Credentials
1. In Firebase Console, go to **Settings** (⚙️) → **Project settings**
2. Scroll to **Your apps** section
3. Click **Web** (if not showing, click **Add app**)
4. Copy the firebaseConfig values

Your config will look like:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXX",
  authDomain: "legalreach-firebase.firebaseapp.com",
  databaseURL: "https://legalreach-firebase-default-rtdb.firebaseio.com",
  projectId: "legalreach-firebase",
  storageBucket: "legalreach-firebase.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

### Step 3: Enable Realtime Database
1. In Firebase Console, go to **Realtime Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Click **Enable**

### Step 4: Update .env File
Edit `frontend/.env` and replace the placeholder values:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=legalreach-firebase.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://legalreach-firebase-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=legalreach-firebase
VITE_FIREBASE_STORAGE_BUCKET=legalreach-firebase.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 5: Start the Project
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npx vite --host
```

### Step 6: Test on Mobile
1. On mobile, go to: `http://192.168.31.123:5173`
2. Login with any account
3. Find another lawyer/client
4. Click **Chat** or **Video Call**
5. Messages should sync **instantly** across devices!
6. Video calls open **Jitsi Meet** (works worldwide)

---

## ✨ Features Now Working
✅ **Real-time Chat** - Firebase Realtime Database
✅ **Video Calls** - Jitsi Meet (free, no setup needed)
✅ **Cross-Device Sync** - Changes appear instantly
✅ **Mobile & Desktop** - Works on same network
✅ **All CSS Preserved** - Exact same styling

---

## 🔧 Troubleshooting

### Messages not appearing?
- Check Firebase Database URL in `.env`
- Verify database is in "Test mode"
- Hard refresh browser: `Ctrl+Shift+R`

### Video calls not working?
- Jitsi works globally - no setup needed
- Both users just need internet connection
- Works on mobile, desktop, tablets

### Different network?
- Change `VITE_API_BASE_URL` in `.env` to your laptop IP
- For Firebase: works anywhere (cloud-based)

---

## 📱 To Scale This:
- Switch Firebase from "Test mode" → "Production rules"
- Add Firebase Authentication (optional)
- Keep using Jitsi Meet (it's free for unlimited meetings!)

Enjoy! 🎉
