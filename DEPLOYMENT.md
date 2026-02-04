# Hattemanden Dashboard - Deployment Guide

## Quick Deploy to Railway (Recommended)

### Step-by-Step Instructions

1. **Create a GitHub Repository**
   ```bash
   cd .planning/dashboard
   git init
   git add .
   git commit -m "Initial dashboard commit"
   ```
   Then create a new repo at github.com and push to it.

2. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your dashboard repository

4. **Add Environment Variables**
   Go to your project → Variables tab → Add these:
   ```
   WC_URL=https://hattemanden.dk
   WC_CONSUMER_KEY=ck_your_key_here
   WC_CONSUMER_SECRET=cs_your_secret_here
   DASHBOARD_PASSWORD=pick_a_password_for_kim
   ```

5. **Generate Domain**
   - Go to Settings → Domains
   - Click "Generate Domain"
   - You'll get a URL like: `hattemanden-dashboard.up.railway.app`

6. **Share with Client**
   Send Kim:
   - The URL
   - The password you set

---

## Overview

This document outlines deployment options for the Hattemanden dashboard to provide a shareable URL for the client.

## Current Stack

- **Runtime:** Node.js (Express server)
- **Frontend:** Static HTML/CSS/JS
- **API:** WooCommerce REST API integration
- **Data:** Local JSON files for decisions/answers/progress

## Environment Variables Required

```env
WC_URL=https://hattemanden.dk
WC_CONSUMER_KEY=ck_xxxxx
WC_CONSUMER_SECRET=cs_xxxxx
DASHBOARD_PASSWORD=your_secure_password  # Optional but recommended
PORT=3000  # Optional, defaults to 3000
```

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- Free tier available
- Easy deployment from Git
- Automatic HTTPS
- Fast global CDN

**Cons:**
- Requires serverless adapter for Express
- Environment variables managed via dashboard

**Setup:**
1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Install Vercel CLI: `npm i -g vercel`
3. Run: `vercel` in the dashboard directory
4. Set environment variables in Vercel dashboard

**Estimated Cost:** Free (within limits)

---

### Option 2: Railway

**Pros:**
- Simple Node.js deployment
- Git integration
- Good free tier
- Supports environment variables easily

**Cons:**
- $5/month after free tier (500 hours)
- Limited resources on free plan

**Setup:**
1. Connect GitHub repo
2. Select the `.planning/dashboard` directory
3. Add environment variables
4. Deploy

**Estimated Cost:** Free tier / $5+/month

---

### Option 3: Render

**Pros:**
- Free tier with auto-sleep
- Simple setup for Node.js
- Automatic builds from Git

**Cons:**
- Free tier sleeps after 15 min of inactivity
- Cold start delays (~30s)

**Setup:**
1. Create new Web Service
2. Connect repository
3. Set root directory to `.planning/dashboard`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables

**Estimated Cost:** Free (with sleep) / $7/month (always on)

---

### Option 4: VPS (DigitalOcean, Hetzner, etc.)

**Pros:**
- Full control
- No cold starts
- Can host multiple services
- Better for production long-term

**Cons:**
- More setup required
- Manual SSL/domain configuration
- Requires maintenance

**Setup:**
1. Create VPS (Ubuntu recommended)
2. Install Node.js
3. Clone repository
4. Set up PM2 for process management
5. Configure Nginx reverse proxy
6. Set up SSL with Let's Encrypt

**Estimated Cost:** $4-6/month minimum

---

## Recommended Approach

For the Hattemanden client dashboard:

1. **Development/Testing:** Continue using `localhost:3001`
2. **Client Preview:** Deploy to **Render** (free tier with sleep is acceptable for client review)
3. **Production:** Consider **Railway** or **VPS** if always-on is needed

## Security Considerations

1. **Always enable password protection** (`DASHBOARD_PASSWORD` env variable)
2. **Never commit `.env` files** - they contain API credentials
3. **Use HTTPS** - all recommended platforms provide this
4. **Limit WooCommerce API key permissions** to read-only if possible

## Quick Deploy Checklist

- [ ] Create deployment platform account
- [ ] Connect Git repository
- [ ] Set environment variables:
  - [ ] `WC_URL`
  - [ ] `WC_CONSUMER_KEY`
  - [ ] `WC_CONSUMER_SECRET`
  - [ ] `DASHBOARD_PASSWORD`
- [ ] Deploy
- [ ] Test deployed version
- [ ] Share URL with client

## Example Deployed URLs

When deployed, the dashboard will be available at a URL like:
- Vercel: `https://hattemanden-dashboard.vercel.app`
- Railway: `https://hattemanden-dashboard.up.railway.app`
- Render: `https://hattemanden-dashboard.onrender.com`

---

*Document created: 2026-02-03*
*Plan: 10-07, Task 13*
