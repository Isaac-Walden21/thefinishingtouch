# AI Vision Studio Spec (`/vision` and `/vision/history`)

## Purpose
The sales closer. Show a customer what their backyard could look like before a single bag of concrete is mixed. Turns "I'm not sure" into "when can you start?" by making the finished product real in their mind. Also doubles as a content engine — every before/after is a potential social media post or portfolio piece.

## Capabilities

### 1. Photo Upload
- Drag-and-drop zone or click to browse
- Accepts: JPG, PNG, HEIC (iPhone photos)
- Auto-compresses on client side to max 2MB before upload
- Shows uploaded image with remove button
- Pull existing photo from a customer/lead record (dropdown selector)

### 2. Generation Controls
- **Service type** — dropdown from PROJECT_TYPES (Concrete Patio, Stamped Concrete, etc.)
- **Description** — textarea describing what the customer wants
- **Link to Customer** — optional, searchable customer dropdown
- **Generate Vision** button — calls Gemini API with optimized prompt
- Loading state with progress indicator
- Error handling with retry option

### 3. Side-by-Side Slider Comparison
- After generation, show before/after as a single image with a draggable slider
- Drag left/right to reveal more of the original or the AI version
- Slider handle styled with brand color, centered by default
- Labels: "Before" on left, "After" on right
- Touch-friendly drag on mobile
- Fallback: two-image grid for browsers that don't support the slider

### 4. Iteration Gallery
- Each "Generate" creates a new iteration stored in the project
- Thumbnail strip below the main comparison view
- Click a thumbnail to load that iteration into the slider
- Each iteration shows: add-on applied (if any), timestamp
- Suggested add-ons from the AI: "Add fire pit", "Add string lighting", "Add retaining wall"
- Click an add-on to regenerate with that feature included

### 5. Annotation Tools
Toolbar above the generated image:
- **Arrow** — draw directional arrows to point out features
- **Circle** — draw circles to highlight areas
- **Rectangle** — draw boxes around sections
- **Text label** — place text callouts on the image ("Fire pit here", "New patio edge")
- **Color picker** — choose annotation color (default: brand blue)
- **Undo/Redo** — step back through annotations
- **Clear all** — remove all annotations
- Annotations are layered on top of the image, exportable as a composite PNG
- Annotations saved with the project for later retrieval

### 6. Save to Customer
- "Save to Customer" button (functional, not a no-op)
- If customer already linked: saves immediately to that customer's vision projects
- If no customer linked: opens customer search/select dropdown
- On save:
  - Project record created in `vision_projects` table with customer_id
  - All iterations and annotations stored
  - Shows up on the customer detail page under "Vision Projects"
  - Activity logged: "AI visualization created for [service type]"
  - Toast: "Saved to [Customer Name]'s profile"

### 7. Share with Customer
- "Share with Customer" button opens share options:
  - **Email** — sends from `evan@thefinishingtouchllc.com` with:
    - Subject: "Your Project Visualization — The Finishing Touch"
    - Body: branded email with embedded before/after images
    - Link to shareable page
  - **Shareable link** — generates a unique URL `/vision/share/[token]`
    - Branded page showing the before/after slider
    - Annotations visible
    - No login required
    - Optional: "Request a Quote" button on the shared page
    - Link expires after 90 days
  - **Copy image** — copies the annotated after image to clipboard for texting/messaging
- Share events logged as activities

### 8. Download High-Res
- "Download" button with options:
  - **After image only** — full resolution PNG
  - **Before/after side-by-side** — composite image with both photos labeled
  - **With annotations** — after image with all annotations burned in
- Downloaded files named: `TFT-Vision-[ServiceType]-[Date].png`
- Resolution: original upload resolution (up to what Gemini returns)

### 9. Project Cost Overlay
- After generating a visualization:
  - "Estimate Cost" toggle below the image
  - When enabled, shows an estimated cost range based on:
    - Service type
    - Description (parsed for dimensions if mentioned)
    - Pricing tables from the estimate engine
  - Displayed as: "Estimated range: $3,200 — $5,800"
  - "Create Estimate" button to jump to `/estimates/new` pre-filled with the service type, description, and customer
- Not a commitment — clearly labeled "Approximate range based on typical projects"

### 10. Before/After Social Media Template
- "Create Social Post" button in the actions area
- Generates a branded graphic:
  - Before photo on left, after photo on right
  - Divider line with company logo
  - Bottom bar: "The Finishing Touch LLC" + phone number + website
  - Optional caption overlay: service type
