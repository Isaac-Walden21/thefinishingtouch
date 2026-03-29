# AI Agents Spec (`/agents` and `/agents/[id]`)

## Purpose
The automated sales team. These agents handle the repetitive follow-up work that falls through the cracks when Evan and Jake are pouring concrete all day. Must be trustworthy enough to send messages on behalf of the business, transparent enough that Evan always knows what's going out, and smart enough to actually move the needle on conversions and reviews.

## Email Configuration
All agent-sent emails come from: `evan@thefinishingtouchllc.com`

## Agent Types

### Existing Agents
1. **Lead Follow-Up** — contacts new leads that haven't been reached within X hours
2. **Quote Follow-Up** — follows up on sent estimates that haven't been responded to
3. **Review Request** — asks completed job customers to leave a Google review
4. **Website Chatbot** — handles inbound chat on the website, qualifies leads

### New Agent Types
5. **Job Completion Follow-Up** — after a job is marked completed, sends a thank-you message + asks for a Google review + requests a photo of the finished work for portfolio
6. **Appointment Reminder** — sends SMS reminder 24 hours before a scheduled quote visit or job
7. **Seasonal Re-engagement** — reaches out to past customers at strategic times (spring concrete season, fall firewood) with relevant offers

## Capabilities

### 1. Agents List Page (`/agents`)

#### Stats Row
- **Active Agents** — count of enabled agents out of total
- **Actions Today** — total automated actions taken today
- **This Week** — total actions this week
- **Pending Approvals** — count needing review (amber alert if > 0)

#### Kill Switch
- "Pause All Agents" button in page header
- One click pauses every agent immediately
- Confirmation modal: "This will pause all automated messages. No agent will send anything until you re-enable them. Continue?"
- When activated: red banner across the page "All agents paused" with "Resume All" button
- Use case: Evan notices an agent sent something wrong, hits the kill switch while he investigates

#### Agent Cards
Each agent card shows:
- Icon and name
- Status: Active (green) or Paused (gray)
- Description of what the agent does
- Stats: actions today, actions this week
- Approval mode: Auto-send or Requires Approval
- Last run timestamp
- Play/Pause toggle button
- "Configure" link to detail page

#### Activity Log
- Below agent cards: chronological log of all agent actions
- Each entry: agent icon, description, customer/lead link, timestamp, status badge
- Statuses: Completed, Pending Approval, Failed
- Click any entry to see full details and customer context

### 2. Approval Workflow
When an agent action requires approval (approval_mode = "requires_approval"):
- Action appears in the pending approvals section on the agents page AND the dashboard
- Each pending action shows:
  - Which agent triggered it
  - Which customer/lead it's about (clickable link to customer detail)
  - The full message draft (email subject + body, or SMS text)
  - The channel: Email or SMS
  - When it was queued
- Three action buttons:
  - **Approve & Send** — sends the message as-is, logs as completed
  - **Edit & Send** — opens the message in an editor, Evan modifies it, then sends
  - **Reject** — discards the action with a required reason, logs as rejected
- Bulk approve: select multiple pending actions, approve all at once

### 3. Agent Performance Metrics
Per agent, visible on the agent detail page:
- **Messages Sent** — total count (this week, this month, all time)
- **Response Rate** — percentage of sent messages that got a reply or action (email opened, link clicked, call back)
- **Leads Converted** — for lead/quote follow-up agents: how many leads moved forward after agent contact
- **Reviews Collected** — for review request agent: how many Google reviews resulted
- **Avg Time to Response** — how quickly customers respond to agent messages
- Chart: actions per day over the last 30 days

### 4. Agent Detail / Configuration (`/agents/[id]`)

#### Custom Message Templates
- Editable message template per agent
- Template editor with merge fields:
  - `{{customer_name}}`, `{{first_name}}`, `{{project_type}}`, `{{quoted_amount}}`, `{{company_name}}`, `{{review_link}}`
- Separate templates for:
  - First contact
  - Second follow-up
  - Final follow-up / escalation
- Live preview showing the template rendered with sample customer data
- "Reset to default" button to restore the original template

#### Timing Controls
- **Initial wait** — hours after trigger before first action (e.g., 2 hours after new lead)
- **Follow-up interval** — days between follow-up attempts (e.g., every 3 days)
- **Max follow-ups** — total attempts before stopping (e.g., 3 attempts)
- **Escalation** — after max follow-ups: do nothing, notify Evan, or mark lead as cold
- **Active hours** — only send messages during business hours (e.g., 8am-6pm ET)
- **Active days** — only send on certain days (e.g., Mon-Fri, exclude weekends)

