# ThreadMart - Clothing Marketplace PRD

## Original Problem Statement
24-hour hackathon project: Build a clothing marketplace website that aggregates products from various stores using Google Shopping search.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, shadcn/ui components
- **Backend**: FastAPI with MongoDB
- **Search**: Google Shopping via SerpAPI integration

## User Personas
1. **Shoppers** - Looking for clothing deals across multiple stores
2. **Comparison shoppers** - Want to compare prices from different retailers

## Core Requirements (Static)
- [x] Search functionality for clothing products
- [x] Product grid display with images, prices, store names
- [x] Product detail modal with "Go to Website" button
- [x] Dark theme UI
- [x] Trending searches for discovery

## What's Been Implemented
**Jan 2026 - MVP**
- Complete frontend with ThreadMart branding
- Search bar with trending tags
- Product card grid with hover effects
- Product detail modal with ratings, delivery info, CTA button
- Backend API with Google Shopping integration via SerpAPI
- Search history stored in MongoDB
- Error handling for missing API key

## Configuration Required
- `SERPAPI_KEY` in `/app/backend/.env` - User has key, needs to add it

## Prioritized Backlog
**P0 (Critical)**
- [ ] User adds their SerpAPI key to enable search

**P1 (Important)**
- [ ] Add filters (price range, store, rating)
- [ ] Wishlist/favorites functionality
- [ ] Recent searches display

**P2 (Nice to have)**
- [ ] User accounts
- [ ] Price alerts
- [ ] Share functionality

## Tech Stack
- React 19, Tailwind CSS 3.4, shadcn/ui
- FastAPI, Motor (MongoDB async driver)
- SerpAPI for Google Shopping

## Next Tasks
1. Add SerpAPI key and test search
2. Consider adding price filters
3. Add wishlist feature for hackathon demo
