# Job Walk Spec (`/job-walk`)

## Purpose
The on-site capture tool. Evan pulls up to a customer's property for a quote visit, opens this on his phone, and captures everything he needs to build an accurate estimate — photos, measurements, site conditions, customer preferences — without writing anything on a napkin or trying to remember it later. When he's done, the job walk feeds directly into the estimate builder with everything pre-filled.

## Entry Points
- Calendar event detail → "Start Job Walk" button (pre-fills customer info from the event)
- Customer detail page → "New Job Walk" button
- Lead detail page → "Start Job Walk" button
- Quick actions on dashboard → "Start Job Walk"
- Direct navigation: `/job-walk/new`

## Capabilities

### 1. Job Walk Form — Header
Pre-filled from calendar event or customer record:
- **Customer name** — display + link to customer detail
- **Phone** — click-to-call
- **Address** — click for Google Maps directions
- **Service type** — from lead/customer record
- **Date/time** — auto-set to now
- **Weather conditions** — auto-pulled from weather API (temp, conditions, recent rain)
- **GPS location** — auto-captured on start, pinned to the job walk record

### 2. Photo Capture
- **Camera button** — opens device camera directly (not file picker)
- **Gallery upload** — tap to select existing photos
- Multiple photos, no limit
- Each photo gets:
  - Auto-numbered label: "Photo 1", "Photo 2", etc.
  - Optional caption (tap to add: "Front yard grade", "Existing slab crack", "Tree root obstacle")
  - Category tag: Overview, Existing Condition, Obstacle, Measurement Reference, Customer Request
- Photos display as a scrollable thumbnail strip
- Tap a thumbnail to view full-screen with pinch-to-zoom
- **Markup tool** — draw on any photo to annotate (arrows, lines, text)
  - Use existing AnnotationCanvas component
  - "Patio goes from here to here" with an arrow
  - Mark dimensions directly on the photo
- Photos stored in Supabase Storage `job-walk-photos` bucket
- Offline support: photos cached locally if no signal, uploaded when connection returns

