-- Seed script for The Finishing Touch CRM
-- Loads demo data into Supabase with proper UUID generation and FK relationships
-- Run via: Supabase SQL Editor or `psql`

BEGIN;

-- Clear existing data (safe for fresh DB)
TRUNCATE job_walk_photos, job_walks, agent_actions, ai_agents,
  automation_enrollments, campaign_recipients, automations, campaigns,
  email_templates, marketing_contacts, payments, invoices, estimates,
  activities, leads, availability_rules, calendar_events, customers,
  team_members CASCADE;

-- ══════════════════════════════════════════════
-- TEAM MEMBERS
-- ══════════════════════════════════════════════

INSERT INTO team_members (id, name, email, role, phone, color, notification_email, is_active, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Mike Henderson', 'mike@thefinishingtouchllc.com', 'admin', NULL, '#3b82f6', NULL, true, '2024-01-15T08:00:00Z'),
  ('a0000000-0000-0000-0000-000000000002', 'Jake Henderson', 'jake@thefinishingtouchllc.com', 'manager', NULL, '#10b981', NULL, true, '2024-01-15T08:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003', 'Travis Cole', 'travis@thefinishingtouchllc.com', 'crew', NULL, '#f59e0b', NULL, true, '2024-03-01T08:00:00Z');

-- ══════════════════════════════════════════════
-- CUSTOMERS
-- ══════════════════════════════════════════════

INSERT INTO customers (id, name, email, phone, address, city, state, zip, service_type, source, notes, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Steve & Linda Morales', 'smorales@gmail.com', '(765) 555-0142', '4521 Elm Creek Dr', 'Greentown', 'IN', '46936', 'Concrete Patio', 'Google', 'Referred by neighbor. Wants stamped concrete patio with fire pit.', '2026-02-10T14:30:00Z', '2026-03-15T09:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'Brian Whitfield', 'bwhitfield@yahoo.com', '(765) 555-0287', '1102 N Main St', 'Kokomo', 'IN', '46901', 'Driveway', 'Facebook', 'Existing driveway is cracked. Wants full tear-out and replace.', '2026-02-18T10:15:00Z', '2026-03-10T11:00:00Z'),
  ('c0000000-0000-0000-0000-000000000003', 'Rachel Kim', 'rachelk@outlook.com', '(317) 555-0391', '8834 Sycamore Ln', 'Noblesville', 'IN', '46060', 'Post Frame', 'Website', '30x40 post frame garage. Has plans drawn up already.', '2026-01-22T16:45:00Z', '2026-03-20T14:00:00Z'),
  ('c0000000-0000-0000-0000-000000000004', 'Tom & Diane Marshall', 'tmarshall@gmail.com', '(765) 555-0518', '220 W Sycamore St', 'Greentown', 'IN', '46936', 'Landscaping', 'Referral', 'Full backyard renovation. Retaining wall + patio + landscaping.', '2026-03-01T09:00:00Z', '2026-03-22T10:00:00Z'),
  ('c0000000-0000-0000-0000-000000000005', 'Angela Ross', 'aross@icloud.com', '(765) 555-0674', '7710 County Rd 200 W', 'Russiaville', 'IN', '46979', 'Curbing', 'Google', 'Landscape curbing around front beds and driveway border.', '2026-03-05T13:20:00Z', '2026-03-18T15:30:00Z'),
  ('c0000000-0000-0000-0000-000000000006', 'Derek Johnson', 'djohnson@gmail.com', '(765) 555-0823', '3345 Apperson Way', 'Kokomo', 'IN', '46902', 'Concrete Patio', 'Facebook', 'Small 12x12 patio. Budget-conscious.', '2026-03-08T11:00:00Z', '2026-03-08T11:00:00Z'),
  ('c0000000-0000-0000-0000-000000000007', 'Carla & Jim Nesbitt', 'cnesbitt@gmail.com', '(765) 555-0945', '560 E Carter St', 'Greentown', 'IN', '46936', 'Driveway', 'Yard Sign', 'Circular driveway pour. Premium finish.', '2026-02-25T08:30:00Z', '2026-03-19T16:00:00Z'),
  ('c0000000-0000-0000-0000-000000000008', 'Patricia Okonkwo', 'pokonkwo@hotmail.com', '(317) 555-1032', '1290 Riverfront Pkwy', 'Westfield', 'IN', '46074', 'Post Frame', 'Website', '24x30 workshop with lean-to. Wants it done before summer.', '2026-01-30T15:00:00Z', '2026-03-12T09:00:00Z'),
  ('c0000000-0000-0000-0000-000000000009', 'Mark Stevenson', 'mstevenson@gmail.com', '(765) 555-1188', '4400 S LaFountain St', 'Kokomo', 'IN', '46902', 'Concrete Patio', 'Google', NULL, '2026-03-15T10:00:00Z', '2026-03-15T10:00:00Z'),
  ('c0000000-0000-0000-0000-000000000010', 'Sarah & Dave Henning', 'shenning@gmail.com', '(765) 555-1344', '890 N Buckeye St', 'Greentown', 'IN', '46936', 'Landscaping', 'Referral', 'Wants firewood delivery this fall + spring landscaping.', '2026-03-18T14:00:00Z', '2026-03-20T08:30:00Z'),
  ('c0000000-0000-0000-0000-000000000011', 'Luis Hernandez', 'lhernandez@yahoo.com', '(765) 555-1501', '2200 W Alto Rd', 'Howard County', 'IN', '46901', 'Post Frame', 'Facebook', '40x60 pole barn for equipment storage. Commercial project.', '2026-02-05T09:00:00Z', '2026-03-21T11:00:00Z'),
  ('c0000000-0000-0000-0000-000000000012', 'Nancy Caldwell', 'ncaldwell@gmail.com', '(765) 555-1667', '615 Taylor St', 'Greentown', 'IN', '46936', 'Curbing', 'Yard Sign', 'Curbing + small walkway to front door.', '2026-03-20T16:00:00Z', '2026-03-20T16:00:00Z');

-- ══════════════════════════════════════════════
-- LEADS
-- ══════════════════════════════════════════════

INSERT INTO leads (id, customer_id, status, quoted_amount, project_type, project_description, assigned_to, priority, created_at, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'in_progress', 8500, 'Stamped Concrete Patio', '20x16 stamped patio with integrated fire pit. Ashlar slate pattern, desert tan color with dark walnut release.', 'a0000000-0000-0000-0000-000000000002', 'normal', '2026-02-10T14:30:00Z', '2026-03-15T09:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'quoted', 12200, 'Driveway Replacement', 'Full tear-out of existing 60ft driveway. 6-inch pour with rebar. Broom finish with saw-cut joints.', 'a0000000-0000-0000-0000-000000000002', 'normal', '2026-02-18T10:15:00Z', '2026-03-10T11:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'booked', 34000, 'Post Frame Garage', '30x40 post frame with 12ft sidewalls. 2 overhead doors, 1 walk door. Metal roof and siding, concrete floor.', 'a0000000-0000-0000-0000-000000000001', 'normal', '2026-01-22T16:45:00Z', '2026-03-20T14:00:00Z'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'quoted', 22500, 'Backyard Renovation', 'Retaining wall (45 linear ft), 15x20 patio, landscape beds with mulch and plantings.', 'a0000000-0000-0000-0000-000000000002', 'normal', '2026-03-01T09:00:00Z', '2026-03-22T10:00:00Z'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'contacted', NULL, 'Landscape Curbing', 'Curbing around 3 front beds + driveway border. Approximately 120 linear feet.', 'a0000000-0000-0000-0000-000000000003', 'normal', '2026-03-05T13:20:00Z', '2026-03-18T15:30:00Z'),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'new', NULL, 'Concrete Patio', '12x12 basic broom finish patio off back sliding door.', NULL, 'normal', '2026-03-08T11:00:00Z', '2026-03-08T11:00:00Z'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'in_progress', 18500, 'Circular Driveway', 'Circular driveway with exposed aggregate finish. Includes turnaround area. ~1800 sq ft total.', 'a0000000-0000-0000-0000-000000000001', 'normal', '2026-02-25T08:30:00Z', '2026-03-19T16:00:00Z'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'completed', 28000, 'Post Frame Workshop', '24x30 workshop with 8ft lean-to. Insulated, wired for 200 amp service. Concrete floor with drain.', 'a0000000-0000-0000-0000-000000000001', 'normal', '2026-01-30T15:00:00Z', '2026-03-12T09:00:00Z'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'new', NULL, 'Concrete Patio', 'Interested in a patio. No details yet.', NULL, 'normal', '2026-03-15T10:00:00Z', '2026-03-15T10:00:00Z'),
  ('b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'new', NULL, 'Landscaping', 'Spring landscaping package + firewood delivery for fall.', NULL, 'normal', '2026-03-18T14:00:00Z', '2026-03-20T08:30:00Z'),
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'booked', 52000, 'Commercial Pole Barn', '40x60 pole barn for equipment storage. 14ft sidewalls, 2 large overhead doors, gravel approach.', 'a0000000-0000-0000-0000-000000000001', 'normal', '2026-02-05T09:00:00Z', '2026-03-21T11:00:00Z'),
  ('b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'contacted', NULL, 'Curbing + Walkway', 'Decorative curbing around beds and new concrete walkway to front door.', 'a0000000-0000-0000-0000-000000000003', 'normal', '2026-03-20T16:00:00Z', '2026-03-20T16:00:00Z'),
  ('b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000002', 'lost', 4500, 'Sidewalk Repair', 'Previous inquiry for sidewalk. Went with another contractor.', 'a0000000-0000-0000-0000-000000000002', 'normal', '2025-11-10T09:00:00Z', '2025-12-15T14:00:00Z');

-- ══════════════════════════════════════════════
-- ACTIVITIES
-- ══════════════════════════════════════════════

INSERT INTO activities (id, lead_id, customer_id, type, description, created_by, created_at)
VALUES
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'call', 'Initial call with Steve. Discussed stamped patio options and fire pit placement.', 'a0000000-0000-0000-0000-000000000002', '2026-02-10T14:30:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'quote', 'Sent quote for $8,500 — stamped patio with fire pit.', 'a0000000-0000-0000-0000-000000000002', '2026-02-15T10:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'note', 'Customer approved quote. Deposit received. Scheduled for March.', 'a0000000-0000-0000-0000-000000000002', '2026-02-20T11:30:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'note', 'Started excavation. Weather looks good for the week.', 'a0000000-0000-0000-0000-000000000001', '2026-03-10T08:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'call', 'Brian called about driveway replacement. Scheduled site visit.', 'a0000000-0000-0000-0000-000000000002', '2026-02-18T10:15:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'note', 'Site visit completed. Measured 60ft driveway, noted drain issues.', 'a0000000-0000-0000-0000-000000000002', '2026-02-22T14:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'quote', 'Sent quote for $12,200 — driveway tear-out and replace.', 'a0000000-0000-0000-0000-000000000002', '2026-03-01T09:30:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'email', 'Rachel emailed plans for 30x40 post frame. Reviewed specs.', 'a0000000-0000-0000-0000-000000000001', '2026-01-22T16:45:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'quote', 'Sent detailed quote for $34,000 — post frame garage.', 'a0000000-0000-0000-0000-000000000001', '2026-02-01T10:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'payment', 'Deposit received — $10,000. Project booked for April.', 'a0000000-0000-0000-0000-000000000001', '2026-03-15T11:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'call', 'Angela called about curbing. Wants to match neighbor''s style.', 'a0000000-0000-0000-0000-000000000003', '2026-03-05T13:20:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'note', 'Scheduled site visit for Friday to measure and pick colors.', 'a0000000-0000-0000-0000-000000000003', '2026-03-12T09:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'quote', 'Sent quote for $18,500 — circular driveway, exposed aggregate.', 'a0000000-0000-0000-0000-000000000001', '2026-03-01T14:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'payment', 'Deposit received — $5,000. Started forming.', 'a0000000-0000-0000-0000-000000000001', '2026-03-10T08:30:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'note', 'Project complete. Final inspection passed. Customer very happy.', 'a0000000-0000-0000-0000-000000000001', '2026-03-12T09:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'payment', 'Final payment received — $18,000. Project fully paid.', 'a0000000-0000-0000-0000-000000000001', '2026-03-12T15:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'call', 'Luis called about large pole barn. Discussed specs and timeline.', 'a0000000-0000-0000-0000-000000000001', '2026-02-05T09:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'quote', 'Sent quote for $52,000 — 40x60 commercial pole barn.', 'a0000000-0000-0000-0000-000000000001', '2026-02-15T10:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'payment', 'Deposit received — $15,000. Booked for late April start.', 'a0000000-0000-0000-0000-000000000001', '2026-03-01T11:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'call', 'Diane called about backyard renovation. Wants full package.', 'a0000000-0000-0000-0000-000000000002', '2026-03-01T09:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'quote', 'Sent quote for $22,500 — retaining wall, patio, landscaping.', 'a0000000-0000-0000-0000-000000000002', '2026-03-15T14:00:00Z'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'email', 'Follow-up email sent. Waiting for approval on quote.', 'a0000000-0000-0000-0000-000000000002', '2026-03-22T10:00:00Z');

