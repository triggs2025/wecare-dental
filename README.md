# WE CARE Dental · Sample Website

Bilingual (EN/ES) one-page site for WE CARE Dental, San Luis Río Colorado, Sonora, México.
Built as a surprise sample; nothing is published or connected to the business yet.

## What it does

- Auto-detects browser language: Spanish browsers see Spanish, everyone else sees English
- Manual EN/ES toggle in the header; the choice is remembered (localStorage)
- New logo concept: teal tooth with a coral heart, playing off the "We Care" name
- WhatsApp booking buttons and floating chat bubble (wa.me/526535960691)
- Google Maps embed for the Avenida Alvaro Obregón location
- Ready-made slot for the GoHighLevel booking calendar (see below)

## Business info used (from her Facebook page)

- Address: Avenida Alvaro Obregón, Residencias, 83448, San Luis Río Colorado, Sonora
- Phone/WhatsApp: +52 653 596 0691
- Email: wecare.kgr@gmail.com
- Facebook: https://www.facebook.com/profile.php?id=100069799874613

NOTE: Hours shown on the site (Mon-Fri 9-6, Sat 9-2) are placeholders. Facebook only
showed "Closed now" without details. Confirm real hours with her before going live.

## Connecting GoHighLevel later

1. Create the clinic's GHL sub-account and a booking calendar.
2. Copy the calendar embed code (Calendars > share > embed).
3. In `index.html`, find the comment `GHL-CALENDAR-SLOT` in the Book section and
   replace the placeholder block with the iframe embed code.
4. GHL will also want its chat widget and tracking script; both can be pasted
   just before `</body>`.

## Publishing

Static single file; works on GitHub Pages as-is:
1. Create a repo (e.g. `wecare-dental`), push `index.html`.
2. Settings > Pages > deploy from branch.
3. Later, point a custom domain (e.g. wecaredentalslrc.com) at Pages, or move
   the whole thing into GHL's own site/funnel builder when her account exists.
