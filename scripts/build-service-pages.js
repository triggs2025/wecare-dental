// Generates one page per service under services/, plus sitemap.xml.
//
//   node scripts/build-service-pages.js
//
// WHY GENERATED RATHER THAN HAND-WRITTEN
// Sixteen hand-maintained pages drift. Every shared part comes from a file that
// already owns it:
//
//   slugs, colours, display order       index.html Services cards
//   service names, short descriptions   index.html i18n blocks
//   calendar ids and durations          index.html picker buttons
//   header, footer, nav, base CSS       directions.html
//   the long educational copy           content/service-pages.js
//
// So a change to a service name, colour or duration reaches every page by
// re-running this. The only file that exists solely for these pages is the
// content one. Editing services/*.html by hand is pointless: the next build
// overwrites it.
//
// Not every service is bookable online. Deep Cleaning and Orthodontics are
// carried out by specialists who visit Karina's office, so they get a card and
// a page but no calendar, and their call to action is a consultation.
//
// SEO is the point of separate pages rather than one page with anchors: each
// gets its own title, meta description, canonical, H1 and MedicalProcedure
// markup. Only the English is in the static HTML, same as the rest of the site,
// because Spanish is applied by JS. If Spanish search traffic ever matters,
// that needs its own generated /es/ pages, not a toggle.
const fs = require('fs'), path = require('path');

const repo = path.resolve(__dirname, '..');
const SITE = 'https://triggs2025.github.io/wecare-dental';
const OUT = path.join(repo, 'services');

const content = require(path.join(repo, 'content', 'service-pages.js'));
const index = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const directions = fs.readFileSync(path.join(repo, 'directions.html'), 'utf8');

const die = m => { console.error('build failed: ' + m); process.exit(1); };

// ---- shared bits, pulled from the pages that already own them ----------------
const styleMatch = directions.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) die('no <style> block in directions.html');
const BASE_CSS = styleMatch[1];