-- ══════════════════════════════════════════════
-- ESTIMATES
-- ══════════════════════════════════════════════

INSERT INTO estimates (id, customer_id, customer_name, status, project_type, dimensions, materials, complexity, options, line_items, subtotal, margin, total, timeline, notes, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Steve & Linda Morales', 'accepted', 'Stamped Concrete', '{"length":20,"width":16,"square_footage":320}', ARRAY['Ashlar Slate'], 'moderate', '{"demolition":false,"grading":true,"sealing":true,"color_stain":"Desert Tan with Dark Walnut Release"}', '[{"id":"li-1","category":"material","description":"Concrete (6-sack mix) — 320 sq ft at 4\" depth","quantity":4,"unit":"yards","unit_cost":165,"total":660},{"id":"li-2","category":"material","description":"Ashlar Slate stamp mats & color hardener","quantity":1,"unit":"set","unit_cost":480,"total":480},{"id":"li-3","category":"material","description":"Rebar & mesh reinforcement","quantity":320,"unit":"sq ft","unit_cost":1.25,"total":400},{"id":"li-4","category":"material","description":"Acrylic sealer (2 coats)","quantity":5,"unit":"gallons","unit_cost":45,"total":225},{"id":"li-5","category":"labor","description":"Excavation & grading","quantity":8,"unit":"hours","unit_cost":65,"total":520},{"id":"li-6","category":"labor","description":"Forming, pouring & stamping","quantity":24,"unit":"hours","unit_cost":65,"total":1560},{"id":"li-7","category":"labor","description":"Finishing & sealing","quantity":8,"unit":"hours","unit_cost":65,"total":520},{"id":"li-8","category":"equipment","description":"Skid steer rental (1 day)","quantity":1,"unit":"day","unit_cost":350,"total":350},{"id":"li-9","category":"equipment","description":"Concrete pump truck","quantity":1,"unit":"trip","unit_cost":450,"total":450}]', 5165, 1291, 6456, '3-4 days on site, weather permitting', 'Includes fire pit cutout. Customer providing fire pit insert. Color samples approved.', '2026-02-14T10:00:00Z', '2026-02-20T11:30:00Z'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Brian Whitfield', 'sent', 'Concrete Driveway', '{"length":60,"width":12,"depth":6,"square_footage":720}', ARRAY['Broom Finish'], 'moderate', '{"demolition":true,"grading":true,"sealing":false,"color_stain":""}', '[{"id":"li-10","category":"material","description":"Concrete (6-sack mix) — 720 sq ft at 6\" depth","quantity":14,"unit":"yards","unit_cost":165,"total":2310},{"id":"li-11","category":"material","description":"Rebar grid (#4 rebar, 18\" OC)","quantity":720,"unit":"sq ft","unit_cost":1.5,"total":1080},{"id":"li-12","category":"labor","description":"Demolition & haul-off of existing driveway","quantity":16,"unit":"hours","unit_cost":65,"total":1040},{"id":"li-13","category":"labor","description":"Grading & compaction","quantity":8,"unit":"hours","unit_cost":65,"total":520},{"id":"li-14","category":"labor","description":"Forming, pouring & finishing","quantity":24,"unit":"hours","unit_cost":65,"total":1560},{"id":"li-15","category":"equipment","description":"Skid steer + dump trailer (2 days)","quantity":2,"unit":"days","unit_cost":450,"total":900},{"id":"li-16","category":"equipment","description":"Concrete pump truck","quantity":1,"unit":"trip","unit_cost":450,"total":450}]', 7860, 1965, 9825, '4-5 days including demo and cure time', 'Drain issue noted at site visit — may need to adjust grade.', '2026-03-01T09:30:00Z', '2026-03-01T09:30:00Z'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'Angela Ross', 'draft', 'Decorative Curbing', '{"linear_feet":120}', ARRAY['Mower Edge'], 'easy', '{"demolition":false,"grading":false,"sealing":true,"color_stain":"Charcoal Gray"}', '[{"id":"li-17","category":"material","description":"Curbing mix & color additive","quantity":120,"unit":"linear ft","unit_cost":2.5,"total":300},{"id":"li-18","category":"material","description":"Sealer","quantity":2,"unit":"gallons","unit_cost":45,"total":90},{"id":"li-19","category":"labor","description":"Layout, extrude & finish curbing","quantity":10,"unit":"hours","unit_cost":65,"total":650},{"id":"li-20","category":"equipment","description":"Curbing machine","quantity":1,"unit":"day","unit_cost":200,"total":200}]', 1240, 310, 1550, '1 day on site', 'Customer wants to match neighbor''s curbing style.', '2026-03-18T14:00:00Z', '2026-03-18T14:00:00Z'),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Tom & Diane Marshall', 'sent', 'Landscaping', '{"square_footage":2400}', ARRAY['Retaining Walls','Mulch Beds','Plantings & Shrubs'], 'difficult', '{"demolition":false,"grading":true,"sealing":false,"color_stain":""}', '[{"id":"li-21","category":"material","description":"Retaining wall blocks (45 linear ft, 3 courses)","quantity":540,"unit":"blocks","unit_cost":4.5,"total":2430},{"id":"li-22","category":"material","description":"Mulch (hardwood)","quantity":15,"unit":"yards","unit_cost":55,"total":825},{"id":"li-23","category":"material","description":"Plants, shrubs & perennials","quantity":1,"unit":"lot","unit_cost":2800,"total":2800},{"id":"li-24","category":"material","description":"Landscape fabric & edging","quantity":1,"unit":"lot","unit_cost":350,"total":350},{"id":"li-25","category":"labor","description":"Grading & site prep","quantity":16,"unit":"hours","unit_cost":65,"total":1040},{"id":"li-26","category":"labor","description":"Retaining wall construction","quantity":32,"unit":"hours","unit_cost":65,"total":2080},{"id":"li-27","category":"labor","description":"Planting & mulching","quantity":16,"unit":"hours","unit_cost":65,"total":1040},{"id":"li-28","category":"equipment","description":"Mini excavator rental (2 days)","quantity":2,"unit":"days","unit_cost":400,"total":800}]', 11365, 2841, 14206, '7-10 days depending on weather', 'Full backyard renovation. Includes 15x20 patio area prep (patio quoted separately).', '2026-03-15T14:00:00Z', '2026-03-15T14:00:00Z');

