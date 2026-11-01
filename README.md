# 📦 BorrowBox - Community Rental Marketplace

BorrowBox is a modern peer-to-peer equipment and items rental marketplace built with React 19, TypeScript, Tailwind CSS, Express, and Google Gemini AI.

---

## 🚀 Live Deployment Options

### 1. Full-Stack Deployment (Render - Recommended)
Deploy the full-stack server (Frontend + Express API + Support Backend) on Render with 1 click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/gaureshsharma/borrow-box)

- **Build Command:** `npm install --legacy-peer-deps && npm run build`
- **Start Command:** `npm start`
- **Node Version:** 20+

### 2. GitHub Pages (Static Frontend Preview)
This repository includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) for automated static deployment.
To enable:
1. Go to repository **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and deploy the frontend.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
# Install dependencies
npm install --legacy-peer-deps

# Create .env from template
cp .env.example .env

# Run local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Environment Variables
Create a `.env` file in the root directory:
```env
# Gemini API Key for descriptions, price suggestions, & moderation
GEMINI_API_KEY=your_gemini_api_key

# Firebase Client API Key
FIREBASE_API_KEY=your_firebase_api_key
```

