# Changes the eventColor of two calendars and nothing else.
#
# General Consultation and Dental Cleaning were 7.1 dE apart, and Dental Post and
# Dental Surgery 10.2 apart. Below about 15 two blocks read as the same colour at
# calendar-block size, and the first pair is Karina's two most common
# appointments, so a week of them looked like one undifferentiated teal wall.
#
# GHL's calendar PUT is a FULL REPLACE, not a merge. A PUT carrying only
# eventColor silently resets slotDuration to the default and collapses openHours.
# So this reads the whole object back, changes one field, and returns all of it,
# then re-reads to prove duration and hours survived.
#
# After running this, update the matching --svc values in index.html and run
# scripts/check-calendar-colours.js.
$tok = (Get-Content "$env:USERPROFILE\.ghl-wecare-token.txt" -Raw).Trim()
$h = @{ Authorization = "Bearer $tok"; Version = "2021-04-15"; Accept = "application/json" }
$loc = "3tIu8i8uehDSpyeXiWtR"

# Server-owned, rejected or ignored on write.
$readOnly = @("id", "locationId")

# Empty arrays are dropped rather than echoed back. These calendars have no team
# members assigned (which is what causes the double-booking defect), and sending
# teamMembers:[] fails validation with "must contain at least 1 elements" -- the
# API will not accept the state it just gave you. Same story for other empty
# collections, so drop them all and let the server keep what it has.

$targets = @(
  @{ name = "Dental Cleaning"; colour = "#00ACC1" },   # was #0E8D8A, too near the consultation teal
  @{ name = "Dental Post";     colour = "#FB8C00" }    # was #795548, too near the surgery brown
)

$cals = (Invoke-RestMethod -Uri "https://services.leadconnectorhq.com/calendars/?locationId=$loc" -Headers $h -Method Get -TimeoutSec 30).calendars

foreach ($t in $targets) {
  $stub = $cals | Where-Object { $_.name -eq $t.name }
  if (-not $stub) { "  {0,-20} NOT FOUND" -f $t.name; continue }

  $url = "https://services.leadconnectorhq.com/calendars/" + $stub.id
  $before = (Invoke-RestMethod -Uri $url -Headers $h -Method Get -TimeoutSec 30).calendar

  $body = @{}
  foreach ($p in $before.PSObject.Properties) {
    if ($readOnly -contains $p.Name) { continue }
    if ($null -eq $p.Value) { continue }
    if (($p.Value -is [System.Array]) -and ($p.Value.Count -eq 0)) { continue }
    $body[$p.Name] = $p.Value
  }
  $body["eventColor"] = $t.colour

  $json = $body | ConvertTo-Json -Depth 12 -Compress
  Invoke-RestMethod -Uri $url -Headers $h -Method Put -ContentType "application/json" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) -TimeoutSec 30 | Out-Null

  Start-Sleep -Milliseconds 400
  $after = (Invoke-RestMethod -Uri $url -Headers $h -Method Get -TimeoutSec 30).calendar

  $colourOk   = $after.eventColor -eq $t.colour
  $durationOk = $after.slotDuration -eq $before.slotDuration
  $hoursOk    = $after.openHours.Count -eq $before.openHours.Count
  $verdict = if ($colourOk -and $durationOk -and $hoursOk) { "OK" } else { "CHECK THIS" }

  "  {0,-18} {1} -> {2}   duration {3}min (was {4})   openHours {5} (was {6})   {7}" -f `
    $t.name, $before.eventColor, $after.eventColor, $after.slotDuration, $before.slotDuration, `
    $after.openHours.Count, $before.openHours.Count, $verdict
}