-- ══════════════════════════════════════════════
-- INVOICES
-- ══════════════════════════════════════════════

INSERT INTO invoices (id, customer_id, lead_id, estimate_id, invoice_number, status, line_items, subtotal, tax_rate, tax_amount, total, notes, due_date, sent_at, viewed_at, paid_at, payment_method, stripe_payment_intent_id, created_at, updated_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000001', 'TFT-0001', 'paid', '[{"id":"ili-1","description":"Post Frame Workshop — 24x30 with lean-to","quantity":1,"unit_price":28000,"total":28000}]', 28000, 0.07, 1960, 29960, 'Final payment for completed workshop build. Thank you for your business!', '2026-03-15T00:00:00Z', '2026-03-12T10:00:00Z', '2026-03-12T14:22:00Z', '2026-03-12T15:00:00Z', 'stripe', 'pi_demo_001', '2026-03-12T09:30:00Z', '2026-03-12T15:00:00Z'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', NULL, 'TFT-0002', 'sent', '[{"id":"ili-2","description":"Post Frame Garage 30x40 — Deposit","quantity":1,"unit_price":10000,"total":10000}]', 10000, 0.07, 700, 10700, '50% deposit required before project start. Balance due upon completion.', '2026-04-01T00:00:00Z', '2026-03-20T09:00:00Z', NULL, NULL, NULL, NULL, '2026-03-20T08:45:00Z', '2026-03-20T09:00:00Z'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', NULL, 'TFT-0003', 'viewed', '[{"id":"ili-3","description":"Circular Driveway — Exposed aggregate finish","quantity":1800,"unit_price":8.5,"total":15300},{"id":"ili-4","description":"Turnaround area — additional forming & pour","quantity":1,"unit_price":3200,"total":3200}]', 18500, 0.07, 1295, 19795, 'Balance due for circular driveway project. Deposit of $5,000 already received.', '2026-04-05T00:00:00Z', '2026-03-19T16:30:00Z', '2026-03-20T08:15:00Z', NULL, NULL, NULL, '2026-03-19T16:00:00Z', '2026-03-20T08:15:00Z'),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', NULL, 'TFT-0004', 'overdue', '[{"id":"ili-5","description":"Commercial Pole Barn 40x60 — Deposit (30%)","quantity":1,"unit_price":15600,"total":15600}]', 15600, 0.07, 1092, 16692, 'Deposit invoice for 40x60 commercial pole barn. Please remit payment to begin material ordering.', '2026-03-15T00:00:00Z', '2026-03-05T10:00:00Z', '2026-03-05T18:30:00Z', NULL, NULL, NULL, '2026-03-05T09:30:00Z', '2026-03-05T18:30:00Z'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'TFT-0005', 'partial', '[{"id":"ili-6","description":"Stamped Concrete Patio — Ashlar Slate pattern, 320 sq ft","quantity":320,"unit_price":18.75,"total":6000},{"id":"ili-7","description":"Fire pit cutout & prep","quantity":1,"unit_price":1200,"total":1200},{"id":"ili-8","description":"Acrylic sealer (2 coats)","quantity":1,"unit_price":800,"total":800}]', 8000, 0.07, 560, 8560, 'Deposit of $3,000 received. Remaining balance due upon completion.', '2026-03-30T00:00:00Z', '2026-03-10T11:00:00Z', '2026-03-10T14:00:00Z', NULL, NULL, NULL, '2026-03-10T10:30:00Z', '2026-03-10T14:00:00Z'),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'TFT-0006', 'draft', '[{"id":"ili-9","description":"Driveway Tear-out & Replace — 720 sq ft, 6\" pour","quantity":1,"unit_price":12200,"total":12200}]', 12200, 0.07, 854, 13054, 'Pending customer approval of quote. Draft invoice prepared.', '2026-04-15T00:00:00Z', NULL, NULL, NULL, NULL, NULL, '2026-03-22T14:00:00Z', '2026-03-22T14:00:00Z');