### 3. Measurements
Mobile-friendly measurement input section:
- **Project area** — length × width (auto-calculates square footage)
- **Depth** — concrete thickness (defaults to 4" for standard, editable)
- **Additional areas** — "Add another area" button for complex shapes (L-shaped patios, multiple pours)
  - Each area: name, length, width, depth
  - Total square footage calculated across all areas
- **Linear feet** — for curbing, sidewalks, edges
- **Grade/slope** — dropdown: Flat, Slight Slope, Moderate Slope, Steep
- **Elevation change** — inches of drop across the area
- All inputs are large touch-friendly number pads
- Unit toggle: feet/inches or decimal feet

### 4. Site Conditions
Checklist-style assessment (tap to toggle):
- **Soil type** — Clay, Sandy, Rocky, Topsoil, Unknown
- **Drainage** — Good, Poor, Standing Water, Needs French Drain
- **Access** — Easy (truck access), Moderate (wheelbarrow distance), Difficult (tight/far from road)
- **Existing surface** — None (bare ground), Concrete (needs removal), Asphalt, Gravel, Grass/Sod
- **Demolition required** — Yes/No, if yes: estimated area to remove
- **Grading required** — Yes/No, estimated cubic yards
- **Obstacles** — multi-select: Trees, Roots, Utilities, Fence, Deck, Pool, Septic, Other
- **Utility lines** — Located/Not located/Need to call 811
- **Permit needed** — Yes/No/Unsure
- Free-text notes field for anything else

### 5. Customer Preferences
Captured during the conversation on-site:
- **What they want** — textarea (e.g., "Stamped patio with fire pit area, want it to wrap around the back of the house")
- **Material preference** — dropdown from MATERIAL_OPTIONS based on project type
- **Color/finish** — text field or dropdown
- **Timeline** — When do they want it done? dropdown: ASAP, Within 2 weeks, Within a month, Spring, Summer, Fall, Flexible
- **Budget range** — dropdown: Under $3K, $3-5K, $5-10K, $10-20K, $20K+, Not discussed
- **Decision maker** — Is this person the decision maker? Yes / No, need to talk to spouse/partner / Committee/HOA
- **Competitors** — Are they getting other quotes? Yes/No, if yes: how many?
- **Referral potential** — Would they refer us? Hot / Maybe / Unlikely
- **Priority level** — Hot (ready to go), Warm (interested, needs follow-up), Cool (just shopping)

### 6. Quick Sketch
- Simple drawing canvas for rough layout sketches
- Draw with finger on phone screen
- Basic tools: pen (black), pen (red), eraser, undo
- Grid background option for scale reference
- Save as an image attached to the job walk
- Use case: Evan sketches the L-shaped patio layout showing dimensions

### 7. Voice Notes
- "Record" button for audio notes
- Tap to start recording, tap again to stop
- Audio saved to Supabase Storage
- Auto-transcribed to text (using Whisper API or similar — stretch goal)
- Use case: Evan talks through his observations while walking the site instead of typing on his phone

### 8. Job Walk Summary
Before finishing, a summary screen shows:
- Customer info
- Photo count with thumbnails
- Measurements summary (total sqft)
- Site conditions overview
- Customer preferences
- Any missing/recommended fields highlighted in amber
- "Complete Job Walk" button

### 9. Post-Walk Actions
After completing the job walk:
- **Create Estimate** — jumps to `/estimates/new` pre-filled with:
  - Customer info
  - Project type and materials from preferences
  - Dimensions from measurements (auto-calculates line items)
  - Photos attached
  - Notes carried over
- **Send to Vision Studio** — sends the best site photo to `/vision` pre-filled with service type and description
- **Schedule Follow-up** — create a calendar event or task to follow up
- **Share with Team** — send a summary to Jake or Mike (in-app notification or text)
- **Save as Draft** — save without taking action, come back later

### 10. Job Walk History
- `/job-walk` shows a list of all past job walks
- Each entry: customer name, date, photo count, status (draft/completed/estimated)
- Filter by: date range, customer, status
- Click to re-open and review or continue editing
- Link to the estimate that was created from it (if any)

## Mobile-First Design
This page is primarily used on a phone at a job site. Design priorities:
- **Large touch targets** — minimum 44px tap areas
- **Minimal typing** — use dropdowns, toggles, and checklists over text fields
- **Camera-first** — photo capture is the most prominent action
- **Offline capable** — all data cached locally, syncs when connection available
- **One-hand friendly** — key actions reachable with thumb
- **Auto-save** — every field change saves immediately, no data loss if app closes
- **Low battery aware** — minimize background processing

## Layout — Mobile
```
┌────────────────────────────┐
│ ← Job Walk                 │
│ Steve Morales              │
│ 📍 1234 Main St, Greentown │
│ 📞 (765) 555-1234    [Call]│
├────────────────────────────┤
│ 📷 Photos (tap to capture) │
│ ┌────┐ ┌────┐ ┌────┐ [+] │
│ │ 1  │ │ 2  │ │ 3  │      │
│ └────┘ └────┘ └────┘      │
├────────────────────────────┤
│ 📐 Measurements            │
│ Length [____] ft            │
│ Width  [____] ft           │
│ Depth  [__4__] in          │
│ Total: 300 sq ft           │
│ [+ Add Another Area]       │
├────────────────────────────┤
│ 🏗 Site Conditions          │
│ Soil: [Clay ▾]             │
│ Access: [Easy ▾]           │
│ ☐ Demo Required            │
│ ☐ Grading Required         │
│ Obstacles: [Select...]     │
├────────────────────────────┤
│ 💬 Customer Preferences     │
│ What they want:            │
│ [________________________] │
│ Material: [Ashlar Slate ▾] │
│ Timeline: [Within 2 wks ▾]│
│ Budget: [$5-10K ▾]         │
│ Priority: ● Hot ○ Warm ○ Cool│
├────────────────────────────┤
│ 🎤 Voice Note [Record]     │
│ ✏️ Quick Sketch [Draw]      │
├────────────────────────────┤
│ [Complete Job Walk]         │
│                             │
│ → Create Estimate           │
│ → Send to Vision Studio     │
│ → Schedule Follow-up        │
└────────────────────────────┘
```

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Quote visit from calendar | Taps the calendar event, hits "Start Job Walk", customer info pre-filled. Takes 8 photos, enters 20x15 measurements, notes "customer wants ashlar slate, fire pit area, budget $5-10K". Completes walk, taps "Create Estimate" — estimate builder opens with everything filled in |
| Evan | Complex site | Takes photos of an L-shaped area, draws a quick sketch showing the layout, adds two measurement areas (main patio 15x20, extension 8x10), notes tree root obstacle and poor drainage. Voice records "going to need extra grading on the south side, probably 3 yards of fill" |
| Jake | Follow-up from job walk | Evan did the walk, Jake opens it from the customer detail page, reviews photos and notes, creates the estimate from his desk |
| Evan | Vision Studio pitch | Finishes the walk, taps "Send to Vision Studio", best photo goes to AI generation, shows the customer what it could look like before he leaves the property |
| Evan | No signal at rural site | Takes photos and enters measurements — everything saves locally. Gets back to the truck, phone reconnects, data syncs to Supabase automatically |

## Data Sources
- Job walks: New Supabase `job_walks` table (id, customer_id, lead_id, calendar_event_id, status, measurements JSONB, site_conditions JSONB, customer_preferences JSONB, sketch_url, voice_note_url, gps_lat, gps_lng, weather JSONB, created_at, completed_at)
- Photos: Supabase Storage `job-walk-photos` bucket, metadata in `job_walk_photos` table (job_walk_id, photo_url, caption, category, annotations JSONB, sort_order)
- Estimates: Links to `estimates` table via job_walk_id
- Calendar: Links to `calendar_events` table via calendar_event_id
- Weather: OpenWeatherMap API (same as dashboard widget)
- Voice transcription: Whisper API (stretch goal)
- Offline sync: Service worker + IndexedDB for local caching

## Open Questions
- Should job walks support a "template" for different project types (patio checklist vs driveway checklist vs post frame checklist)?
- Should photos auto-tag with GPS coordinates for mapping where on the property they were taken?
- Should there be a "comparison walk" feature for before/after job completion documentation?
- Should the voice note transcription happen on-device or server-side?
