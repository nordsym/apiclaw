# 🎬 Video Demo Setup Guide

## ✅ What's Ready

**Component created:** `landing/src/components/VideoDemo.tsx`
**Integrated:** Landing page (`landing/src/app/page.tsx`)
**Position:** Floating bubble, bottom-right corner
**Animation:** Pulse effect + hover expand

## 📹 Tomorrow Morning - Steps

### 1. Record with Tella
- Open Tella on Mac
- Record 2-minute demo:
  - Install: `npx @nordsym/apiclaw mcp-install`
  - Show workspace
  - Make an API call
  - Show it working
- Upload to Tella & get embed URL

### 2. Update Component

Open: `landing/src/components/VideoDemo.tsx`

**Line 14** - Replace:
```tsx
videoUrl = "PASTE_TELLA_URL_HERE"
```

With your Tella embed URL (format: `https://www.tella.tv/video/...`)

### 3. Deploy

```bash
cd ~/Projects/apiclaw/landing
npm run build
npx vercel --prod --yes
```

## 🎨 Styling

**Already styled to match APIClaw design:**
- Red accent (#ef4444)
- Pulse animation
- Clean modal
- Mobile responsive
- Dark mode compatible

## 📝 Video Content Suggestion

**0:00-0:20** - "I'm going to show you how to use APIClaw in 2 minutes"
**0:20-0:40** - Install command + MCP setup
**0:40-1:20** - Open workspace, discover APIs, make call
**1:20-1:40** - Show response, explain Direct Call
**1:40-2:00** - "That's it. No API keys needed. Go to apiclaw.cloud"

## 🔧 Optional Customization

**Change button text:**
```tsx
// In VideoDemo.tsx, line 28
<span>Watch Demo</span>  // Change this
```

**Change video title:**
```tsx
// In VideoDemo.tsx, line 65
<h3>🦞 APIClaw Quick Start</h3>  // Change this
```

## ✨ Features

- ✅ Floating button (always visible while scrolling)
- ✅ Click to open full-screen modal
- ✅ Click outside to close
- ✅ ESC key support
- ✅ Responsive (works on mobile)
- ✅ Smooth animations

## 🚀 Ready to Go!

Just record the video and paste the URL. Everything else is done.
