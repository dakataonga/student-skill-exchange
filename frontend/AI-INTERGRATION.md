# AI integration: semantic skill matching

## The problem

The platform originally matched students using exact category equality:
a student "wants" Graphic Design, and gets matched only with listings
tagged Graphic Design. This misses real matches. Example:

- Student wants: "help designing a poster for a club event" (category: Graphic Design)
- Listing: "Canva and Photoshop tutoring" (category: Graphic Design) → matches, correctly
- Listing: "I can make simple flyers in PowerPoint" (category: Tutoring, not Graphic Design) → **missed**, even though it's clearly relevant

Category tags are too coarse. Two students can describe the same need
in different words, or file it under different categories entirely.

## The approach

`GET /api/skills/ai-matches` sends the student's "looking for" notes and
every other active listing's title/description to Claude (Anthropic API,
`claude-sonnet-4-6`), and asks it to return a ranked JSON list of matches
with a 0–100 relevance score and a one-sentence reason — instead of a
binary category match.

This catches cases like the PowerPoint example above, which the old
category filter would never surface, because Claude reads the actual
content rather than matching a tag.

## Why this design

- **Kept the old category matching too.** The AI feature lives in a
  separate endpoint (`/ai-matches`) rather than replacing `/matches`,
  so both approaches can be compared side by side.
- **Structured output over free text.** Asking for strict JSON (not a
  paragraph) means the result can be rendered as real UI (score badges,
  sorted list) instead of a wall of AI-generated text.
- **Server-side, not client-side.** The API key never reaches the
  browser — only the Express backend calls Anthropic.

## Where it lives in the codebase

| Piece | File |
|---|---|
| Anthropic client setup | `backend/src/anthropicClient.js` |
| Matching endpoint | `backend/src/routes/skills.js` -> `GET /ai-matches` |
| UI | `frontend/src/pages/Profile.jsx` -> "AI-powered matches" section |

## Known limitations / next steps

- Capped at 25 listings per request to keep the prompt small and cheap.
- No caching — every click re-queries Claude.
- Could be extended to also screen listing descriptions for
  inappropriate content before they go live (AI moderation).