const i18nBody = index.slice(index.indexOf('const I18N'));
const esAt = i18nBody.search(/\n\s*es\s*:\s*\{/);
if (esAt < 0) die('could not find the es dictionary in index.html');
const EN_DICT = i18nBody.slice(0, esAt), ES_DICT = i18nBody.slice(esAt);
const key = (dict, k) => {
  const m = dict.match(new RegExp(k + ':"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1] : null;
};

// The Services cards are the master list: every service gets a page, including
// the ones that are not bookable online. Attributes are read individually
// rather than in a fixed order, so adding one does not silently match nothing.
const attrs = s => n => (s.match(new RegExp(n + '="([^"]+)"')) || [])[1];
const cards = [...index.matchAll(/<a class="card svc-card"([^>]*)>[\s\S]*?data-i18n="svc(\d+)t"/g)]
  .map(([, a, n]) => ({
    slug: (attrs(a)('href') || '').replace('services/', '').replace('.html', ''),
    colour: (attrs(a)('style') || '').replace('--svc:', ''),
    n: Number(n),
  }));
if (cards.length !== content.length) {
  die('index.html has ' + cards.length + ' service cards but content/service-pages.js has ' + content.length);
}

// Booking details, for the services that can be booked online. Deep Cleaning
// and Orthodontics have none: Karina's periodontist and orthodontist visit her
// office, so those appointments depend on coordinating a specialist and are not
// something a stranger should be able to drop into a fixed slot.
const picks = new Map([...index.matchAll(
  /<button type="button" class="pick"([^>]*)>[\s\S]*?<span class="pick-meta">([^<]+)<\/span>/g)]
  .map(([, a, duration]) => [attrs(a)('data-slug'), { cal: attrs(a)('data-cal'), duration }]));

const services = cards.map((card, i) => {
  const c = content[i];
  if (c.slug !== card.slug) {
    die('order mismatch at position ' + (i + 1) + ': card is "' + card.slug +
        '" but content/service-pages.js has "' + c.slug + '"');
  }
  const n = card.n;
  const en = { name: key(EN_DICT, 'svc' + n + 't'), short: key(EN_DICT, 'svc' + n + 'd') };
  const es = { name: key(ES_DICT, 'svc' + n + 't'), short: key(ES_DICT, 'svc' + n + 'd') };
  if (!en.name || !es.name) die('missing i18n for svc' + n);
  const booking = picks.get(card.slug) || null;
  return {
    ...c, colour: card.colour, n,
    cal: booking && booking.cal,
    duration: booking && booking.duration,
    bookable: Boolean(booking),
    en: { ...c.en, ...en }, es: { ...c.es, ...es },
  };
});

// A slug should look like the English name. Not enforced, but a mismatch almost
// always means content/service-pages.js has drifted out of order.
services.forEach(s => {
  const expect = s.en.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (s.slug !== expect) {
    console.log('  note: slug "' + s.slug + '" does not match name "' + s.en.name + '" (expected "' + expect + '")');
  }
});

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsStr = s => JSON.stringify(s);

// ---- page-specific CSS, appended to the shared base --------------------------
const PAGE_CSS = `
  /* ---------- Service page ---------- */
  .svc-hero{border-top:6px solid var(--svc);background:var(--card);padding:2.5rem 1.25rem 2rem}
  .svc-hero .wrap{max-width:820px;margin:0 auto}
  .back-link{display:inline-flex;align-items:center;gap:.4rem;font-weight:800;font-size:.88rem;text-decoration:none;margin-bottom:1rem}
  .back-link:hover{text-decoration:underline}
  .svc-hero h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.2rem 0 .6rem}
  .svc-lead{font-size:1.1rem;color:var(--gray);max-width:60ch}
  .svc-facts{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.4rem}
  .svc-fact{display:inline-flex;align-items:center;gap:.45rem;background:#fff;border:1px solid #e4efef;
    border-radius:999px;padding:.45rem .9rem;font-size:.85rem;font-weight:700}
  .svc-fact b{font-weight:900}
  .svc-body{max-width:820px;margin:0 auto;padding:2.25rem 1.25rem .5rem}
  /* The base stylesheet sets section{padding:3rem 0} for the full-width bands on
     the other pages. These sections are inside a wrapper, so that padding stacks
     on top of the margin and leaves a chasm between each heading. Reset it. */
  .svc-body section{padding:0;margin-bottom:1.9rem}
  .svc-body h2{font-size:1.25rem;margin-bottom:.6rem;display:flex;align-items:center;gap:.55rem}
  .svc-body h2::before{content:"";width:14px;height:14px;border-radius:4px;background:var(--svc);flex-shrink:0}
  .svc-body p{color:var(--ink);max-width:65ch}
  .svc-list{list-style:none;display:grid;gap:.5rem;max-width:65ch}
  .svc-list li{position:relative;padding-left:1.6rem;color:var(--ink)}
  .svc-list li::before{content:"";position:absolute;left:0;top:.55em;width:7px;height:7px;border-radius:50%;background:var(--svc)}
  .svc-steps{list-style:none;counter-reset:s;display:grid;gap:.65rem;max-width:65ch}
  .svc-steps li{position:relative;padding-left:2.2rem;counter-increment:s}
  .svc-steps li::before{content:counter(s);position:absolute;left:0;top:-.1em;width:1.6rem;height:1.6rem;
    border-radius:50%;background:var(--svc);color:#fff;font-weight:900;font-size:.8rem;
    display:flex;align-items:center;justify-content:center}
  .svc-cta{max-width:820px;margin:0 auto 2.25rem;padding:1.75rem 1.25rem;text-align:center;
    background:var(--card);border:2px dashed #bfdedd;border-radius:var(--radius)}
  .svc-cta h2{font-size:1.25rem;margin-bottom:.4rem}
  .svc-cta p{color:var(--gray);margin-bottom:1.1rem}
  .svc-cta-actions{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}
  .disclaimer{max-width:70ch;margin:0 auto 1.75rem;padding:0 1.25rem;font-size:.82rem;color:var(--gray)}
  .related{background:var(--card);padding:2.25rem 1.25rem}
  .related .wrap{max-width:820px;margin:0 auto}
  .related h2{font-size:1.15rem;margin-bottom:1rem}
  .related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem}
  .related-card{display:flex;align-items:center;gap:.6rem;background:#fff;border:1px solid #e4efef;
    border-left:5px solid var(--rel);border-radius:10px;padding:.7rem .85rem;text-decoration:none;
    color:var(--ink);font-weight:800;font-size:.88rem;transition:transform .12s ease,box-shadow .12s ease}
  .related-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
  .related-all{display:inline-block;margin-top:1.1rem;font-weight:800}
`;

// ---- the template ------------------------------------------------------------
function page(s, all) {
  // Three neighbours in the running order, wrapping around, so every page links
  // onward and no page is an SEO dead end.
  const i = all.indexOf(s);
  const related = [1, 2, 3].map(k => all[(i + k) % all.length]);

  const sessions = s.bookable && /^2 x/.test(s.duration);
  const perSession = s.bookable ? s.duration.replace(/^2 x /, '') : null;

  // Only the consultation has a published price, and it is the one Karina gave.
  const price = s.slug === 'general-consultation' ? '$50 USD' : null;

  // Services handled by a visiting specialist start with a consultation rather
  // than a self-booked slot, so their call to action goes there instead.
  const bookHref = s.bookable
    ? '../index.html?service=' + s.slug + '#book'
    : '../index.html?service=general-consultation#book';

  const dict = lang => {
    const d = s[lang];
    const o = {
      svcName: d.name, svcLead: d.lead, svcWhat: d.what, svcAfter: d.after,
      hWhat: lang === 'en' ? 'What it is' : 'Qué es',
      hWhen: lang === 'en' ? 'When you might need it' : 'Cuándo puede que lo necesites',
      hVisit: lang === 'en' ? 'What the appointment involves' : 'Qué incluye la cita',
      hAfter: lang === 'en' ? 'Afterwards' : 'Después',
      backAll: lang === 'en' ? 'All services' : 'Todos los servicios',
      relTitle: lang === 'en' ? 'Other services' : 'Otros servicios',
      relAll: lang === 'en' ? 'See all services' : 'Ver todos los servicios',
      ctaTitle: lang === 'en' ? 'Ready to book?' : '¿Lista o listo para agendar?',
      ctaSub: s.bookable
        ? (lang === 'en'
            ? 'Pick a time that suits you. We confirm every appointment personally.'
            : 'Elige el horario que te acomode. Confirmamos cada cita personalmente.')
        : (lang === 'en'
            ? 'This treatment is carried out by a visiting specialist, so it starts with a consultation. Book that and we will arrange the rest with you.'
            : 'Este tratamiento lo realiza un especialista que acude al consultorio, así que empieza con una consulta. Agenda la consulta y coordinamos lo demás contigo.'),
      ctaBook: s.bookable
        ? (lang === 'en' ? 'Book this service' : 'Agendar este servicio')
        : (lang === 'en' ? 'Book a consultation' : 'Agendar una consulta'),
      factSpecialist: lang === 'en' ? 'With a visiting specialist' : 'Con especialista visitante',
      ctaDirections: lang === 'en' ? 'Directions from the border' : 'Cómo llegar desde la garita',
      factTime: lang === 'en' ? 'Appointment' : 'Cita',
      factVisits: lang === 'en' ? 'Two visits' : 'Dos citas',
      factPrice: lang === 'en' ? 'Consultation' : 'Consulta',
      disclaimer: lang === 'en'
        ? 'This page explains the procedure in general terms so you know what you are looking at. It is not a diagnosis and not a treatment plan. What is right for you depends on your own teeth, and that needs an examination.'
        : 'Esta página explica el procedimiento en términos generales para que sepas de qué se trata. No es un diagnóstico ni un plan de tratamiento. Lo que te conviene depende de tus propios dientes, y eso requiere una revisión.',
      navServices: lang === 'en' ? 'Services' : 'Servicios',
      navDirections: lang === 'en' ? 'Directions' : 'Cómo llegar',
      navContact: lang === 'en' ? 'Contact' : 'Contacto',
      navCta: lang === 'en' ? 'Book Appointment' : 'Agendar Cita',
      brandTag: 'San Luis Río Colorado',
      bwtChipLabel: lang === 'en' ? 'Border' : 'Frontera',
      bwtChipClosed: lang === 'en' ? 'Closed' : 'Cerrado',
      bwtMin: 'min',
      bwtNoDelay: lang === 'en' ? 'No delay' : 'Sin demora',
      bwtChipAria: lang === 'en'
        ? 'Current border wait to cross into Arizona:'
        : 'Espera actual para cruzar a Arizona:',
      footHome: lang === 'en' ? 'Home' : 'Inicio',
      waSoonInline: lang === 'en' ? '(coming soon)' : '(próximamente)',
    };
    d.when.forEach((t, k) => { o['when' + k] = t; });
    d.visit.forEach((t, k) => { o['visit' + k] = t; });
    related.forEach((r, k) => { o['rel' + k] = r[lang].name; });
    return o;
  };

  const en = dict('en'), es = dict('es');

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: s.en.name,
    description: s.en.what,
    bodyLocation: 'Mouth',
    procedureType: 'https://schema.org/TherapeuticProcedure',
    performer: {
      '@type': 'Dentist',
      name: 'WE CARE Dental',
      url: SITE + '/',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Avenida Álvaro Obregón 1407',
        addressLocality: 'San Luis Río Colorado',
        addressRegion: 'Sonora',
        addressCountry: 'MX',
      },
      telephone: '+52-653-596-0691',
    },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: SITE + '/#services' },
      { '@type': 'ListItem', position: 3, name: s.en.name, item: SITE + '/services/' + s.slug + '.html' },
    ],
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(s.en.title)} · WE CARE Dental · San Luis Río Colorado</title>
<meta name="description" content="${esc(s.en.desc)}">
<link rel="canonical" href="${SITE}/services/${s.slug}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(s.en.title)} · WE CARE Dental">
<meta property="og:description" content="${esc(s.en.desc)}">
<meta property="og:url" content="${SITE}/services/${s.slug}.html">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="es_MX">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>
<style>
:root{--svc:${s.colour}}
${BASE_CSS}${PAGE_CSS}
</style>
</head>
<body>