-- ══════════════════════════════════════════════
-- PAYMENTS
-- ══════════════════════════════════════════════

INSERT INTO payments (id, invoice_id, amount, method, stripe_payment_id, notes, created_at)
VALUES
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000001', 29960, 'stripe', 'ch_demo_001', 'Full payment via Stripe', '2026-03-12T15:00:00Z'),
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000005', 3000, 'check', NULL, 'Deposit — check #4821', '2026-03-10T16:00:00Z');

-- ══════════════════════════════════════════════
-- AI AGENTS
-- ══════════════════════════════════════════════

INSERT INTO ai_agents (id, name, type, description, status, config, last_run, actions_today, actions_this_week, created_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Lead Follow-Up Agent', 'lead_followup', 'Monitors new leads that haven''t been contacted within 24 hours. Automatically drafts a follow-up email or SMS for team review.', 'active', '{"wait_hours":24,"escalate_after_days":3,"approval_mode":"requires_approval","message_template":"Hi {{first_name}},\n\nThank you for reaching out to The Finishing Touch!"}', '2026-03-24T08:00:00Z', 3, 12, '2026-02-01T00:00:00Z'),
  ('f0000000-0000-0000-0000-000000000002', 'Quote Follow-Up Agent', 'quote_followup', 'Monitors leads in quoted status that haven''t responded in 3 days. Drafts a gentle nudge email.', 'active', '{"wait_hours":72,"escalate_after_days":7,"approval_mode":"auto_send"}', '2026-03-24T08:00:00Z', 1, 5, '2026-02-01T00:00:00Z'),
  ('f0000000-0000-0000-0000-000000000003', 'Review Request Agent', 'review_request', 'Triggers when a lead moves to completed status. Sends Google review request after 3 days.', 'active', '{"wait_hours":72,"escalate_after_days":7,"approval_mode":"auto_send"}', '2026-03-24T08:00:00Z', 0, 2, '2026-02-01T00:00:00Z'),
  ('f0000000-0000-0000-0000-000000000004', 'Website Chatbot', 'website_chatbot', 'Answers common questions on thefinishingtouchllc.com — pricing, service area, scheduling, and services.', 'paused', '{"wait_hours":0,"escalate_after_days":0,"approval_mode":"auto_send"}', '2026-03-23T22:15:00Z', 0, 8, '2026-02-15T00:00:00Z');

-- ══════════════════════════════════════════════
-- AGENT ACTIONS
-- ══════════════════════════════════════════════

INSERT INTO agent_actions (id, agent_id, customer_id, lead_id, action_type, description, status, created_at)
VALUES
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'email_sent', 'Sent follow-up email to Mark Stevenson — new lead, no contact in 24h.', 'completed', '2026-03-24T08:05:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', 'email_sent', 'Sent follow-up email to Sarah & Dave Henning — new lead, no contact in 24h.', 'completed', '2026-03-24T08:06:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'email_sent', 'Drafted follow-up for Derek Johnson — awaiting approval.', 'pending_approval', '2026-03-24T08:07:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'email_sent', 'Sent quote follow-up to Brian Whitfield — quoted 3+ days ago.', 'completed', '2026-03-24T08:10:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'escalated', 'Escalated Angela Ross — no response after 7 days on quote.', 'completed', '2026-03-23T08:10:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'review_requested', 'Sent Google review request to Patricia Okonkwo — project completed.', 'completed', '2026-03-22T08:00:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000012', NULL, 'lead_created', 'Chatbot created new lead from website visitor: Nancy Caldwell — Curbing inquiry.', 'completed', '2026-03-23T14:30:00Z'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'email_sent', 'Sent quote follow-up to Tom & Diane Marshall — quoted 7+ days ago.', 'completed', '2026-03-22T08:15:00Z');

