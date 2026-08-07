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

- Aug 6, 2026 (later): Built the border wait times feature end to end, see its
  own section below. Also added Open Graph / Twitter card tags and Dentist
  structured data so Facebook and WhatsApp shares render a proper preview
  (og:url and og:image are ABSOLUTE and will need updating if the site moves to
  a custom domain). Deliberately left openingHours out of the structured data
  because the hours are still placeholders and search engines would surface
  them. Booking form no longer dead-ends: it still writes to localStorage for
  the admin demo, but now also opens WhatsApp with the request prefilled to her
  number, so a real patient request actually reaches her. Fixed a temporal dead
  zone bug found during testing that would have killed the entire script.

- Aug 6, 2026: Removed the hero logo badge (the shrunk WE CARE lockup that
  linked to About) and removed the video captions entirely: both `<track>` tags,
  the `.hero-caption` renderer, `syncHeroCaptions()`, and the two .vtt files.
  The hero is now just the video, the scrim, and the text column. The About
  section is untouched and still reachable from the nav.
  Researched CBP border wait times for the next feature, see below.

## Border wait times (BUILT and running as of Aug 6, 2026)

Live on the site between "Why Us" and "Book". Shows the CURRENT reported delay
for cars and pedestrians at San Luis I. No predictions yet, see below.

How it works:
- `.github/workflows/border-wait.yml` runs `scripts/fetch-border.mjs` every ~20
  minutes and on manual dispatch from the Actions tab.
- The script writes `assets/border.json` (what the page reads) and appends a row
  to `data/border-history.csv`.
- `index.html` fetches `assets/border.json` same-origin. The section stays
  hidden if that fetch fails, so a stalled workflow shows nothing rather than
  stale numbers.
- Verified working: run 31136449223 succeeded and committed on its own. The
  repo's default workflow permission is "read", but the explicit
  `permissions: contents: write` in the workflow overrides it. Confirmed, not
  assumed.

There is also a live chip in the header (`#bwtChip`) showing the current car
wait, linking down to the section. It turns red at 60+ minutes and greys out if
the crossing is closed. Hidden until data loads, so it never shows a
placeholder.

Gotcha: GitHub disables scheduled workflows after 60 days with no repo
activity. If the numbers go stale, check that first.

### Cameras and fresher data (researched Aug 6, NOT built)

- **City of San Luis, AZ runs public border wait cameras**: https://sanluisaz.gov/BWC
  Four Verkada cameras embedded as iframes from `vauth.command.verkada.com`.
  Their CSP `frame-ancestors` list ends in `*`, which in modern browsers
  overrides their `X-Frame-Options: SAMEORIGIN`, so they CAN technically be
  embedded on our site.
  **Do not just embed them.** They are the city's cameras on the city's Verkada
  licence, and embedding hotlinks their stream for a commercial dental site.
  Ask the city first, or simply link out to their page. Linking is the safe
  default and costs us nothing.
- **AZ511 (ADOT)** has a camera API at `az511.gov/api/v2/get/cameras` but it
  returns 400 without an API key. Free registration required. Not yet explored.
- Fresher numbers are not really available: CBP itself only refreshes roughly
  hourly, so polling faster than we already do does not make the data newer.
  The cameras are the only genuinely real-time view of the queue.

Predictions are NOT built. CBP publishes only the current delay, so the
`border-history.csv` samples are the only possible basis. It needs weeks of
data before any "Fridays at 4pm are usually bad" claim is honest, and the copy
must say it is our own estimate, not CBP data.

## Original research notes (Aug 6)

Goal: show current San Luis crossing delays on the site, and eventually tie
them to appointment booking so patients can see whether their slot lands in
heavy traffic. Predictions must be clearly labeled as estimates, not fact.

Data source (official, free, no key):
- JSON, all 85 ports: https://bwt.cbp.gov/api/waittimes
- XML equivalent: https://bwt.cbp.gov/xml/bwt.xml
- The `bwt.cbp.gov/details/08260801/...` pages Tony found are the human UI for
  the same data. In the feed the port is `port_number` **260801**, port_name
  "San Luis", crossing_name "San Luis I", open 24 hrs/day. There is also
  260802 "San Luis II" which is commercial only, 9am-5pm, usually Closed.

Per crossing the feed gives, separately for passenger vehicles, pedestrians and
commercial: `delay_minutes`, `lanes_open`, `maximum_lanes`, `operational_status`
and an `update_time`, plus a `construction_notice` free-text field.

TWO BLOCKERS, both confirmed by inspecting live response headers:
1. CBP sends **no** `Access-Control-Allow-Origin` header, so the browser cannot
   fetch this directly from our page. Client-side `fetch()` will fail.
2. CBP sends `X-Frame-Options: SAMEORIGIN`, so we cannot iframe their page
   either.