- Aspect ratio options: Square (Instagram), 16:9 (Facebook), 9:16 (Stories)
- Downloads as a ready-to-post PNG
- Use case: Evan takes a before photo, generates AI after, downloads the social template, posts to Facebook in 2 minutes

### 11. Gallery / Portfolio (`/vision/history`)
- Grid of all past vision projects
- Each card: before thumbnail, after thumbnail, service type, customer name, date, iteration count
- **Filters:**
  - Service type
  - Customer
  - Date range
- **Search** by customer name or service type
- Click a project to open it in the full vision studio view (with slider, annotations, etc.)
- **Portfolio mode** — toggle to show only the best projects (starred/favorited)
  - Star button on each project card
  - Portfolio mode shows a clean grid of starred before/afters
  - Shareable portfolio link: `/vision/portfolio` — branded page showing all starred projects
  - Use case: Evan shows a prospective customer his portfolio on his phone during a site visit

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | On-site sales pitch | Takes a photo of the customer's backyard, uploads it, generates a stamped concrete patio visualization. Customer sees their own yard transformed — closes the deal on the spot |
| Evan | Adding features | Customer likes the patio but asks "what about a fire pit?" Evan clicks the "fire pit" add-on, generates a new iteration with the feature added |
| Evan | Sending to spouse | Customer says "I need to show my husband." Evan hits Share, emails the before/after to the customer. Husband opens the link at home, sees the branded slider page |
| Evan | Facebook marketing | Opens a completed project's vision, clicks "Create Social Post", picks square format, downloads the branded before/after, posts to Facebook Business page |
| Evan | Quote visit prep | Before heading to a site visit, opens the customer's vision project, reviews what was generated, adds annotations pointing out key features to discuss |
| Jake | Showing portfolio | At a home show, opens `/vision/portfolio` on his iPad, shows prospects a gallery of before/after transformations. Prospect picks a style they like |
| Evan | Cost conversation | Customer loves the visualization, asks "how much?" Evan toggles the cost overlay, shows $4,200-$6,100 range, then clicks "Create Estimate" for exact pricing |

## Data Sources
- Vision projects: Supabase `vision_projects` table
- Iterations: JSONB array on the project record or separate `vision_iterations` table
- Annotations: JSONB on the iteration record (array of {type, coordinates, color, text})
- Photos: Supabase Storage bucket `vision-photos` (originals and generated)
- Share tokens: Supabase `vision_shares` table (project_id, token, expires_at)
- Portfolio stars: Boolean `starred` field on `vision_projects`
- AI generation: Gemini API (image generation endpoint)
- Cost estimate: Internal pricing engine (same tables as estimate generator)
- Email: Send via `evan@thefinishingtouchllc.com`

## Layout
```
┌──────────────────────────────────────────────────────────┐
│ AI Vision Studio                        [View History]   │
├──────────────────────────┬───────────────────────────────┤
│ Customer Photo            │ Visualization Result          │
│ ┌──────────────────────┐ │ ┌───────────────────────────┐ │
│ │                      │ │ │ ◄━━━━━━━━│━━━━━━━━━━━━► │ │
│ │   [Uploaded image]   │ │ │  Before  │   After       │ │
│ │                      │ │ │          │               │ │
│ │              [✕]     │ │ │     [Draggable slider]   │ │
│ └──────────────────────┘ │ └───────────────────────────┘ │
│                          │                               │
│ Service Type *           │ Annotation Tools              │
│ [Stamped Concrete    ▾] │ [Arrow][Circle][Text][Color]  │
│                          │ [Undo][Redo][Clear]           │
│ Description *            │                               │
│ [___________________]   │ Est. Cost: $3,200 — $5,800    │
│                          │ [Create Estimate]             │
│ Customer (optional)      │                               │
│ [Steve Morales       ▾] │ Iterations (3)                │
│                          │ [thumb1][thumb2][thumb3]      │
│ [✨ Generate Vision]     │                               │
│                          │ Add-ons:                      │
│                          │ [+ Fire Pit] [+ Lighting]    │
│                          │                               │
│                          │ [Save to Customer]            │
│                          │ [Share] [Download ▾]          │
│                          │ [Create Social Post]          │
└──────────────────────────┴───────────────────────────────┘
```

## Open Questions
- Should the social media template support video (before → after transition animation)?
- Should the portfolio page be publicly accessible or behind a simple password?
- Should annotation data support freehand drawing in addition to shapes?
- Should there be an "Auto-enhance" option that improves the uploaded photo quality before generating?
