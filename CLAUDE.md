# WE CARE Dental

Bilingual (EN/ES) sample site and staff admin panel for WE CARE Dental, the
practice of C.D. E.E. Karina González Robles in San Luis Río Colorado, Sonora,
Mexico. Built by Tony Riggs as a surprise. **It has not been shown to her yet
and is not connected to the real business.**

## Read NOTES.md first

`NOTES.md` is the live handoff document: current state, what is still
unconfirmed with her, and what is planned next. Read it at the start of every
session and update it at the end. Tony works on this from two computers and
that file is how the other machine finds out what happened.

## Files

Static site, no build step, no dependencies.

- `index.html` — public site. Everything inline: CSS in `<style>`, translations
  in the `I18N` object, logic in one `<script>` block at the bottom.
- `admin.html` — staff panel, demo PIN 1234.
- `assets/` — hero video (webm + mp4 fallback), poster, caption VTTs, her photo.

## Workflow

1. `git pull` before starting. The repo lives inside OneDrive, so OneDrive can
   lag behind GitHub. **Git is the source of truth.**
2. Edit, then commit and push to `main`. GitHub Pages redeploys in about a
   minute to https://triggs2025.github.io/wecare-dental/
3. Update `NOTES.md` in the same session, then push.

Never `git add -A` blindly: OneDrive drops conflict copies like
`NOTES-NT-TRIGGS-PC.md` into the folder. `.gitignore` covers the known patterns.

## Preview

`.claude/launch.json` serves the folder on port 8099 via `python -m http.server`.
Paths are relative, so it works on either computer. Start it with the preview
tooling, not with a raw shell command.

## Rules specific to this project

- **Never invent facts about Karina or the practice.** Her bio, hours,
  credentials, and pricing claims are either confirmed in `NOTES.md` or they are
  placeholders. If it is not confirmed, say so rather than filling the gap. The
  About section deliberately carries only verifiable statements.
- Keep every user-facing string bilingual. Anything added to the EN dictionary
  needs an ES counterpart, including `data-i18n-alt` and `data-i18n-aria` keys.
- The hero video autoplays muted, so its captions carry the message. Caption
  timings live in `assets/hero.en.vtt` and `assets/hero.es.vtt`.
- No backend yet. Booking requests and appointments use `localStorage`, so the
  site and admin panel only talk to each other in the same browser. GoHighLevel
  is the planned real backend; the calendar embed slot is marked
  `GHL-CALENDAR-SLOT` in `index.html`.
