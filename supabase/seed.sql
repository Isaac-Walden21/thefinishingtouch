-- Seed data for The Finishing Touch LLC CRM
-- Run after schema.sql

-- Team Members
INSERT INTO team_members (id, name, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mike Henderson', 'mike@thefinishingtouchllc.com', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Jake Henderson', 'jake@thefinishingtouchllc.com', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'Travis Cole', 'travis@thefinishingtouchllc.com', 'crew');

-- Customers
INSERT INTO customers (id, name, email, phone, address, city, state, zip, service_type, source, notes) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Steve & Linda Morales', 'smorales@gmail.com', '(765) 555-0142', '4521 Elm Creek Dr', 'Greentown', 'IN', '46936', 'Concrete Patio', 'Google', 'Referred by neighbor. Wants stamped concrete patio with fire pit.'),
  ('10000000-0000-0000-0000-000000000002', 'Brian Whitfield', 'bwhitfield@yahoo.com', '(765) 555-0287', '1102 N Main St', 'Kokomo', 'IN', '46901', 'Driveway', 'Facebook', 'Existing driveway is cracked. Wants full tear-out and replace.'),
  ('10000000-0000-0000-0000-000000000003', 'Rachel Kim', 'rachelk@outlook.com', '(317) 555-0391', '8834 Sycamore Ln', 'Noblesville', 'IN', '46060', 'Post Frame', 'Website', '30x40 post frame garage. Has plans drawn up already.'),
  ('10000000-0000-0000-0000-000000000004', 'Tom & Diane Marshall', 'tmarshall@gmail.com', '(765) 555-0518', '220 W Sycamore St', 'Greentown', 'IN', '46936', 'Landscaping', 'Referral', 'Full backyard renovation. Retaining wall + patio + landscaping.'),
  ('10000000-0000-0000-0000-000000000005', 'Angela Ross', 'aross@icloud.com', '(765) 555-0674', '7710 County Rd 200 W', 'Russiaville', 'IN', '46979', 'Curbing', 'Google', 'Landscape curbing around front beds and driveway border.'),
  ('10000000-0000-0000-0000-000000000006', 'Derek Johnson', 'djohnson@gmail.com', '(765) 555-0823', '3345 Apperson Way', 'Kokomo', 'IN', '46902', 'Concrete Patio', 'Facebook', 'Small 12x12 patio. Budget-conscious.'),
  ('10000000-0000-0000-0000-000000000007', 'Carla & Jim Nesbitt', 'cnesbitt@gmail.com', '(765) 555-0945', '560 E Carter St', 'Greentown', 'IN', '46936', 'Driveway', 'Yard Sign', 'Circular driveway pour. Premium finish.'),
  ('10000000-0000-0000-0000-000000000008', 'Patricia Okonkwo', 'pokonkwo@hotmail.com', '(317) 555-1032', '1290 Riverfront Pkwy', 'Westfield', 'IN', '46074', 'Post Frame', 'Website', '24x30 workshop with lean-to. Wants it done before summer.'),
  ('10000000-0000-0000-0000-000000000009', 'Mark Stevenson', 'mstevenson@gmail.com', '(765) 555-1188', '4400 S LaFountain St', 'Kokomo', 'IN', '46902', 'Concrete Patio', 'Google', NULL),
  ('10000000-0000-0000-0000-000000000010', 'Sarah & Dave Henning', 'shenning@gmail.com', '(765) 555-1344', '890 N Buckeye St', 'Greentown', 'IN', '46936', 'Landscaping', 'Referral', 'Wants firewood delivery this fall + spring landscaping.'),
  ('10000000-0000-0000-0000-000000000011', 'Luis Hernandez', 'lhernandez@yahoo.com', '(765) 555-1501', '2200 W Alto Rd', 'Howard County', 'IN', '46901', 'Post Frame', 'Facebook', '40x60 pole barn for equipment storage. Commercial project.'),
  ('10000000-0000-0000-0000-000000000012', 'Nancy Caldwell', 'ncaldwell@gmail.com', '(765) 555-1667', '615 Taylor St', 'Greentown', 'IN', '46936', 'Curbing', 'Yard Sign', 'Curbing + small walkway to front door.');

