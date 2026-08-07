# Appointment emails · what to finish in GHL

Status as of Aug 7, 2026: **not working yet.** No confirmation email is sent
when a patient books. This document is the fix.

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
