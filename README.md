# Billing & Inventory Software (Firebase + Netlify)

A modern, high-performance web application for Enterprise Billing, Inventory Tracking, Customer & Supplier Ledger Management, and Financial Analytics.

---

## Architecture & Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Glassmorphism CSS Design System, Chart.js for Visual Analytics.
- **Backend / Database**: **Firebase Firestore** real-time database with local caching fallback mode.
- **Hosting**: **Netlify** static deployment configured via `netlify.toml`.
- **Version Control**: **Git / GitHub**.

---

## 1. GitHub Integration Setup

To connect this repository to your GitHub account:

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `billing-software`).
2. Open your terminal in this directory (`c:\Users\USER\Music\Billing Software`) and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/billing-software.git
git branch -M main
git push -u origin main
```

---

## 2. Firebase Configuration

To connect live Firebase Firestore database:

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a **Web App** under Project Settings.
3. Open `js/firebase-config.js` in this workspace and replace the values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 3. Netlify Deployment

1. Login to [Netlify](https://app.netlify.com/).
2. Click **Add new site** -> **Import from an existing project**.
3. Select **GitHub** and pick your `billing-software` repository.
4. Keep build settings default (publish directory: `.`) and click **Deploy site**.
5. Your app will automatically deploy and remain synchronized with every `git push`!