-- Leads
INSERT INTO leads (id, customer_id, status, quoted_amount, project_type, project_description, assigned_to) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'in_progress', 8500.00, 'Stamped Concrete Patio', '20x16 stamped patio with integrated fire pit. Ashlar slate pattern, desert tan color with dark walnut release.', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'quoted', 12200.00, 'Driveway Replacement', 'Full tear-out of existing 60ft driveway. 6-inch pour with rebar. Broom finish with saw-cut joints.', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'booked', 34000.00, 'Post Frame Garage', '30x40 post frame with 12ft sidewalls. 2 overhead doors, 1 walk door. Metal roof and siding, concrete floor.', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'quoted', 22500.00, 'Backyard Renovation', 'Retaining wall (45 linear ft), 15x20 patio, landscape beds with mulch and plantings.', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'contacted', NULL, 'Landscape Curbing', 'Curbing around 3 front beds + driveway border. Approximately 120 linear feet.', '00000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'new', NULL, 'Concrete Patio', '12x12 basic broom finish patio off back sliding door.', NULL),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'in_progress', 18500.00, 'Circular Driveway', 'Circular driveway with exposed aggregate finish. Includes turnaround area. ~1800 sq ft total.', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'completed', 28000.00, 'Post Frame Workshop', '24x30 workshop with 8ft lean-to. Insulated, wired for 200 amp service. Concrete floor with drain.', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 'new', NULL, 'Concrete Patio', 'Interested in a patio. No details yet.', NULL),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'new', NULL, 'Landscaping', 'Spring landscaping package + firewood delivery for fall.', NULL),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'booked', 52000.00, 'Commercial Pole Barn', '40x60 pole barn for equipment storage. 14ft sidewalls, 2 large overhead doors, gravel approach.', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 'contacted', NULL, 'Curbing + Walkway', 'Decorative curbing around beds and new concrete walkway to front door.', '00000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'lost', 4500.00, 'Sidewalk Repair', 'Previous inquiry for sidewalk. Went with another contractor.', '00000000-0000-0000-0000-000000000002');

-- Activities
INSERT INTO activities (lead_id, customer_id, type, description, created_by, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'call', 'Initial call with Steve. Discussed stamped patio options and fire pit placement.', '00000000-0000-0000-0000-000000000002', '2026-02-10 14:30:00+00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'quote', 'Sent quote for $8,500 — stamped patio with fire pit.', '00000000-0000-0000-0000-000000000002', '2026-02-15 10:00:00+00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'note', 'Customer approved quote. Deposit received. Scheduled for March.', '00000000-0000-0000-0000-000000000002', '2026-02-20 11:30:00+00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'note', 'Started excavation. Weather looks good for the week.', '00000000-0000-0000-0000-000000000001', '2026-03-10 08:00:00+00'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'call', 'Brian called about driveway replacement. Scheduled site visit.', '00000000-0000-0000-0000-000000000002', '2026-02-18 10:15:00+00'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'note', 'Site visit completed. Measured 60ft driveway, noted drain issues.', '00000000-0000-0000-0000-000000000002', '2026-02-22 14:00:00+00'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'quote', 'Sent quote for $12,200 — driveway tear-out and replace.', '00000000-0000-0000-0000-000000000002', '2026-03-01 09:30:00+00'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'email', 'Rachel emailed plans for 30x40 post frame. Reviewed specs.', '00000000-0000-0000-0000-000000000001', '2026-01-22 16:45:00+00'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'quote', 'Sent detailed quote for $34,000 — post frame garage.', '00000000-0000-0000-0000-000000000001', '2026-02-01 10:00:00+00'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'payment', 'Deposit received — $10,000. Project booked for April.', '00000000-0000-0000-0000-000000000001', '2026-03-15 11:00:00+00'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'call', 'Angela called about curbing. Wants to match neighbor style.', '00000000-0000-0000-0000-000000000003', '2026-03-05 13:20:00+00'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'note', 'Scheduled site visit for Friday to measure and pick colors.', '00000000-0000-0000-0000-000000000003', '2026-03-12 09:00:00+00'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'quote', 'Sent quote for $18,500 — circular driveway, exposed aggregate.', '00000000-0000-0000-0000-000000000001', '2026-03-01 14:00:00+00'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'payment', 'Deposit received — $5,000. Started forming.', '00000000-0000-0000-0000-000000000001', '2026-03-10 08:30:00+00'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'note', 'Project complete. Final inspection passed. Customer very happy.', '00000000-0000-0000-0000-000000000001', '2026-03-12 09:00:00+00'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'payment', 'Final payment received — $18,000. Project fully paid.', '00000000-0000-0000-0000-000000000001', '2026-03-12 15:00:00+00'),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'call', 'Luis called about large pole barn. Discussed specs and timeline.', '00000000-0000-0000-0000-000000000001', '2026-02-05 09:00:00+00'),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'quote', 'Sent quote for $52,000 — 40x60 commercial pole barn.', '00000000-0000-0000-0000-000000000001', '2026-02-15 10:00:00+00'),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'payment', 'Deposit received — $15,000. Booked for late April start.', '00000000-0000-0000-0000-000000000001', '2026-03-01 11:00:00+00'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'call', 'Diane called about backyard renovation. Wants full package.', '00000000-0000-0000-0000-000000000002', '2026-03-01 09:00:00+00'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'quote', 'Sent quote for $22,500 — retaining wall, patio, landscaping.', '00000000-0000-0000-0000-000000000002', '2026-03-15 14:00:00+00'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'email', 'Follow-up email sent. Waiting for approval on quote.', '00000000-0000-0000-0000-000000000002', '2026-03-22 10:00:00+00');