-- ══════════════════════════════════════════════
-- MARKETING CONTACTS
-- ══════════════════════════════════════════════

INSERT INTO marketing_contacts (id, customer_id, name, email, tags, subscribed, created_at)
VALUES
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'Steve & Linda Morales', 'smorales@gmail.com', ARRAY['past-customer','concrete','stamped-concrete'], true, '2026-02-10T14:30:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'Brian Whitfield', 'bwhitfield@yahoo.com', ARRAY['active-lead','concrete','driveway'], true, '2026-02-18T10:15:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'Rachel Kim', 'rachelk@outlook.com', ARRAY['active-lead','post-frame'], true, '2026-01-22T16:45:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004', 'Tom & Diane Marshall', 'tmarshall@gmail.com', ARRAY['active-lead','landscaping'], true, '2026-03-01T09:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000005', 'Angela Ross', 'aross@icloud.com', ARRAY['active-lead','curbing'], true, '2026-03-05T13:20:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000006', 'Derek Johnson', 'djohnson@gmail.com', ARRAY['new-lead','concrete'], true, '2026-03-08T11:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000007', 'Carla & Jim Nesbitt', 'cnesbitt@gmail.com', ARRAY['active-lead','driveway','premium'], true, '2026-02-25T08:30:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000008', 'Patricia Okonkwo', 'pokonkwo@hotmail.com', ARRAY['past-customer','post-frame'], true, '2026-01-30T15:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000009', 'Mark Stevenson', 'mstevenson@gmail.com', ARRAY['new-lead','concrete'], true, '2026-03-15T10:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', 'Sarah & Dave Henning', 'shenning@gmail.com', ARRAY['new-lead','landscaping','firewood'], true, '2026-03-18T14:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000011', 'Luis Hernandez', 'lhernandez@yahoo.com', ARRAY['active-lead','post-frame','commercial'], false, '2026-02-05T09:00:00Z'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000012', 'Nancy Caldwell', 'ncaldwell@gmail.com', ARRAY['new-lead','curbing','chatbot'], true, '2026-03-20T16:00:00Z');