<header>
  <div class="nav">
    <a class="brand" href="../index.html">
      <span>
        <span class="brand-name">WE <span>CARE</span> Dental</span>
        <span class="brand-tag" data-i18n="brandTag">San Luis Río Colorado</span>
      </span>
    </a>
    <nav class="links" id="navLinks">
      <a href="../index.html#services" class="current" aria-current="page" data-i18n="navServices">Services</a>
      <a href="../directions.html" data-i18n="navDirections">Directions</a>
      <a href="../index.html#contact" data-i18n="navContact">Contact</a>
      <a class="cta-btn" href="${bookHref}" data-i18n="navCta">Book Appointment</a>
    </nav>
    <div style="display:flex;align-items:center;gap:.8rem">
      <a class="bwt-chip" id="bwtChip" href="../index.html#border" hidden>
        <span class="bwt-chip-ico" aria-hidden="true">🚗</span>
        <span class="bwt-chip-label" data-i18n="bwtChipLabel">Border</span>
        <span class="bwt-chip-time" id="bwtChipTime"></span>
      </a>
      <div class="lang-toggle" role="group" aria-label="Language">
        <button id="btnEn" onclick="setLang('en')">EN</button>
        <button id="btnEs" onclick="setLang('es')">ES</button>
      </div>
      <button class="menu-btn" onclick="document.getElementById('navLinks').classList.toggle('open')" aria-label="Menu">☰</button>
    </div>
  </div>
