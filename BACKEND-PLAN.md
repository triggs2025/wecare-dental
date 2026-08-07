# WE CARE Dental · Back end plan

Decided Aug 7, 2026. Read alongside `NOTES.md`.

## Decisions already made

1. **GoHighLevel is the back end.** Not a custom build. GHL already does the
   calendar, roles, invoices, payments, services and hours natively, and
   rebuilding that would produce something worse for weeks of work.
2. **Notifications go by email, not WhatsApp.** Automated WhatsApp costs money
   per message no matter who sends it (see Costs below). Email through GHL is
   effectively free at her volume.
3. **Her WhatsApp number stays exactly as it is.** +52 653 596 0691 remains on
   the free WhatsApp Business app on her phone. Patients call and message her
   there like any human. The site keeps its `wa.me` links, which cost nothing
   because a person presses send.

That third point is the important one, and it only holds while we do NOT
automate WhatsApp. A phone number can live on the free app or on Meta's API,
never both. The day we want automated WhatsApp confirmations, that number has
to migrate and she loses the normal app on it. Deliberately avoided for now.

## Costs, honestly

- **GHL sub-account** — covered by Tony's existing agency plan.
- **Email** — GHL's LC Email is billed per send at a fraction of a cent.
  At a single clinic's volume this rounds to nothing, but it is not literally
  zero.
- **WhatsApp, if we ever automate it** — GHL's WhatsApp is LeadConnector built
  on Meta's Cloud API, so there are up to three layers: Meta's per-message
  charge, GHL's LC credit markup, and possibly a per-sub-account add-on fee.
  GHL does not make WhatsApp free; it resells it.
- **Payments** — Stripe's normal percentage per transaction.
- Meta moved to per-message pricing on July 1 2025. Service replies inside the
  24 hour window are free today but that ENDS October 1 2026, so any future
  WhatsApp budget should assume everything is billable.

## Patient information to capture

GHL native fields cover the basics. Everything marked CUSTOM needs creating
under Settings > Custom Fields in the sub-account.

**Identity and contact**
- First name, last name, phone, email, full address — all native
- Date of birth — CUSTOM. Needed for records and for flagging minors
- Preferred language EN/ES — CUSTOM. The site already knows this; it is stored
  on every booking request

**Cross-border, which is the unusual part of this practice**
- Country of residence — CUSTOM
- Crossing card type: none / Ready Lane / SENTRI — CUSTOM. SENTRI holders wait
  far less, so this genuinely changes what appointment time suits them
- Preferred time of day — CUSTOM. Pairs with the border wait data on the site

**Clinical intake**
- Reason for visit — CUSTOM
- Emergency contact name and phone — CUSTOM
- Medical alerts and allergies — CUSTOM, **but read the sensitive data section
  below before turning this on**

**Money**
- Payment preference: cash / card / transfer — CUSTOM. **Preference only. Never
  a card number, see below**
- Needs a factura (CFDI)? plus RFC — CUSTOM. Mexican patients who want to
  deduct treatment will ask, and Stripe and GHL invoices are receipts, not
  CFDIs. Real facturas need a Mexican provider such as Facturama
- Estimated treatment value — GHL Opportunities handles this

**Admin**
- How they heard about us — CUSTOM
- Privacy notice accepted, with date — CUSTOM, legally relevant, see below
- Marketing opt in, separate from the above — CUSTOM
- Tags: new / returning, US patient / MX patient

## Two hard rules

**Never store card numbers.** Not in a GHL field, not in a note, not anywhere.
Card data belongs only inside Stripe, which returns a token. "Payment
preference" is a dropdown saying how they like to pay. The moment someone types
a card number into a CRM field, this becomes a PCI problem and a liability for
her practice.

**Health data is not the same as contact data.** Name, phone, email and address
are ordinary personal data. Medical history, allergies, treatment notes and
x-rays are *sensitive* personal data. Under Mexico's LFPDPPP that requires an
explicit privacy notice (aviso de privacidad) and express consent, and it is
not something to switch on casually. Two things to settle before any clinical
field is populated:

1. She needs a written aviso de privacidad, and the site needs to link it.
2. GHL is **not** HIPAA compliant by default. They sell it as a paid add-on
   with a BAA. She is a Mexican clinic so HIPAA does not automatically apply to
   her, but she treats American patients, so this deserves a real answer rather
   than an assumption.

Recommendation: launch with contact and scheduling data only. Keep clinical
records wherever she keeps them today until the privacy notice exists and the
HIPAA question has an answer.

## Build order

1. Tony creates the sub-account. **Claude cannot do this**; creating accounts is
   off limits.
2. Business profile: name, address (Av. Álvaro Obregón 1407), phone, timezone
   America/Hermosillo. Note Sonora does NOT observe daylight saving, so it is
   permanently UTC-7 and diverges from Arizona for part of the year. Get this
   wrong and every appointment time is off by an hour for half the year.
3. Calendar: services as separate calendars or appointment types, real
   durations, real working hours, buffer time.
4. Custom fields from the list above.
5. Users and roles: Karina as Admin, front desk as User with restricted
   permissions.
6. Email templates: booking received, appointment confirmed, reminder,
   cancelled. Bilingual, keyed off the language field.
7. Payments: connect Stripe, enable invoices and payment links.
8. Swap the site's form for the GHL booking widget at the `GHL-CALENDAR-SLOT`
   marker in `index.html`, or keep the form and push to GHL via webhook.
9. Retire or repoint `admin.html`. Once GHL holds real data, the demo PIN 1234
   is no longer acceptable, see NOTES.md.

## Open questions for Karina

- Real working hours, per day
- Real service list and appointment durations
- Does she want the front desk role at all, and who fills it
- Do her patients ask for facturas
- Where does she keep clinical records today