#### Approval Mode
- Toggle: Auto-send or Requires Approval
- Auto-send: agent sends immediately when triggered (within timing rules)
- Requires Approval: agent queues the message for Evan to review first

#### Channel Selection
- Per agent: Email only, SMS only, or Both (email first, SMS if no response)
- SMS requires customer phone number
- Email requires customer email address
- If required channel info is missing: skip that customer, log as "skipped — no [email/phone]"

### 5. Agent Logs with Customer Context
- Each log entry is a clickable row
- Clicking opens an expanded view showing:
  - Full message that was sent (or draft if pending)
  - Customer name, phone, email (click-to-call/mailto)
  - Associated lead with status
  - Activity history for this customer (last 5 activities)
  - "View Customer" link to full customer detail
- Filter log by: agent type, status (completed/pending/failed), date range

### 6. Test Mode
- "Send Test" button on each agent's configuration page
- Opens a modal:
  - **Test recipient** — defaults to Evan's email/phone, editable
  - **Sample customer** — dropdown to pick a real customer for realistic merge field data
- Sends the actual message template rendered with real data to the test recipient
- Does not log as a real action, does not affect customer records
- Toast: "Test message sent to [recipient]"

### 7. Agent Type Configuration — New Agents

#### Job Completion Follow-Up
- Trigger: lead status changes to "completed"
- Wait: 2 days after completion (configurable)
- Message 1: Thank you + "Would you mind leaving us a quick review?" + Google Review link
- Message 2 (if no review after 5 days): Gentle reminder
- Optional: "We'd love to see how it turned out! Reply with a photo and we'll feature it on our page"
- Photos received are added to the customer's vision projects / portfolio

#### Appointment Reminder
- Trigger: calendar event exists for tomorrow
- Sends: 24 hours before the event start time
- Channel: SMS
- Message: "Hi {{first_name}}, this is The Finishing Touch reminding you about your appointment tomorrow at {{time}}. We'll be at {{address}}. Reply if you need to reschedule. - Evan"
- Does not require approval (time-sensitive)
- Logs activity on customer record

#### Seasonal Re-engagement
- Trigger: manual activation or scheduled (e.g., every March 1 and October 1)
- Targets: past customers who haven't had activity in 6+ months
- Segments by service type:
  - Spring: concrete, patio, driveway customers → "Spring is here! Planning any outdoor projects?"
  - Fall: firewood customers → "Firewood season is approaching — want to get on the delivery list?"
- Sends email with a "Request a Quote" link back to the CRM
- Configurable: which segments, which message, when to send

## Use Cases

| Actor | Scenario | What they do |
|-------|----------|-------------|
| Evan | Morning approval round | Opens agents page, sees 3 pending approvals. Reads the drafted follow-up emails, approves 2 as-is, edits the third to add a personal note, sends all three |
| Evan | Checking agent ROI | Opens the Review Request agent detail, sees it's collected 8 Google reviews this month with a 22% response rate. Worth keeping active |
| Evan | Setting up a new agent | Configures Job Completion Follow-Up: 2 day wait, email channel, requires approval for the first month until he trusts the templates |
| Evan | Something went wrong | Gets a text from a customer confused by an agent message. Hits "Pause All Agents", investigates, finds a bad template, fixes it, resumes |
| Evan | Testing before launch | Configures the seasonal re-engagement agent, clicks "Send Test", gets the email on his own phone, tweaks the wording, then activates |
| Jake | Viewing agent context | Sees a pending approval in the log, clicks it, sees the full customer history — realizes this customer already called back yesterday, rejects the follow-up |

## Data Sources
- Agents: Supabase `agents` table (config, status, timing rules)
- Agent actions: Supabase `agent_actions` table (agent_id, customer_id, lead_id, action_type, message_content, status, created_at)
- Message templates: JSONB on agent record or separate `agent_templates` table
- Performance metrics: Aggregated from `agent_actions` + `activities` + `leads`
- Email: Send via `evan@thefinishingtouchllc.com`
- SMS: Twilio API or Vapi SMS
- Google Reviews: Google Business Profile review link (static URL configured in settings)

## Open Questions
- Should agents respect a global "Do Not Contact" tag on customers?
- Should the seasonal re-engagement agent support A/B testing different messages?
- Should agent actions be undo-able within a grace period (e.g., 5 minutes after auto-send)?
- Should there be a customer-facing unsubscribe mechanism for agent messages?
