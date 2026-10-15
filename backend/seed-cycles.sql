-- Demo data for MULTI-PARTY (CIRCULAR) EXCHANGE.
--
-- These three students deliberately have NO possible two-way match with
-- each other, but form a perfect 3-way loop:
--
--   Mulenga  offers Programming,      wants Music
--   Chipo    offers Music,            wants Language Lessons
--   Temba    offers Language Lessons, wants Programming
--
--   Mulenga --teaches Programming--> Temba
--   Temba   --teaches French-------> Chipo
--   Chipo   --teaches Guitar-------> Mulenga
--
-- Classic pairwise matching finds 0 matches among them.
-- Cycle detection finds 1. That contrast is the headline result.
--
-- All passwords: password123

INSERT INTO users (name, email, password_hash, role, student_id, verified) VALUES
  ('Mulenga Zulu',  'mulenga.zulu@demo.edu',  '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU2001', TRUE),
  ('Chipo Tembo',   'chipo.tembo@demo.edu',   '$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU2002', TRUE),
  ('Temba Nyirenda','temba.nyirenda@demo.edu','$2b$10$3sutY12S3sryuLfddnX3rO3w0cdQO1bjJkNHpUD6N8mLPFoPx/6Q6', 'student', 'STU2003', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO skills_offered (user_id, category_id, title, description, payment_type, price, availability)
SELECT u.id, c.id, v.title, v.description, v.payment_type::payment_type, v.price::numeric, v.availability
FROM (VALUES
  ('mulenga.zulu@demo.edu',   'Programming',      'Java & OOP fundamentals',   'Classes, inheritance, and building small Java programs from scratch.', 'barter', NULL, 'Weekday evenings'),
  ('chipo.tembo@demo.edu',    'Music',            'Piano and music theory',    'Reading sheet music, scales, and playing your first pieces.', 'barter', NULL, 'Weekends'),
  ('temba.nyirenda@demo.edu', 'Language Lessons', 'Beginner Portuguese',       'Everyday Portuguese conversation and pronunciation practice.', 'barter', NULL, 'Flexible')
) AS v(email, category_name, title, description, payment_type, price, availability)
JOIN users u ON u.email = v.email
JOIN skill_categories c ON c.name = v.category_name
ON CONFLICT DO NOTHING;

INSERT INTO skills_wanted (user_id, category_id, notes)
SELECT u.id, c.id, v.notes
FROM (VALUES
  ('mulenga.zulu@demo.edu',   'Music',            'Always wanted to learn an instrument'),
  ('chipo.tembo@demo.edu',    'Language Lessons', 'Planning to study abroad next year'),
  ('temba.nyirenda@demo.edu', 'Programming',      'Need Java for my second-year course')
) AS v(email, category_name, notes)
JOIN users u ON u.email = v.email
JOIN skill_categories c ON c.name = v.category_name
ON CONFLICT DO NOTHING;