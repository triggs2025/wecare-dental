# WE CARE Dental · Status and pickup notes

Last worked on: August 7, 2026. Safe to resume from any computer.

## WHERE THINGS STAND (Aug 7, 2026)

The site is connected to GoHighLevel end to end. A patient books on the site,
it lands in GHL, and two emails fire: one on booking saying it is not confirmed
yet, one when Karina marks it confirmed. Both workflows are Published.

Read `BACKEND-PLAN.md` for the GHL build and the API recipe, and
`GHL-EMAIL-WORKFLOWS.md` for the email workflows.

### Next session, in priority order

1. **FIX DOUBLE-BOOKING.** The site accepted two overlapping appointments in
   testing. Nine separate service calendars with no team member assigned means
   no calendar knows what the others booked. Details and the questions to ask
   Karina are in BACKEND-PLAN.md under "KNOWN DEFECT". **Blocked on Tony
   inviting Karina as a GHL user**; Claude cannot create accounts.
2. **Verify the merge fields actually render.** Book a test, then mark it
   confirmed. Check that the date shows as a real date and not as literal
   `{{appointment.start_time}}`. Both emails use that token. It renders as a
   chip in the editor, which is good evidence but not proof.
3. **Deliverability.** Emails land in junk because they send from GHL's shared
   domain. Fix is authenticating `wecaredental.com.mx` in GHL, which needs DNS
   records. Blocked on GoDaddy access.
4. **Spanish emails.** Both emails are English only. The plan is an if/else on
   the "Preferred language" contact field, with the site passing the language
   into the booking widget as a URL parameter. Get the English path proven
   first.

### Karina answered on Aug 7, 2026 — all of this is APPLIED

- **Hours (real, now live in GHL and printed on the site):** Mon-Fri 9am-2pm,
  CLOSED 2-4pm for lunch, then 4pm-7pm. Saturday 9am-2pm. Sunday closed. The
  old placeholder was a continuous 9-6, which both allowed bookings during her
  lunch and threw away her 6-7pm hour.
- **Parking:** on the street directly in front of the office. There is no lot.
- **Savings claim:** she confirmed 50-70 percent is accurate and she is
  comfortable with it. No change needed.
- **Bio:** Cirujano Dentista, Universidad Autonoma de Baja California, 14 years
  practising, specialty in ENDODONTICS plus diplomas in dental aesthetics. Her
  own words are on the site now. The Spanish is verbatim from her and the
  English is a translation of it. Do not rewrite it into marketing copy without
  asking her.

Note: hours are now printed on the site AND set in GHL. That is a deliberate
reversal of the earlier "never print hours" rule, because her 2-4pm closure
would otherwise look like a fully booked afternoon. **If her hours change,
update BOTH places.**

### Still waiting on Karina

- **Appointment durations per service.** She sent her service list but not how
  long each takes. Durations in GHL are still my guesses, and guessing is what
  caused the earlier problems.
- **New WhatsApp number**, which she said would arrive within a day or two.
  **WhatsApp is switched off on the site until it arrives** (Aug 8) so nobody
  messages a number that may be wrong. What that means in the files:
  - `index.html`: the "Book by WhatsApp" button and the About "Message on
    WhatsApp" button are `<span class="... is-soon">`, not links, with a
    "Coming soon" / "Próximamente" caption under each (`waSoon` i18n key).
  - `directions.html`: the footer WhatsApp link is plain text with
    "(coming soon)" (`waSoonInline`).
  - The floating green bubble is **commented out** on both pages rather than
    greyed out. A permanent circle that does nothing reads as a broken site.
  - Every spot is marked with a `COMING SOON:` HTML comment saying exactly what
    to undo. Search the repo for `COMING SOON:` to find all five.
  - The `tel:` links still point at +52 653 596 0691 and still work. If that
    number is also changing, it is in `index.html` (twice), `directions.html`
    (footer), and the GHL email copy.
  - Prose still mentions WhatsApp in three places (the contact subheading, the
    "Phone / WhatsApp" label, and directions step 4). Left alone deliberately:
    the channel is coming, it is just not clickable yet.
