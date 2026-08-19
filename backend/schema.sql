-- Student Skill Exchange Platform - PostgreSQL schema

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE payment_type AS ENUM ('barter', 'paid', 'both');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    student_id      VARCHAR(50) NOT NULL,          -- college-issued ID number
    id_document_url TEXT,                          -- optional uploaded proof
    verified        BOOLEAN NOT NULL DEFAULT FALSE, -- set true by admin after checking student_id
    bio             TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE skill_categories (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(80) UNIQUE NOT NULL
);

-- Skills a student OFFERS
CREATE TABLE skills_offered (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES skill_categories(id),
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    payment_type    payment_type NOT NULL DEFAULT 'barter',
    price           NUMERIC(10,2),                 -- null if pure barter
    availability    TEXT,                          -- free text e.g. "Weekday evenings"
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Skills a student WANTS (used for matching)
CREATE TABLE skills_wanted (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES skill_categories(id),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE requests (
    id              SERIAL PRIMARY KEY,
    seeker_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id        INTEGER NOT NULL REFERENCES skills_offered(id) ON DELETE CASCADE,
    status          request_status NOT NULL DEFAULT 'pending',
    agreed_payment  payment_type,                  -- how they agreed to settle this session
    agreed_price    NUMERIC(10,2),
    paid            BOOLEAN NOT NULL DEFAULT FALSE, -- mock payment flag, no real gateway yet
    scheduled_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    request_id      INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id              SERIAL PRIMARY KEY,
    request_id      INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    reviewer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id              SERIAL PRIMARY KEY,
    reported_by     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed some categories to start with
INSERT INTO skill_categories (name) VALUES
    ('Programming'), ('Graphic Design'), ('Tutoring'),
    ('Photography'), ('Music'), ('Language Lessons'), ('Repair Skills');

-- Helpful indexes
CREATE INDEX idx_skills_offered_category ON skills_offered(category_id);
CREATE INDEX idx_skills_wanted_category ON skills_wanted(category_id);
CREATE INDEX idx_requests_seeker ON requests(seeker_id);
CREATE INDEX idx_requests_provider ON requests(provider_id);
