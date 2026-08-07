# Appointment emails · what to finish in GHL

## CURRENT STATE (Aug 7, 2026)

**Workflow 1 is DONE and PUBLISHED.** "Booking received (patient
acknowledgement)". Trigger: Customer booked appointment. One action: sends the
patient an email saying the request is received and NOT yet confirmed. It fires
on real bookings now.

**Workflow 2 is BUILT but NOT PUBLISHED**, so it sends nothing yet.
Id `73e9ca96-f1c4-467c-b011-f67771e57ce5`, still named "New Workflow : ...".
It has the Appointment Status trigger and a "Send Appointment Confirmation
Email" action with the full copy, including the directions link, the border
wait link and the same-timezone note.

### Four things left, all clicks (GHL's builder stopped accepting automated input)

1. **Fix the email body.** Open the "Send Appointment Confirmation Email"
   action. At the bottom, below "WE CARE Dental", there are TWO identical lines
   reading `When: {{appointment.start_time}}`. Delete one of them, and move the
   other up so it sits directly under "Your appointment with WE CARE Dental is
   confirmed." That is where it belongs; it ended up at the bottom because the
   editor kept refusing cursor placement.
2. **Check the trigger.** Open the Appointment Status trigger and confirm the
   second filter reads **Appointment status is "confirmed"**. The card shows it
   truncated as "+ 1 more" so it could not be verified from the outside. If it
   is missing, add filter > Appointment status is > confirmed.
3. **Rename** the workflow to "Appointment confirmed".
4. **Publish**: flip the Draft toggle to Publish, then click Save. A draft
   sends nothing.

### Aug 7 test results and the two remaining edits

Both workflows are Published. Enrolment counts told the story cleanly:
"Booking received" = **2**, confirmation workflow = **0**. So the two identical
emails were both acknowledgements, one per booking (two overlapping test
appointments were made). The confirmation workflow is not broken, it has simply
never been triggered because no appointment has been marked confirmed yet.

**Edit 1 — the acknowledgement email needs the booking details.** It currently
contains no date, time or service, which is why two of them were
indistinguishable. Open workflow "Booking received (patient acknowledgement)"
> "Send Booking Acknowledgement Email", and after the line "Thank you for
requesting an appointment with WE CARE Dental." add:

```
What you requested:
When: {{appointment.start_time}}
```

Add the service too if you can find a suitable field: click the `{}` Custom
values button in the editor toolbar and look under the **Appointment** and
**Calendar** categories. Use the picker rather than typing, since only
`{{contact.name}}` and `{{appointment.start_time}}` have been seen to chip
correctly, and neither has been proven to actually render in a delivered email.

**This next test doubles as the merge-field check.** The acknowledgement fires
on every booking, so the very next test booking will show whether
`{{appointment.start_time}}` renders as a real date or as literal text. If it
comes through literal, replace it using the picker and the same fix applies to
the confirmation email, which uses the same token.

**Edit 2 — rename workflow 2.** It is still called
"New Workflow : 1786116795073". Rename to "Appointment confirmed".

### Deliverability: emails are landing in junk

Expected, and not yet addressed. Mail is going out on GHL's shared sending
domain `send.lcmsgsndr.com`, which has no relationship to this business, so
spam filters treat it with suspicion. The fix is authenticating
`wecaredental.com.mx` as a dedicated sending domain in GHL, which requires
adding DNS records. **Blocked on GoDaddy access.** Until then expect junk.

### Then test

Book a test appointment on the site. You should get the acknowledgement email
immediately. Then mark that appointment confirmed in GHL, and you should get
the second email.

**Watch the `{{appointment.start_time}} `line in that second email.** Typing it
produced a proper merge-field chip, which suggests GHL recognises it, but it has
NOT been verified end to end. If the email arrives showing the literal text
`{{appointment.start_time}}`, the token is wrong: delete that line, then re-add
it using the `{}` Custom values button in the editor toolbar, under the
Appointment category.

---

## Background: why this was built the way it was