So it needs a server-side fetch. Two viable designs:
- **On GitHub Pages (works today):** a scheduled GitHub Action fetches the feed
  every ~10 min, writes a small `assets/border.json` into the repo. The page
  reads it same-origin. Free, no server, and every run appends a historical
  sample, which is exactly what the prediction feature will need later.
- **On Plesk (if the site moves there):** a small PHP proxy with a short cache.

Prediction caveat: CBP publishes only the CURRENT delay. There is no historical
or forecast data in the feed. Any "expect about X minutes at 3pm Friday" claim
has to be built from samples we collect ourselves over weeks, and must be
labeled an estimate based on our own observations.

- Aug 5, 2026 (latest+1): Shrank the hero logo lockup to 25% of its old size
  (380px -> 95px wide, 88px on mobile) so it stops covering the video, and made
  it a link to a new About section. The credentials pill inside the SVG is
  hidden at badge size (it would render about 4px tall) and now appears at
  readable size in the About section instead. New `#about` section has a photo
  of her pulled from her own promo video (`assets/karina.jpg`, frame at 16.2s,
  cropped square, 23 KB), her name and role, and a WhatsApp button. Added an
  "About"/"Nosotros" nav link and full EN/ES strings, plus `data-i18n-alt` and
  `data-i18n-aria` support in setLang for the image alt text and the badge's
  aria-label.
  READ THIS: the About body copy deliberately states ONLY what we can verify
  (name, credentials from her signage, location, bilingual). Her actual bio,
  where she trained, years in practice, specialties, why she does this, has
  never been written and must come from her. Do not let anyone (including an
  AI) invent it. There is an HTML comment marking this in index.html.

- Aug 5, 2026 (latest): Hero captions done. The clip turned out to be a music
  bed with a single voiceover line at 18.7-23.0s: "Somos WE CARE, especialistas
  en el cuidado de tu sonrisa." Transcribed with faster-whisper (medium model,
  installed locally via pip) since nobody had written the script down. Wrote
  `assets/hero.es.vtt` and `assets/hero.en.vtt` and enabled the track tags.
  Captions follow the EN/ES toggle and render into .hero-caption below the
  headline. Also made the hero ~10% taller (measured 458px -> 503px at 1280
  wide) by raising its vertical padding, so more of the video shows.
  UNVERIFIED: there is a final low-confidence word around 24.4-25.1s that
  whisper read as "We Care!" on one pass and "¡Suscríbete!" on another. Left it
  out of the captions on purpose. Worth an ear if you care.
- Aug 5, 2026 (later): Added her real clinic promo video as the hero background.
  Source was `Downloads\cf8d9a68-53c9-4c9a-8dd3-718e633dda92.mp4` (4.72 MB,
  1440x1080, 36.8s). Compressed with ffmpeg to `assets/hero.webm` (VP9, 912 KB)
  and `assets/hero.mp4` (H.264, 1.15 MB) plus `assets/hero-poster.jpg`, at
  960x720. Audio dropped (autoplay must be muted), black tail after 34.6s
  trimmed so the loop does not flash black. Video sits at opacity .8 (the
  requested 20% transparency) under a white scrim that keeps the headline
  readable. Caption machinery is built but the .vtt files are NOT written yet,
  see Next steps.
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

- Her actual bio for the About section (training, years practicing, specialties,
  what she wants patients to know). Nothing has been written; the section
  currently carries only verifiable facts. Needs her own words.
- Whether she is OK with the About photo and the hero video, both of which were
  pulled from her promo clip. Also whether the patients visible in that footage
  consented to it being reused on a website.
- Business hours (site shows Mon-Fri 9-6, Sat 9-2)
- Exact street address beyond "Avenida Alvaro Obregon, Residencias, 83448"
- Services list and pricing claims (50-70% savings line)
- Spelling/format of credentials: the clinic signage visible in her promo video
  reads "C. D. E. E Karina González Robles". The site currently renders
  "C.D. E.E. Karina González Robles". Same name, slightly different punctuation.
  Confirm which form she wants before going live.

## Next steps (planned, not started)

1. Hero video captions (EN + ES). Blocked on a transcript of the clip's audio:
   nobody has written down what is said. The switching logic is already done in
   `syncHeroCaptions()` and the `<track>` tags are commented out in index.html
   waiting on `assets/hero.en.vtt` and `assets/hero.es.vtt`. Options: run
   whisper locally (not installed yet), or Tony writes out the script.
2. Custom domain. Decision pending between GitHub Pages with a CNAME file, or
   hosting on the Plesk server using Plesk's Git deploy-on-push integration.
   Leaning Plesk. Domain name not registered yet as of this writing.
3. Reveal to her, get feedback on design and logo
2. Set up GoHighLevel: booking calendar embed (slot is marked GHL-CALENDAR-SLOT in index.html), CRM, chat widget, automated reminders
3. Real analytics tracking (GHL or Google Analytics)
4. Custom domain, or move into GHL's site builder
5. High-res logo exports (PNG) for social avatars and print