-- ══════════════════════════════════════════════
-- EMAIL TEMPLATES
-- ══════════════════════════════════════════════

INSERT INTO email_templates (id, name, subject, body, category, merge_fields, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Spring Season Kickoff', 'Spring is here! Book your outdoor project with The Finishing Touch', 'Hi {{first_name}},\n\nSpring is right around the corner, and it''s the perfect time to start planning your outdoor project!\n\nWhether you''re dreaming of a new stamped concrete patio, a fresh driveway, or a beautiful landscape makeover — we''re ready to bring your vision to life.\n\nBook before April 15 and get 10% off your project!\n\nReply to this email or call us at (765) 555-0100 to schedule your free estimate.\n\nBest,\nThe Finishing Touch Team', 'seasonal_promo', ARRAY['first_name'], '2026-02-20T10:00:00Z', '2026-03-01T09:00:00Z'),
  (gen_random_uuid(), 'New Service: Decorative Curbing', 'NEW! Decorative Curbing now available from The Finishing Touch', 'Hi {{first_name}},\n\nExciting news — we''ve added Decorative Curbing to our service lineup!\n\nStarting at just $8/linear foot installed.\n\nInterested? Reply to this email or visit our website to learn more.\n\nCheers,\nThe Finishing Touch Team', 'new_service', ARRAY['first_name'], '2026-03-01T10:00:00Z', '2026-03-01T10:00:00Z'),
  (gen_random_uuid(), 'Project Showcase: Stamped Patio', 'See what we built: Stunning stamped concrete patio in Greentown', 'Hi {{first_name}},\n\nCheck out our latest project — a beautiful ashlar slate stamped concrete patio with an integrated fire pit, built right here in Greentown.\n\nSchedule a free consultation today.\n\nCall (765) 555-0100 or reply to this email.\n\nThe Finishing Touch Team', 'project_showcase', ARRAY['first_name'], '2026-03-10T10:00:00Z', '2026-03-10T10:00:00Z'),
  (gen_random_uuid(), 'Review Request', 'How did we do? Leave us a Google review!', 'Hi {{first_name}},\n\nThank you for choosing The Finishing Touch for your {{project_type}} project!\n\nWe hope everything looks great. If you have a moment, we''d really appreciate a quick Google review.\n\nLeave a review: https://g.page/thefinishingtouchllc/review\n\nThank you!\nThe Finishing Touch Team', 'review_request', ARRAY['first_name','project_type'], '2026-02-01T10:00:00Z', '2026-02-01T10:00:00Z');

-- ══════════════════════════════════════════════
-- AUTOMATIONS
-- ══════════════════════════════════════════════

INSERT INTO automations (id, name, description, trigger, status, emails, enrolled_count, completed_count, created_at)
VALUES
  (gen_random_uuid(), 'New Lead Welcome', 'Welcomes new leads with a 3-email sequence over 2 weeks introducing TFT services.', 'New lead created in CRM', 'active', '[{"id":"ae-1","subject":"Welcome to The Finishing Touch!","body":"Hi {{first_name}}, thanks for reaching out!","delay_days":0},{"id":"ae-2","subject":"What sets The Finishing Touch apart","body":"Hi {{first_name}}, we wanted to share a bit about why homeowners choose us...","delay_days":5},{"id":"ae-3","subject":"Ready to get started?","body":"Hi {{first_name}}, we''d love to give you a free estimate...","delay_days":14}]', 6, 3, '2026-02-01T00:00:00Z'),
  (gen_random_uuid(), 'Post-Quote Follow-Up', 'Follows up with leads who have received a quote but haven''t responded.', 'Lead moved to quoted status', 'active', '[{"id":"ae-4","subject":"Your estimate from The Finishing Touch","body":"Hi {{first_name}}, just wanted to make sure you received the estimate...","delay_days":3},{"id":"ae-5","subject":"Still thinking it over?","body":"Hi {{first_name}}, no rush — we know these are big decisions...","delay_days":7}]', 4, 2, '2026-02-01T00:00:00Z'),
  (gen_random_uuid(), 'Post-Project Thank You + Review', 'Thanks customers after project completion and asks for a Google review.', 'Lead moved to completed status', 'active', '[{"id":"ae-6","subject":"Thank you for choosing The Finishing Touch!","body":"Hi {{first_name}}, we truly appreciate your trust...","delay_days":1},{"id":"ae-7","subject":"Mind leaving us a quick review?","body":"Hi {{first_name}}, if you''re enjoying your new project...","delay_days":14}]', 2, 1, '2026-02-01T00:00:00Z'),
  (gen_random_uuid(), 'Seasonal Reactivation', 'Reaches out to past customers before each season with relevant offers.', 'Seasonal (Spring/Fall) — past customers only', 'paused', '[{"id":"ae-8","subject":"It''s almost {{season}} — time to plan!","body":"Hi {{first_name}}, as a past customer, you get priority scheduling and 5% off...","delay_days":0}]', 2, 0, '2026-02-15T00:00:00Z');

-- ══════════════════════════════════════════════
-- AVAILABILITY RULES (Mike, Mon-Fri 8am-5pm)
-- ══════════════════════════════════════════════

DELETE FROM availability_rules;
INSERT INTO availability_rules (id, team_member_id, day_of_week, start_time, end_time, is_enabled)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 1, '08:00', '17:00', true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 2, '08:00', '17:00', true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 3, '08:00', '17:00', true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 4, '08:00', '17:00', true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 5, '08:00', '17:00', true);