## Why the obvious approach failed

Calendars have a `notifications` field. Setting it through the API returns
success and then stores nothing: the list endpoint reports one notification and
the detail endpoint reports zero. It does not fire. **Do not spend more time on
the calendar notification API.** Use a workflow.

## The goal

Two emails, exactly as Tony described:

1. **On booking** — "we have your request, it is not confirmed yet, WE CARE
   Dental will confirm shortly."
2. **On confirmation** — "your appointment is confirmed", with date, time,
   service and address.

## Build it as TWO workflows, not one

A single workflow with both triggers sends both emails to everyone, because GHL
runs the actions in sequence for whichever trigger fired. The AI workflow
builder produced exactly that mistake twice, including after being asked to fix
it. Two separate workflows have no branching and cannot get this wrong.

There is already a half-built workflow called **"Appointment Email
Notifications"** (id `a9ef12c6-293c-406c-8f1c-5f3a889e9d45`). It is in DRAFT and
has never been published, so nothing has gone out to anyone.

### Workflow 1 — rename to "Booking received"

Starting from the existing draft:

- KEEP trigger: **Customer booked appointment** (Patient Books Appointment)
- DELETE trigger: **Appointment status**
- KEEP action: **Send Booking Acknowledgement Email**
- DELETE action: **Send Appointment Confirmation Email**
- DELETE: **Check Appointment Status for Confirmation** and both branches under
  it, so the flow is trigger -> one email -> END
- Publish

### Workflow 2 — new, "Appointment confirmed"

- Trigger: **Appointment status**, with status = `confirmed`
- Action: **Send Email** (the confirmation copy below)
- Publish

## Email copy

Insert merge fields with the `{}` picker in GHL's email editor rather than
typing them by hand: the exact token names vary by GHL version and a wrong one
renders as literal text in a patient's inbox. The fields needed are the
contact's first name, and the appointment's date, time and calendar/service
name.

### 1. Booking received

**Subject (EN):** We received your appointment request · WE CARE Dental
**Subject (ES):** Recibimos tu solicitud de cita · WE CARE Dental

> Hi [first name],
>
> Thank you for requesting an appointment with WE CARE Dental. We have your
> request for [service] on [date] at [time].
>
> **This is not confirmed yet.** Our team will review it and send you a second
> email once your appointment is confirmed. If we need to suggest a different
> time, we will contact you.
>
> If anything changes or you have a question, message us on WhatsApp at
> +52 653 596 0691.
>
> WE CARE Dental
> Avenida Álvaro Obregón 1407, San Luis Río Colorado, Sonora

### 2. Appointment confirmed

**Subject (EN):** Your appointment is confirmed · WE CARE Dental
**Subject (ES):** Tu cita está confirmada · WE CARE Dental

> Hi [first name],
>
> Your appointment is confirmed.
>
> **Service:** [service]
> **Date:** [date]
> **Time:** [time]
> **Where:** Avenida Álvaro Obregón 1407, between Calle 14 and Calle 15,
> San Luis Río Colorado, Sonora
>
> Directions from the border, including what the front of the building looks
> like: https://triggs2025.github.io/wecare-dental/directions.html
>
> Coming from Arizona? Check the border wait before you leave:
> https://triggs2025.github.io/wecare-dental/#border
>
> Sonora keeps the same clock as Arizona all year, so this time is the same on
> both sides of the border.
>
> Need to change it? Message us on WhatsApp at +52 653 596 0691.
>
> WE CARE Dental

## Still open after this

- **Bilingual sending.** The above is English. The contact record has a
  "Preferred language" field, so the eventual answer is an if/else on that field
  with a Spanish version of each email. Get the English path working first.
- **Nobody is notified on the clinic side.** These emails go to the patient. The
  calendars have no assigned team member, so there is currently no staff
  notification at all. That closes when Karina has a user account and is
  assigned to the calendars.
- **Test with a real booking after publishing.** Both workflows are drafts until
  published, and a draft sends nothing.