- Whether appointments may overlap, how many chairs, and whether she has an
  assistant (the double-booking defect, item 1 above)

### Service cards carry their GHL calendar colour (Aug 8, 2026)

Each of the 14 service cards on the home page has a thin stripe across the top
in the same colour as that service's appointment block on Karina's GHL calendar,
plus a faint tint of it on the icon tile. The colour is an inline `--svc` custom
property on each card; the CSS is `.svc-card` and `.svc-card::before`.

**These are a copy of live data, so they can drift.** The values were read back
from the GHL API, not invented. If a calendar's colour is changed in GHL, change
the matching card here. There is a checker that proves the two still agree:
`scripts/check-calendar-colours.js`. Run it after touching either side.

One name differs between the two systems: the site card says "Extractions" and
the GHL calendar is "Extraction". The checker has an alias for it. If more names
drift apart, add them to `ALIAS` there rather than papering over it with fuzzy
matching, so a genuine mismatch still fails loudly.

The icon tint uses `color-mix()`. On a browser too old to support it the whole
declaration is dropped and the original teal tile shows, which is a clean
fallback rather than a broken one.

### Language now auto-detects by country (Aug 8, 2026)

The page used to open in Spanish only if the *browser* was set to Spanish. It
now opens in Spanish for a device physically in Mexico. Order of precedence, in
`initLang()` at the bottom of both `index.html` and `directions.html`:

1. `?lang=es` / `?lang=en` in the URL. Sticks, so it carries to the other page.
   This is also how to test: open `?lang=es` and it forces Spanish.
2. A previous tap on the EN/ES toggle. An explicit choice always wins.
3. **Time zone.** IANA names tell the two sides of this border apart even
   though the clocks match, since both are permanently UTC-7: a phone in San
   Luis Río Colorado reports `America/Hermosillo`, one in San Luis, Arizona
   reports `America/Phoenix`. Chosen over an IP geolocation service on purpose:
   no third-party request, nothing to pay for or rate limit, no consent banner,
   and the answer is synchronous so the page never flashes the wrong language.
4. Browser language. A Spanish-set phone in Arizona still gets Spanish, since
   many patients on the US side are Spanish-dominant.
5. English.

`setLang()` gained a second argument: `setLang(lang, false)` applies a language
without saving it. Auto-detected values are never written to storage, so a
guess never gets frozen in and detection re-runs on the next visit. The toggle
buttons call `setLang(lang)` with no second argument and do save.

The `MX_TZ` regex and `initLang()` are **duplicated in both HTML files** and
must be kept in sync. There is no shared JS file; these pages are single-file
by design.

Caveat worth knowing: a VPN or a wrongly-set device clock changes the answer.
The EN/ES toggle is always right there, so the cost of a wrong guess is one tap.

### Housekeeping owed

Delete or rotate the "Claude setup" private integration in GHL once
configuration is finished. It is a plaintext write-access token at
`C:\Users\trigg\.ghl-wecare-token.txt` and its value appeared on screen during
setup.

## Read this first (two computer workflow)

Tony works on this from two machines. This file is the handoff, so it is kept
current at the end of every session.

1. START of a session: `git pull` before touching anything. OneDrive may lag
   behind GitHub, and GitHub is the source of truth.
2. END of a session: update the Current state, Session log, and Next steps
   sections below, then commit and push. Do not leave work only on one machine.
3. If OneDrive shows a conflicted copy of a file, trust git and delete the
   conflicted copy.

## Admin panel access

There is deliberately NO link to `admin.html` anywhere on the public site.
Staff reach it by typing the URL. `admin.html` carries `<meta name="robots"
content="noindex">` so it stays out of search results.

Aug 7 2026: the demo PIN 1234 was replaced with a staff password Tony chose.
**The password itself is not written down in this repo on purpose** — the repo
is public, so a plaintext password would be readable on github.com and kept in
git history forever. `admin.html` stores only a SHA-256 hash of it. Ask Tony
for the password. If it ever needs changing, compute a new hash with
`node -e "console.log(require('crypto').createHash('sha256').update('NEWPASS').digest('hex'))"`
and replace `GATE_HASH` in `admin.html`.