-- ══════════════════════════════════════════════
-- CALENDAR EVENTS (relative to today)
-- ══════════════════════════════════════════════

INSERT INTO calendar_events (id, team_member_id, type, status, title, description, start_time, end_time, customer_name, customer_phone, customer_address, service_type, project_description, created_by, lead_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'quote_visit', 'scheduled', 'Quote: Steve & Linda Morales', NULL, (CURRENT_DATE + INTERVAL '2 days') + TIME '14:00', (CURRENT_DATE + INTERVAL '2 days') + TIME '15:00', 'Steve & Linda Morales', '(765) 555-0142', '4521 Elm Creek Dr, Greentown, IN', 'Concrete Patio', '20x20 stamped patio with fire pit pad', 'agent', 'b0000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'quote_visit', 'scheduled', 'Quote: Brian Whitfield', NULL, (CURRENT_DATE + INTERVAL '3 days') + TIME '11:00', (CURRENT_DATE + INTERVAL '3 days') + TIME '12:00', 'Brian Whitfield', '(765) 555-0287', '1102 N Main St, Kokomo, IN', 'Concrete Driveway', 'Replace cracked driveway, exposed aggregate finish', 'manual', 'b0000000-0000-0000-0000-000000000002', now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'blocked', 'scheduled', 'Lunch', NULL, (CURRENT_DATE + INTERVAL '1 day') + TIME '12:00', (CURRENT_DATE + INTERVAL '1 day') + TIME '13:00', NULL, NULL, NULL, NULL, NULL, 'manual', NULL, now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'pour_day', 'scheduled', 'Pour: Morales Patio', 'Stamped concrete pour day', (CURRENT_DATE + INTERVAL '5 days') + TIME '07:00', (CURRENT_DATE + INTERVAL '5 days') + TIME '16:00', 'Steve & Linda Morales', '(765) 555-0142', '4521 Elm Creek Dr, Greentown, IN', 'Stamped Concrete', 'Pour and stamp 320 sq ft patio', 'manual', 'b0000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'quote_visit', 'scheduled', 'Quote: Tom & Diane Marshall', NULL, (CURRENT_DATE + INTERVAL '4 days') + TIME '10:00', (CURRENT_DATE + INTERVAL '4 days') + TIME '11:00', 'Tom & Diane Marshall', '(765) 555-0518', '220 W Sycamore St, Greentown, IN', 'Landscaping', 'Full backyard renovation walkthrough', 'manual', 'b0000000-0000-0000-0000-000000000004', now(), now());

-- ══════════════════════════════════════════════
-- JOB WALKS
-- ══════════════════════════════════════════════

