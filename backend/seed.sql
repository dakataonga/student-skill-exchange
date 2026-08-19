-- Seed data for demos/screenshots. Safe to re-run (uses ON CONFLICT DO NOTHING
-- on emails). Passwords for ALL seeded users below are: password123
-- (hash generated with bcrypt, 10 rounds)

-- Fake verified students. All share the same bcrypt hash for "password123".
INSERT INTO users (name, email, password_hash, role, student_id, verified) VALUES
  ('Chanda Mwila',    'chanda.mwila@demo.edu',    '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU1001', TRUE),
  ('Bwalya Phiri',    'bwalya.phiri@demo.edu',    '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU1002', TRUE),
  ('Natasha Banda',   'natasha.banda@demo.edu',   '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU1003', TRUE),
  ('Mwape Chileshe',  'mwape.chileshe@demo.edu',  '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU1004', TRUE),
  ('Kunda Sikazwe',   'kunda.sikazwe@demo.edu',   '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU1005', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Listings across different categories, mixing barter/paid/both
INSERT INTO skills_offered (user_id, category_id, title, description, payment_type, price, availability)
SELECT u.id, c.id, v.title, v.description, v.payment_type::payment_type, v.price, v.availability
FROM (VALUES
  ('chanda.mwila@demo.edu',   'Programming',       'Python for beginners',            'I''ll teach you Python basics: variables, loops, functions, and how to build small projects.', 'barter', NULL, 'Weekday evenings'),
  ('bwalya.phiri@demo.edu',   'Graphic Design',    'Canva & Photoshop tutoring',       'Learn how to design posters, social media graphics, and simple logos.', 'paid', 50, 'Weekends'),
  ('natasha.banda@demo.edu',  'Tutoring',          'Calculus & Statistics help',       'Struggling with first-year math? I can walk through problem sets and exam prep.', 'both', 30, 'Weekday afternoons'),
  ('mwape.chileshe@demo.edu', 'Photography',       'Portrait photography basics',      'Camera settings, lighting, and posing for portrait shoots.', 'barter', NULL, 'Weekends'),
  ('kunda.sikazwe@demo.edu',  'Music',             'Guitar lessons for beginners',      'Chords, strumming patterns, and how to read basic tabs.', 'paid', 40, 'Weekday evenings'),
  ('chanda.mwila@demo.edu',   'Repair Skills',     'Laptop hardware troubleshooting',  'RAM/SSD upgrades, cleaning, common hardware fixes.', 'barter', NULL, 'Weekends'),
  ('bwalya.phiri@demo.edu',   'Language Lessons',  'Conversational French',            'Practice everyday French conversation, no prior experience needed.', 'both', 25, 'Flexible')
) AS v(email, category_name, title, description, payment_type, price, availability)
JOIN users u ON u.email = v.email
JOIN skill_categories c ON c.name = v.category_name
ON CONFLICT DO NOTHING;

-- What each seeded student is looking for (drives both category matching and AI matching)
INSERT INTO skills_wanted (user_id, category_id, notes)
SELECT u.id, c.id, v.notes
FROM (VALUES
  ('chanda.mwila@demo.edu',   'Graphic Design', 'Need help designing a poster for a club event'),
  ('bwalya.phiri@demo.edu',   'Programming',    'Want to learn enough Python to automate spreadsheet tasks'),
  ('natasha.banda@demo.edu',  'Photography',    'Want better photos for my portfolio website'),
  ('mwape.chileshe@demo.edu', 'Tutoring',       'Need help preparing for a statistics exam'),
  ('kunda.sikazwe@demo.edu',  'Repair Skills',  'My laptop fan is loud and I think it needs cleaning')
) AS v(email, category_name, notes)
JOIN users u ON u.email = v.email
JOIN skill_categories c ON c.name = v.category_name
ON CONFLICT DO NOTHING;