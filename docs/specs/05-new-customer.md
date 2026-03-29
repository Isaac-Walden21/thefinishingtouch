# New Customer / New Lead Spec (`/customers/new`)

## Purpose
The entry point for every new relationship. Must be fast enough to fill out during a live phone call, smart enough to prevent duplicates, and flexible enough to capture as much or as little detail as the moment allows.

## Capabilities

### 1. Quick-Add Mode
- Default view: minimal form with 3 fields — Name, Phone, Project Type
- "Show full form" toggle expands to all fields
- Quick-add saves customer + lead with status "new" in one action
- Designed for: phone rings, Evan picks up, captures the essentials in 15 seconds

### 2. Full Form — Customer Information
Fields:
- **Full Name** * — required
- **Phone** — auto-formats as (765) 555-1234 on input, strips non-digits for storage
- **Email** — validated format
- **Street Address** — Google Places autocomplete, auto-fills city/state/zip on selection
- **City** — auto-filled or manual
- **State** — auto-filled or manual, defaults to "IN"
- **ZIP** — auto-filled or manual
- **Service Type** — dropdown: Concrete Patio, Driveway, Post Frame, Landscaping, Curbing, Sidewalk, Stamped Concrete, Firewood, Other
- **Lead Source** — dropdown: Google, Facebook, Website, Referral, Yard Sign, Phone Call, Vapi (AI), Other
- **Assign To** — dropdown of active team members (defaults to current user)
- **Notes** — free text

### 3. Full Form — Lead Details (Optional)
Fields:
- **Project Type** — free text (e.g., "Stamped Concrete Patio with Fire Pit")
- **Quoted Amount** — currency input
- **Project Description** — textarea for scope, dimensions, materials
- **Priority** — toggle flag: Normal (default) or High Priority
  - High priority leads get a flame icon on pipeline cards and sort to top
- **Photo Upload** — drag-and-drop or tap to upload job site photo
  - Stored in Supabase Storage
  - Can be sent to Vision Studio later from the customer detail page
  - Multiple photos allowed

### 4. Duplicate Detection
- Triggers on phone number blur and name blur
- Checks Supabase for existing customers matching:
  - Exact phone number match
  - Fuzzy name match (case-insensitive contains)
- If match found, shows inline warning banner:
  - "A customer named [Name] with phone [Phone] already exists."
  - "View existing record" link opens customer detail in new tab
  - "Create anyway" button to proceed (legitimate: same name, different person)
- Does not block form submission — advisory only

### 5. Phone Number Formatting
- On input: auto-insert parentheses and dash as user types
  - `765` → `(765)`
  - `7655551234` → `(765) 555-1234`
- Stores clean digits only in database: `7655551234`
- Displays formatted everywhere in the CRM

### 6. Address Autocomplete
- Google Places Autocomplete on the street address field
- On selection: auto-fills city, state, zip from the place result
- User can override any auto-filled field
- Fallback: if Google Places API key not configured, fields work as normal text inputs

### 7. Create & Add Another
- After successful save, toast notification: "Customer saved successfully"
- Two buttons in the toast or post-save state:
  - "View Customer" — navigates to `/customers/[id]`
  - "Add Another" — clears the form for a new entry, stays on page
- Default behavior without interaction: stays on the confirmation for 3 seconds then navigates to customer list

### 8. Priority Flag
- Toggle switch or star icon next to the lead details section header
- When enabled: lead created with `priority: "high"` flag
- Pipeline board shows flame/star icon on high-priority lead cards
- High-priority leads sort to top within their column by default

### 9. Form Validation
- Name is required — inline error if empty on submit
- Phone format validated (10 digits after stripping)
- Email format validated if provided
- Quoted amount must be positive number if provided
- All validation errors shown inline below the field, not as alerts

### 10. Assign to Team Member
- Dropdown populated from `team_members` table (active members only)
- Shows name + role (e.g., "Jake Henderson — Manager")
- Defaults to current logged-in user
- Sets `assigned_to` on the lead record

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Phone call comes in | Opens quick-add, types name and phone while talking, selects "Stamped Concrete", saves in 15 seconds |
| Jake | Detailed lead entry | Gets a Facebook inquiry with photos and description, uses full form, uploads the photos, assigns to himself, marks high priority |
| Evan | Repeat customer calls | Types phone number, duplicate detection fires: "Steve Morales already exists", clicks to view existing record, adds a new lead there instead |
| Jake | Batch entry from yard sign responses | Creates a customer, hits "Add Another", creates the next one, rapid-fire through 4 new leads |
| Evan | On-site meeting | Customer gives address verbally, starts typing — autocomplete fills the rest, saves time and prevents typos |

## Data Sources
- Save to: Supabase `customers` table + `leads` table
- Duplicate check: Supabase query on `customers` where phone or name matches
- Team members: Supabase `team_members` table (is_active = true)
- Photo upload: Supabase Storage bucket `lead-photos`
- Address autocomplete: Google Places API (client-side)

## Layout
```
┌─────────────────────────────────────────┐
│ ← Back to Customers                    │
│                                         │
│ Add New Customer                        │
│ Create a new customer and lead.         │
│                                         │
│ ┌─── Quick Add ──────────────────────┐ │
│ │ Name *        [________________]   │ │
│ │ Phone         [(___) ___-____]     │ │
│ │ Project Type  [________________]   │ │
│ │                                     │ │
│ │ [▸ Show full form]                 │ │
│ │                                     │ │
│ │ [Save Customer]  [Cancel]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⚠ Duplicate Warning (if detected)      │
│ "Steve Morales (765) 555-1234 exists"   │
│ [View Existing] [Create Anyway]         │
└─────────────────────────────────────────┘
```

## Open Questions
- Should Google Places API key be required or optional for deployment?
- Should photo uploads be compressed client-side before uploading to save storage?
- Should the quick-add mode remember the last-used service type and source for faster repeat entry?