INSERT INTO job_walks (id, customer_id, lead_id, calendar_event_id, status, measurements, site_conditions, customer_preferences, sketch_url, voice_note_url, gps_lat, gps_lng, weather, voice_transcript, created_by, created_at, updated_at, completed_at)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL, 'draft',
    '{"areas":[{"id":"area-1","name":"Main Patio","length":20,"width":15,"depth":4},{"id":"area-2","name":"Fire Pit Pad","length":8,"width":8,"depth":6}],"linear_feet":null,"grade":"Slight Slope","elevation_change":6}',
    '{"soil_type":"Clay","drainage":"Poor","access":"Easy","existing_surface":"Grass/Sod","demolition_required":false,"grading_required":true,"grading_yards":3,"obstacles":["Trees","Roots"],"utility_lines":"Located","permit_needed":"No","notes":"Large oak tree near south edge, roots may be an issue."}',
    '{"what_they_want":"Stamped patio with fire pit area","material_preference":"Ashlar Slate","color_finish":"Desert Brown with Charcoal release","timeline":"2 Weeks","budget_range":"$5-10K","decision_maker":"Yes","getting_other_quotes":true,"other_quotes_count":2,"referral_potential":"Hot","priority":"hot"}',
    NULL, NULL, 40.4774, -85.8766, '{"temp":72,"conditions":"Partly Cloudy","recent_rain":false}', NULL, 'a0000000-0000-0000-0000-000000000001', '2026-03-25T14:30:00Z', '2026-03-25T14:30:00Z', NULL),
  ('70000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', NULL, 'estimated',
    '{"areas":[{"id":"area-3","name":"Driveway","length":40,"width":16,"depth":4},{"id":"area-4","name":"Turnaround","length":12,"width":12,"depth":4}],"linear_feet":null,"grade":"Flat","elevation_change":0}',
    '{"soil_type":"Sandy","drainage":"Good","access":"Easy","existing_surface":"Concrete","demolition_required":true,"demolition_area":640,"grading_required":false,"obstacles":["Utilities"],"utility_lines":"Located","permit_needed":"No","notes":"Existing driveway has significant cracking. Gas line runs along east side."}',
    '{"what_they_want":"Replace cracked driveway with exposed aggregate finish","material_preference":"Exposed Aggregate","color_finish":"Natural gray","timeline":"1 Month","budget_range":"$10-20K","decision_maker":"Yes","getting_other_quotes":false,"referral_potential":"Maybe","priority":"warm"}',
    NULL, NULL, 40.4862, -86.1336, '{"temp":65,"conditions":"Sunny","recent_rain":true}', NULL, 'a0000000-0000-0000-0000-000000000001', '2026-03-20T10:00:00Z', '2026-03-20T10:45:00Z', '2026-03-20T10:45:00Z'),
  ('70000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', NULL, NULL, 'completed',
    '{"areas":[{"id":"area-5","name":"Building Pad","length":40,"width":30,"depth":4}],"linear_feet":140,"grade":"Moderate Slope","elevation_change":18}',
    '{"soil_type":"Clay","drainage":"Poor","access":"Moderate","existing_surface":"Grass/Sod","demolition_required":false,"grading_required":true,"grading_yards":12,"obstacles":["Trees","Fence","Septic"],"utility_lines":"Need to Call 811","permit_needed":"Yes","notes":"Septic field on the north side. Building needs to be setback 25 feet."}',
    '{"what_they_want":"30x40 post frame garage with concrete floor","material_preference":"Metal Roof & Siding","color_finish":"Charcoal roof, Sandstone siding","timeline":"Spring","budget_range":"$20K+","decision_maker":"Need to talk to spouse","getting_other_quotes":true,"other_quotes_count":3,"referral_potential":"Unlikely","priority":"cool"}',
    NULL, NULL, 40.0456, -86.0086, '{"temp":58,"conditions":"Overcast","recent_rain":true}', NULL, 'a0000000-0000-0000-0000-000000000002', '2026-03-15T09:00:00Z', '2026-03-15T09:50:00Z', '2026-03-15T09:50:00Z');

-- ══════════════════════════════════════════════
-- JOB WALK PHOTOS
-- ══════════════════════════════════════════════

INSERT INTO job_walk_photos (id, job_walk_id, photo_url, caption, category, annotations, sort_order, created_at)
VALUES
  (gen_random_uuid(), '70000000-0000-0000-0000-000000000001', '/placeholder-photo-1.jpg', 'Backyard overview from deck', 'overview', '[]', 1, '2026-03-25T14:35:00Z'),
  (gen_random_uuid(), '70000000-0000-0000-0000-000000000001', '/placeholder-photo-2.jpg', 'Oak tree root system near patio edge', 'obstacle', '[]', 2, '2026-03-25T14:36:00Z'),
  (gen_random_uuid(), '70000000-0000-0000-0000-000000000001', '/placeholder-photo-3.jpg', 'Grade change along south side', 'measurement_reference', '[]', 3, '2026-03-25T14:37:00Z'),
  (gen_random_uuid(), '70000000-0000-0000-0000-000000000002', '/placeholder-photo-4.jpg', 'Existing driveway cracking', 'existing_condition', '[]', 1, '2026-03-20T10:10:00Z'),
  (gen_random_uuid(), '70000000-0000-0000-0000-000000000002', '/placeholder-photo-5.jpg', 'Garage approach area', 'overview', '[]', 2, '2026-03-20T10:12:00Z');

-- ══════════════════════════════════════════════
-- COMPANY SETTINGS
-- ══════════════════════════════════════════════

INSERT INTO company_settings (key, value, updated_at)
VALUES
  ('company', '{"name":"The Finishing Touch LLC","email":"evan@thefinishingtouchllc.com","phone":"(765) 555-0100","address":"Greentown, IN 46936","website":"thefinishingtouchllc.com","tax_rate":0.07}', now()),
  ('invoice_defaults', '{"payment_terms":"Net 30","tax_rate":0.07,"late_fee_percent":0,"deposit_percent":50}', now()),
  ('branding', '{"primary_color":"#1e40af","accent_color":"#3b82f6","logo_url":null}', now());

COMMIT;