Hashing does NOT make the gate stronger. The check still runs in the browser
and anyone with devtools bypasses it in seconds. It exists so the password is
not literally published, because people reuse passwords.

Do NOT add a robots.txt rule blocking it: blocking the crawl would stop Google
from ever reading that noindex tag, which is worse than leaving it crawlable.

Be clear-eyed about what this does and does not do. Removing the link stops
casual clicking. It does not secure the page: anyone who guesses the URL can
open it, and the PIN is the demo value 1234. Today the exposure is small
because every appointment and request lives in the visitor's own localStorage,
so a stranger opening admin.html sees an empty panel, not her patients.

DECISION (Tony, Aug 7 2026): leaving the demo PIN 1234 as is for now. Front end
work comes first; auth gets dealt with after. This is a deliberate choice, not
an oversight, so do not keep flagging it during front end work.

THE CONDITION ON THAT: it holds only while there is no backend. The moment
GoHighLevel or any other real store is connected, admin.html is holding real
patient names and phone numbers on a public URL behind a four digit demo PIN.
Real authentication has to land in the same piece of work that connects the
backend, not after it.

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

## START HERE TOMORROW (Aug 8, 2026)

Back end work is underway in GoHighLevel. Read `BACKEND-PLAN.md` first, it has
the decisions, the API recipe and the progress list.

Next task: **build the calendar** in GHL. It is the thing Karina actually works
in. Blocked on two answers from her, which are the critical path now:
1. Her real working hours, per day
2. Her real service list with appointment durations

Everything else in the back end can proceed without her.

Do NOT configure GHL through the browser UI. Its settings pages ignore
synthetic clicks (the custom-field folder dropdown especially). Use the API,
recipe is in BACKEND-PLAN.md.

**Housekeeping owed:** delete or rotate the "Claude setup" private integration
in GHL once configuration is finished. It is a plaintext write-access token
sitting at `C:\Users\trigg\.ghl-wecare-token.txt` and its value was shown on
screen during setup.

## Session log (newest first)

- Aug 7, 2026 (evening): Back end connected end to end. GHL sub-account
  configured: business profile, 10 patient custom fields, 9 service calendars
  with per-service durations and colours, and a calendar group. The site's old
  localStorage form was replaced with the live GHL booking widget, and the
  hardcoded hours were deleted so GHL availability is the single source of
  truth. Two email workflows built and published: acknowledgement on booking,
  confirmation when Karina marks it confirmed. Added a "Book another
  appointment" button that resets the widget without reloading the page.

  Things learned the hard way, all recorded in BACKEND-PLAN.md: GHL's settings
  UI fights browser automation, so use the API; the calendar PUT is a FULL
  REPLACE and partial updates silently reset durations; `openHours` needs one
  entry per day; calendar `notifications` set via API are accepted but never
  stored, which is why workflows are used instead; and a stale builder page
  stops accepting clicks entirely, which a fresh reload fixes.

  Two defects found by real testing: the site accepted overlapping
  appointments, and the first acknowledgement email carried no booking details
  so two of them were indistinguishable. The second is fixed; the first is the
  top item for next session.

- Aug 7, 2026 (evening): Back end started. Decisions locked: GoHighLevel is the
  back end rather than a custom build; notifications go by EMAIL because
  automated WhatsApp is billed per message by Meta no matter who sends it; her
  WhatsApp number stays on the free app as a human line, so the site keeps its
  free wa.me links. Booking form now requires email since email is the
  confirmation channel. Admin gate moved off the demo PIN to a password stored
  as a SHA-256 hash (repo is public, so the plaintext is deliberately not
  written down anywhere; ask Tony). Nav reworked to Services / Directions /
  Contact around what patients actually do. Admin link removed from the footer.
  Domain `wecaredental.com.mx` is registered and owned; GoDaddy access pending,
  so all DNS work is parked.
  Site content editing (hours text, promo popups, open/closed badge) is still
  an open design question: GHL controls bookable slots but cannot drive website
  copy on a static site. Agreed plan is to embed the GHL booking widget and let
  it be the single source of truth for hours, dropping the hardcoded hours
  text, and revisit a content editor only if promos become a real need.

