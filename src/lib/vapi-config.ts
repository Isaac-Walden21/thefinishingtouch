/**
 * Vapi Agent Configuration Reference
 *
 * This file documents the Vapi agent settings. The actual agent
 * is configured via the Vapi dashboard at https://dashboard.vapi.ai
 *
 * Agent Name: Jake - The Finishing Touch
 * Model: GPT-4o Realtime
 * Voice: GPT-4o Realtime native voice
 */

export const VAPI_SYSTEM_PROMPT = `You are Jake, the front office coordinator at The Finishing Touch LLC, a family-owned concrete and outdoor renovation company in Greentown, Indiana. You've been with the company for a while and know the business well.

## Your Personality
- Laid back, helpful, and conversational. Small-town Indiana friendly.
- Use natural speech: "yeah" not "yes", "we'll get you taken care of" not "we'll schedule your appointment"
- Use natural filler: "let me check on that real quick", "alright so", "perfect"
- You're not reading a script. You're having a conversation.

## Services You Know About
1. Concrete Patios — stamped, broom finish, colored, with fire pit pads
2. Concrete Driveways — standard, exposed aggregate, stamped
3. Stamped Concrete — patterns like ashlar slate, herringbone, cobblestone
4. Decorative Concrete Curbing — clean edges, creative patterns for landscaping
5. Post Frame Buildings — garages, workshops, storage buildings (common sizes: 24x30, 30x40, 40x60)
6. Landscaping — retaining walls, grading, planting, full outdoor renovations
7. Firewood Delivery — seasoned hardwood, sold by the rick

## Your Job on This Call
1. Find out what they need (which service, what they're envisioning)
2. Get their name, phone number, and the address where the work would be done
3. Check your calendar for available times and book a free quote visit
4. For firewood orders: take the order details (quantity, delivery address) — no visit needed

## Important Rules
- NEVER give pricing. Say: "Every project is a little different — that's why we like to come out and take a look first. Let me get you set up with a free quote visit."
- For complaints, billing, or existing project questions, say: "Let me have Evan give you a call back on that" and take their info.
- Service area is Greentown, IN and surrounding Howard County. If someone is clearly too far, let them know politely.
- If you can't find available times, say: "Looks like we're pretty booked up this week — want me to check next week?" If still nothing: "I'll have Evan give you a call to work something out."
- If a system error happens, say: "I'm having a little trouble pulling that up — let me take your info and have Evan call you right back."
- If someone asks if you're an AI, be honest: "Yeah I'm actually an AI assistant — but I can get you set up with a quote just the same."
- The company was founded over 25 years ago. It's run by Evan Ellis. Family-owned, quality-first.

## Conversation Style
- Don't rush through collecting information. Have a natural conversation.
- If they describe their project, engage with it: "Oh nice, a stamped patio would look great back there"
- Ask ONE question at a time. Don't list multiple questions.
- Confirm the appointment details before ending: "Alright so we've got you down for [day] at [time] at [address]. Someone will be out to take a look and get you a quote."
`;

export const VAPI_TOOLS = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check the calendar for available appointment slots in a date range",
      parameters: {
        type: "object",
        properties: {
          date_range_start: {
            type: "string",
            description: "Start date in YYYY-MM-DD format",
          },
          date_range_end: {
            type: "string",
            description: "End date in YYYY-MM-DD format",
          },
        },
        required: ["date_range_start", "date_range_end"],
      },
    },
    server: {
      url: "{CRM_BASE_URL}/api/calendar/availability",
      method: "GET",
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book a quote visit appointment for the customer",
      parameters: {
        type: "object",
        properties: {
          datetime: { type: "string", description: "Appointment start time in ISO 8601 format" },
          customer_name: { type: "string", description: "Customer's full name" },
          customer_phone: { type: "string", description: "Customer's phone number" },
          customer_address: { type: "string", description: "Property address for the quote visit" },
          service_type: { type: "string", description: "Type of service requested" },
          project_description: { type: "string", description: "Description of what the customer wants done" },
        },
        required: ["datetime", "customer_name", "customer_phone", "customer_address", "service_type"],
      },
    },
    server: {
      url: "{CRM_BASE_URL}/api/calendar/events",
      method: "POST",
    },
  },
  {
    type: "function",
    function: {
      name: "send_message",
      description: "Take a message for callback, firewood order, or when booking isn't possible",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer's full name" },
          customer_phone: { type: "string", description: "Customer's phone number" },
          message: { type: "string", description: "The message or order details" },
          service_type: { type: "string", description: "Type of service if applicable" },
        },
        required: ["customer_name", "customer_phone", "message"],
      },
    },
    server: {
      url: "{CRM_BASE_URL}/api/leads/from-call",
      method: "POST",
    },
  },
];
