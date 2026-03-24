# The Finishing Touch LLC — CRM + AI Platform

## Client
The Finishing Touch LLC — Concrete, post frames, landscaping, firewood.
Greentown, Indiana. 25+ years in business.
Website: thefinishingtouchllc.com

## Stack
- Next.js + TypeScript + Tailwind CSS
- Supabase (auth, database, storage)
- Vercel (hosting)
- Resend (email marketing)
- OpenAI / Anthropic (AI features)

## Core Modules

### 1. CRM & Pipeline
- Lead management with pipeline stages: New → Contacted → Quoted → Booked → In Progress → Completed → Lost
- Customer profiles: name, phone, email, address, project history, notes
- AI agent can move leads through pipeline automatically based on interactions
- Activity log per customer (calls, emails, quotes, payments)
- Search and filter by stage, date, service type

### 2. AI Estimator (Internal)
- Crew inputs project details: type (patio, driveway, curbing, post frame), dimensions, materials
- AI generates cost estimate based on historical pricing data and project parameters
- Estimate output includes materials, labor, timeline, total cost
- Generate professional PDF quote from estimate
- Send quote to customer via email link

### 3. AI Agents
- Lead follow-up agent: automatically follows up with new leads that haven't responded
- Quote follow-up agent: nudges customers who received a quote but haven't booked
- Review request agent: asks completed customers for Google reviews
- Website chatbot: answers common questions (pricing ranges, service area, scheduling)
- All agents log their actions to the CRM activity feed

### 4. Email Marketing
- Contact list management (import, tag, segment)
- Template builder (drag and drop or pre-built templates)
- Campaign creation and scheduling
- Automated drip sequences (new lead, post-quote, post-project)
- Open/click tracking
- Unsubscribe management
- Powered by Resend

### 5. Invoicing & Payments
- Generate professional invoice/payment links
- Send via email with read receipts
- Stripe integration for payments
- Payment status tracking in CRM (unpaid, partial, paid)
- No client portal — just clean payment links

### 6. Dashboard
- Overview: leads this month, quotes sent, jobs booked, revenue
- Pipeline visualization
- AI agent activity summary
- Upcoming follow-ups and tasks
- Quick actions: add lead, create estimate, send invoice

## Branding
- Colors from thefinishingtouchllc.com: dark navy/charcoal, white, accent blue
- Logo: The Finishing Touch LLC logo
- Clean, professional, contractor-friendly UI (not overly fancy)

## Auth
- Internal team only (no customer-facing portal)
- Supabase auth with email/password
- Role-based: Admin, Manager, Crew

### 7. AI Vision Studio (Image Generator)
- Customer or team member uploads a photo of their space (driveway, yard, backyard, etc.)
- Selects what they want: patio, driveway, stamped concrete, post frame, landscaping, curbing
- System auto-optimizes their prompt behind the scenes for best output
  - Takes the raw input ("I want a patio here") and enriches it with context (dimensions from photo, style matching, realistic materials, proper lighting/shadows)
- Gemini image generation creates a realistic visualization of the finished project overlaid on their actual space
- After initial render, AI suggests add-ons:
  - "Would you like to see it with landscape lighting?"
  - "Want to add flower beds along the edges?"
  - "How about a fire pit in the center?"
  - "Add a post frame garage in the background?"
- Each add-on generates a new image iteration
- Save all iterations to the customer's CRM profile
- Can be used internally (crew showing customers during estimates) or sent as a link
- Powered by Gemini image generation API

## Priority Order
1. CRM + Pipeline (foundation everything else builds on)
2. AI Estimator
3. AI Vision Studio (huge differentiator — sells jobs)
4. Invoicing & Payment Links
5. AI Agents
6. Email Marketing
7. Dashboard (build incrementally as modules come online)