- Aug 7, 2026: ADDRESS RESOLVED and a new `directions.html` page built.
  The old address on the site ("Avenida Alvaro Obregón, Residencias, 83448")
  came from the generic field on her Facebook and was roughly 13 blocks off.
  The real one comes from her own Facebook post of July 28 2021: "ubicados por
  la Avenida Obregón 14 y 15 #1407". Tony also supplied a Google Street View
  link showing the storefront, which puts it at 32.4784807, -114.764544.
  Cross-checked and they agree: OSM has Calle 12 crossing Obregón about 335 m
  northwest of that pin, so 2-3 blocks further southeast is Calle 14/15.
  Fixed everywhere: contact block, map embed (now coordinate-based), and the
  JSON-LD, which also gained `geo` coordinates and `hasMap`.

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

Live camera link sits in the same section, pointing at the City of San Luis
page. Linked, not embedded, on purpose (see Cameras below).

Observed cadence: the cron says every 20 minutes but GitHub throttles scheduled
workflows. Actual observed runs on Aug 7 were 01:50, 02:58, 04:01 UTC, so
roughly hourly. That is fine and not worth fighting, because CBP only refreshes
its own numbers about hourly anyway. Leaving the cron at */20 means it fires as
often as GitHub is willing to allow.

Gotchas:
- GitHub disables scheduled workflows after 60 days with no repo activity. If
  the numbers go stale, check that first.
- The bot commits every run, so ALWAYS `git pull` before working or your push
  will be rejected as non-fast-forward.

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

**Hunt for a MEXICAN-side camera (the northbound queue) — no good option found.**
This is the view that actually matters for a patient leaving the clinic. What
was checked on Aug 7:
- `camarasanluisaz.com` — YouTube-based, so technically embeddable, BUT its own
  heading reads "Para Cruzar a San Luis Rio Colorado", i.e. the SOUTHBOUND line
  into Mexico. Wrong direction. Also 2 of its 3 YouTube stream IDs already
  return 404, and the site is an advertising vehicle for RL Jones Insurance.
  Not reliable enough for her site.
- `bordertraffic.com` / `lalineaenvivo.com` — advertises exactly the right
  views ("San Luis Passenger Standard", "Pedestrian", "Commercial") but the
  page still depends on Adobe Flash (18 SWF references). Flash died in December
  2020, so those feeds do not play in any current browser. Abandoned.
- `garitasreporte.com` — no cameras at all, just CBP wait times, which we
  already pull straight from the source. Adds nothing.
- The City of San Luis cameras we DO link are official and reliable, but the
  city labels them only "Camera1" through "Camera4" with no direction stated,
  and press coverage of their installation described them as facing Main Street,
  the route drivers take INTO Mexico. So they may also be southbound. Could not
  visually confirm: the Verkada iframes need a rendered browser.

OPEN QUESTION for Tony: open https://sanluisaz.gov/BWC and look. If one of the
four shows the northbound line, we can link that specific camera instead of the
whole page. Karina and local patients will also know which camera page people
around there actually use, which is probably the fastest route to a good answer.
Community pages worth asking about: facebook.com/Sanluisborder and
facebook.com/bordercams.

Current site copy says "Four public cameras showing the crossing", which claims
no direction, so it is not wrong today. It should get more specific once the
direction is known.
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
- PARKING. `directions.html` shows a satellite view of the block but makes NO
  parking claims, because nobody has confirmed where patients should actually
  park. Ask Karina, then add it. Do not guess: sending people to the wrong spot
  is worse than saying nothing.
- ~~Which side of Obregón the office is on.~~ RESOLVED Aug 7 2026: it is on the
  LEFT coming from the border. Tony confirmed from local knowledge. An earlier
  inference from the Street View camera heading said "right" and was wrong, so
  do not re-derive this from the pano angle.
- Whether #1407 is still current. Her Facebook post announcing it is from
  July 2021, five years old.
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
