# WE CARE Dental · Status and pickup notes

Last worked on: August 4, 2026. Safe to resume from any computer.

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