</header>

<main>

  <div class="svc-hero">
    <div class="wrap">
      <a class="back-link" href="../index.html#services">&larr; <span data-i18n="backAll">All services</span></a>
      <h1 data-i18n="svcName">${esc(s.en.name)}</h1>
      <p class="svc-lead" data-i18n="svcLead">${esc(s.en.lead)}</p>
      <div class="svc-facts">
        ${s.bookable ? `<span class="svc-fact"><span data-i18n="factTime">Appointment</span> <b>${esc(perSession)}</b></span>` : ''}
        ${sessions ? '<span class="svc-fact"><b data-i18n="factVisits">Two visits</b></span>' : ''}
        ${!s.bookable ? '<span class="svc-fact"><b data-i18n="factSpecialist">With a visiting specialist</b></span>' : ''}
        ${price ? `<span class="svc-fact"><span data-i18n="factPrice">Consultation</span> <b>${price}</b></span>` : ''}
      </div>
    </div>
  </div>

  <div class="svc-body">
    <section>
      <h2 data-i18n="hWhat">What it is</h2>
      <p data-i18n="svcWhat">${esc(s.en.what)}</p>
    </section>
    <section>
      <h2 data-i18n="hWhen">When you might need it</h2>
      <ul class="svc-list">
${s.en.when.map((t, k) => `        <li data-i18n="when${k}">${esc(t)}</li>`).join('\n')}
      </ul>
    </section>
    <section>
      <h2 data-i18n="hVisit">What the appointment involves</h2>
      <ol class="svc-steps">
${s.en.visit.map((t, k) => `        <li data-i18n="visit${k}">${esc(t)}</li>`).join('\n')}
      </ol>
    </section>
    <section>
      <h2 data-i18n="hAfter">Afterwards</h2>
      <p data-i18n="svcAfter">${esc(s.en.after)}</p>
    </section>
  </div>

  <p class="disclaimer" data-i18n="disclaimer">${esc(en.disclaimer)}</p>

  <div class="svc-cta">
    <h2 data-i18n="ctaTitle">Ready to book?</h2>
    <p data-i18n="ctaSub">${esc(en.ctaSub)}</p>
    <div class="svc-cta-actions">
      <a class="btn-primary" href="${bookHref}" data-i18n="ctaBook">Book this service</a>
      <a class="btn-ghost" href="../directions.html" data-i18n="ctaDirections">Directions from the border</a>
    </div>
  </div>

  <section class="related">
    <div class="wrap">
      <h2 data-i18n="relTitle">Other services</h2>
      <div class="related-grid">
