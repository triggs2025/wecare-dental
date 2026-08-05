# WE CARE Dental · Status and pickup notes

Last worked on: August 5, 2026. Safe to resume from any computer.

## Read this first (two computer workflow)

Tony works on this from two machines. This file is the handoff, so it is kept
current at the end of every session.

1. START of a session: `git pull` before touching anything. OneDrive may lag
   behind GitHub, and GitHub is the source of truth.
2. END of a session: update the Current state, Session log, and Next steps
   sections below, then commit and push. Do not leave work only on one machine.
3. If OneDrive shows a conflicted copy of a file, trust git and delete the
   conflicted copy.

## Where things live

- Live site: https://triggs2025.github.io/wecare-dental/
- Admin panel: https://triggs2025.github.io/wecare-dental/admin.html (demo PIN: 1234)
- GitHub repo: https://github.com/triggs2025/wecare-dental (account triggs2025, deploys from main branch via GitHub Pages)
- Local folder: OneDrive - NEEDTHESE\Desktop\Claude Code\wecare-dental (this folder, includes the .git repo, so it syncs whole)
- Her Facebook page: https://www.facebook.com/profile.php?id=100069799874613

## Publishing workflow

Edit files, then commit and push to main. GitHub Pages redeploys automatically in about a minute. If working from a computer where OneDrive has not synced, `git clone https://github.com/triggs2025/wecare-dental` gets the same thing.

## Current state

- Bilingual EN/ES one-page site, auto language detect plus manual toggle
- Logo: refined redraw of HER real logo (one-line hand-cradling-a-smile art, aqua blobs, aqua WE CARE wordmark, credentials pill "C.D. E.E. Karina González Robles"). All inline SVG in index.html and admin.html
- Booking request form on the site feeds the admin panel
- Admin panel: requests inbox, week calendar with click-to-book, prefilled bilingual WhatsApp confirm/reminder links (these really work), analytics tab with labeled sample data
- Demo limitation: requests/appointments are localStorage, same-browser only. Real backend comes with GoHighLevel

## Session log (newest first)

- Aug 5, 2026: Located the project again after it went missing from chat
  history. Confirmed live pages return 200 and match the local files byte for
  byte (index 32,035 bytes, admin 32,637 bytes). Fast forwarded the local copy,
  which was one commit behind. Added the two computer workflow rules above. No
  site code changed.
- Aug 4, 2026: Created this NOTES.md so work could resume from either computer.
- Aug 2, 2026: Added the admin panel (requests inbox, week calendar, WhatsApp
  notify, sample analytics), the booking form, and the refined logo redrawn
  from her original mark.

## Facts still unconfirmed with her (site uses placeholders)

- Business hours (site shows Mon-Fri 9-6, Sat 9-2)
- Exact street address beyond "Avenida Alvaro Obregon, Residencias, 83448"
- Services list and pricing claims (50-70% savings line)
- Spelling/format of credentials: currently "C.D. E.E. Karina González Robles"

## Next steps (planned, not started)

1. Reveal to her, get feedback on design and logo
2. Set up GoHighLevel: booking calendar embed (slot is marked GHL-CALENDAR-SLOT in index.html), CRM, chat widget, automated reminders
3. Real analytics tracking (GHL or Google Analytics)
4. Custom domain, or move into GHL's site builder
5. High-res logo exports (PNG) for social avatars and print