${related.map((r, k) => `        <a class="related-card" style="--rel:${r.colour}" href="${r.slug}.html" data-i18n="rel${k}">${esc(r.en.name)}</a>`).join('\n')}
      </div>
      <a class="related-all" href="../index.html#services" data-i18n="relAll">See all services</a>
    </div>
  </section>

</main>

<footer>
  <p><strong>WE CARE Dental</strong> · Avenida Álvaro Obregón 1407, San Luis Río Colorado, Sonora</p>
  <p style="margin-top:.4rem">
    <a href="tel:+526535960691">+52 653 596 0691</a> ·
    <span style="opacity:.6">WhatsApp <span data-i18n="waSoonInline">(coming soon)</span></span> ·
    <a href="../index.html" data-i18n="footHome">Home</a>
  </p>
  <p style="margin-top:.8rem;font-size:.8rem;opacity:.75">&copy; <span id="year"></span> WE CARE Dental</p>
</footer>

<script>
// GENERATED FILE. Edit scripts/build-service-pages.js or
// content/service-pages.js and re-run the build; changes here are overwritten.
let BORDER = null;

const I18N = { en:${jsStr(en)}, es:${jsStr(es)} };

function setLang(lang, persist){
  document.documentElement.lang = lang;
  if(persist !== false) localStorage.setItem('wecare-lang', lang);
  document.getElementById('btnEn').classList.toggle('active', lang==='en');
  document.getElementById('btnEs').classList.toggle('active', lang==='es');
  const dict = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    if(dict[k]) el.textContent = dict[k];
  });
  document.title = dict.svcName + ' · WE CARE Dental · San Luis Río Colorado';
  if(BORDER) renderChip();
}

function renderChip(){
  const dict = I18N[document.documentElement.lang] || I18N.en;
  const chip = document.getElementById('bwtChip');
  const time = document.getElementById('bwtChipTime');
  const shut = (BORDER.port && /closed/i.test(BORDER.port.status || '')) || !BORDER.vehicle;
  chip.classList.remove('is-heavy','is-closed');
  if(shut){
    time.textContent = dict.bwtChipClosed;
    chip.classList.add('is-closed');
  } else {
    const mins = BORDER.vehicle.delayMinutes;
    time.textContent = mins > 0 ? mins + ' ' + dict.bwtMin : dict.bwtNoDelay;
    if(mins >= 60) chip.classList.add('is-heavy');
  }
  chip.setAttribute('aria-label', dict.bwtChipAria + ' ' + time.textContent);
  chip.hidden = false;
}

// Same order and storage key as the rest of the site, so the language a visitor
// chose on the home page carries here. See NOTES.md for why time zone.
const MX_TZ = /^(America\\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Hermosillo|Mazatlan|Bahia_Banderas|Tijuana|Ensenada|Santa_Isabel)|Mexico\\/)/;
function initLang(){
  const q = new URLSearchParams(location.search).get('lang');
  if(q === 'es' || q === 'en'){ setLang(q); return; }
  const saved = localStorage.getItem('wecare-lang');
  if(saved === 'es' || saved === 'en'){ setLang(saved, false); return; }
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e){}
  const es = MX_TZ.test(tz) || (navigator.language || 'en').toLowerCase().startsWith('es');
  setLang(es ? 'es' : 'en', false);
}
initLang();

fetch('../assets/border.json', { cache: 'no-cache' })
  .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
  .then(data => { BORDER = data; renderChip(); })
  .catch(err => { console.warn('border wait times unavailable:', err.message); });

document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>{
  document.getElementById('navLinks').classList.remove('open');
}));
</script>
</body>
</html>
`;
}

// ---- write -------------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
services.forEach(s => {
  fs.writeFileSync(path.join(OUT, s.slug + '.html'), page(s, services));
  console.log('  ' + (s.slug + '.html').padEnd(34) + s.colour + '  ' + s.duration);
});

const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: SITE + '/', pri: '1.0' },
  { loc: SITE + '/directions.html', pri: '0.8' },
  ...services.map(s => ({ loc: SITE + '/services/' + s.slug + '.html', pri: '0.7' })),
];
fs.writeFileSync(path.join(repo, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => '  <url><loc>' + u.loc + '</loc><lastmod>' + today +
    '</lastmod><priority>' + u.pri + '</priority></url>').join('\n') +
  '\n</urlset>\n');

// admin.html is noindex already, but keeping crawlers away from it costs nothing.
fs.writeFileSync(path.join(repo, 'robots.txt'),
  'User-agent: *\nAllow: /\nDisallow: /admin.html\n\nSitemap: ' + SITE + '/sitemap.xml\n');

console.log('\n' + services.length + ' pages, sitemap.xml (' + urls.length + ' urls), robots.txt');
