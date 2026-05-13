# EventHub end-to-end smoke test
# Exercises every API endpoint plus key security edge cases.
# Pass/fail summary at the end.

$ErrorActionPreference = 'Continue'
$base = 'http://localhost:5000/api'
$rand = Get-Random -Maximum 999999

$pass = 0
$fail = 0
$failed = @()

function Test($name, $block) {
    try {
        & $block
        Write-Host "  [PASS] $name" -ForegroundColor Green
        $script:pass++
    } catch {
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        Write-Host "         $($_.Exception.Message)" -ForegroundColor DarkRed
        $script:fail++
        $script:failed += $name
    }
}

function Expect($actual, $expected, $msg) {
    if ($actual -ne $expected) {
        throw "$msg : expected '$expected' got '$actual'"
    }
}

function ExpectStatus($block, $expectedStatus) {
    try {
        & $block | Out-Null
        throw "Expected HTTP $expectedStatus but request succeeded"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -ne $expectedStatus) {
            throw "Expected HTTP $expectedStatus but got $code"
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EventHub API smoke test suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

#region Setup
Write-Host "## Setup" -ForegroundColor Yellow

$orgEmail = "smoke-org-$rand@gmail.com"
$usrEmail = "smoke-usr-$rand@gmail.com"
$orgToken = $null
$usrToken = $null
$eventId  = $null
$regId    = $null
$ticketCode = $null

Test "Register organizer" {
    $body = @{ name='Smoke Org'; email=$orgEmail; password='Pass1234'; role='organizer' } | ConvertTo-Json
    $r = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body
    Expect $r.user.role 'organizer' "role"
    $script:orgToken = $r.token
}

Test "Register normal user" {
    $body = @{ name='Smoke User'; email=$usrEmail; password='Pass1234' } | ConvertTo-Json
    $r = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body
    Expect $r.user.role 'user' "default role"
    $script:usrToken = $r.token
}
#endregion

#region Auth tests
Write-Host ""
Write-Host "## Auth" -ForegroundColor Yellow

Test "Login with correct password" {
    $body = @{ email=$orgEmail; password='Pass1234' } | ConvertTo-Json
    $r = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
    if (-not $r.token) { throw "no token returned" }
}

Test "Login fails with wrong password (401)" {
    ExpectStatus { 
        $body = @{ email=$orgEmail; password='WRONG' } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body 
    } 401
}

Test "Login fails for nonexistent user (401)" {
    ExpectStatus { 
        $body = @{ email='nobody@gmail.com'; password='Pass1234' } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body 
    } 401
}

Test "Login fails without email (400)" {
    ExpectStatus { 
        $body = @{ password='Pass1234' } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body 
    } 400
}

Test "Register fails with weak password (400)" {
    ExpectStatus { 
        $body = @{ name='X'; email="weak-$rand@gmail.com"; password='123' } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body 
    } 400
}

Test "Register fails with duplicate email (409)" {
    ExpectStatus { 
        $body = @{ name='Dup'; email=$orgEmail; password='Pass1234' } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body 
    } 409
}

Test "Role escalation blocked (admin role rejected with 400)" {
    ExpectStatus { 
        $email = "evil-$rand@gmail.com"
        $body = @{ name='Evil'; email=$email; password='Pass1234'; role='admin' } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body 
    } 400
}

Test "GET /me requires token (401)" {
    ExpectStatus { Invoke-RestMethod "$base/auth/me" } 401
}

Test "GET /me works with valid token" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $r = Invoke-RestMethod "$base/auth/me" -Headers $h
    Expect $r.user.email $orgEmail "email matches"
}

Test "Invalid JWT rejected (401)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer not.a.real.jwt" }
        Invoke-RestMethod "$base/auth/me" -Headers $h 
    } 401
}
#endregion

#region Events
Write-Host ""
Write-Host "## Events" -ForegroundColor Yellow

Test "Create event (organizer)" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $body = @{ 
        title='Smoke Event'
        description='A smoke test event with enough description text to pass validation rules'
        category='workshop'
        venue=@{ name='Lab A'; city='Bangalore' }
        startDate='2026-12-25T10:00:00Z'
        endDate='2026-12-25T18:00:00Z'
        capacity=5
        price=0
        status='published' 
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Method Post -Uri "$base/events" -Headers $h -ContentType 'application/json' -Body $body
    if (-not $r.event._id) { throw "no event id" }
    $script:eventId = $r.event._id
}

Test "Create event blocked without token (401)" {
    ExpectStatus { Invoke-RestMethod -Method Post -Uri "$base/events" -ContentType 'application/json' -Body '{}' } 401
}

Test "Create event blocked for regular user (403)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer $usrToken" }
        $body = @{ title='x'; description='aaaaaaaaaa'; category='workshop'; startDate='2026-12-25T10:00:00Z'; endDate='2026-12-25T18:00:00Z'; capacity=5 } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/events" -Headers $h -ContentType 'application/json' -Body $body 
    } 403
}

Test "List public events (no auth)" {
    $r = Invoke-RestMethod "$base/events?limit=5"
    if ($r.events.Count -lt 1) { throw "expected at least 1 event" }
}

Test "Search escapes regex injection" {
    $r = Invoke-RestMethod ("$base/events?search=" + [System.Uri]::EscapeDataString('.*'))
    Expect $r.events.Count 0 "regex was treated as literal"
}

Test "Get single event by ID (no auth)" {
    $r = Invoke-RestMethod "$base/events/$eventId"
    Expect $r.event.title 'Smoke Event' "title matches"
}

Test "Update event by non-owner blocked (403)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer $usrToken" }
        $body = @{ title='hacked' } | ConvertTo-Json
        Invoke-RestMethod -Method Put -Uri "$base/events/$eventId" -Headers $h -ContentType 'application/json' -Body $body 
    } 403
}

Test "Field whitelisting on update (organizer field ignored)" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $fakeOrgId = '000000000000000000000000'
    $body = @{ title='Smoke Event Updated'; organizer=$fakeOrgId } | ConvertTo-Json
    $r = Invoke-RestMethod -Method Put -Uri "$base/events/$eventId" -Headers $h -ContentType 'application/json' -Body $body
    if ($r.event.organizer -eq $fakeOrgId) { throw "organizer field was silently overwritten!" }
}

Test "Invalid event ID returns 400" {
    ExpectStatus { Invoke-RestMethod "$base/events/not-a-valid-id" } 400
}

Test "Missing event returns 404" {
    ExpectStatus { Invoke-RestMethod "$base/events/000000000000000000000000" } 404
}
#endregion

#region Registrations
Write-Host ""
Write-Host "## Registrations" -ForegroundColor Yellow

Test "User registers for event" {
    $h = @{ Authorization = "Bearer $usrToken" }
    $r = Invoke-RestMethod -Method Post -Uri "$base/registrations/$eventId" -Headers $h
    if (-not $r.registration.ticketCode) { throw "no ticket code" }
    if (-not $r.registration.qrData.StartsWith('data:image/png;base64,')) { throw "QR not PNG" }
    $script:regId = $r.registration._id
    $script:ticketCode = $r.registration.ticketCode
}

Test "Duplicate registration blocked (409)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer $usrToken" }
        Invoke-RestMethod -Method Post -Uri "$base/registrations/$eventId" -Headers $h 
    } 409
}

Test "Registration count incremented" {
    $r = Invoke-RestMethod "$base/events/$eventId"
    Expect $r.event.registeredCount 1 "registeredCount"
}

Test "User can see own registrations" {
    $h = @{ Authorization = "Bearer $usrToken" }
    $r = Invoke-RestMethod "$base/registrations/my" -Headers $h
    if ($r.registrations.Count -lt 1) { throw "no registrations returned" }
}

Test "Organizer can see attendees for own event" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $r = Invoke-RestMethod "$base/registrations/event/$eventId" -Headers $h
    if ($r.registrations.Count -lt 1) { throw "no attendees" }
}

Test "Regular user blocked from seeing attendees (403)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer $usrToken" }
        Invoke-RestMethod "$base/registrations/event/$eventId" -Headers $h 
    } 403
}

Test "Organizer check-in attendee" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $r = Invoke-RestMethod -Method Put -Uri "$base/registrations/$regId/checkin" -Headers $h
    Expect $r.registration.status 'attended' "checked in"
}

Test "User cannot check in others (403)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer $usrToken" }
        Invoke-RestMethod -Method Put -Uri "$base/registrations/$regId/checkin" -Headers $h 
    } 403
}
#endregion

#region QR ticket verification
Write-Host ""
Write-Host "## QR Ticket verification (public)" -ForegroundColor Yellow

Test "Verify ticket (no auth required)" {
    $r = Invoke-RestMethod "$base/registrations/verify/$ticketCode"
    Expect $r.ticket.ticketCode $ticketCode "ticket code matches"
    Expect $r.ticket.event.title 'Smoke Event Updated' "event title"
}

Test "Verify endpoint hides PII" {
    $r = Invoke-RestMethod "$base/registrations/verify/$ticketCode"
    $json = $r | ConvertTo-Json -Depth 5
    if ($json -match '"email"') { throw "email leaked" }
    if ($json -match '"phone"') { throw "phone leaked" }
    if ($json -match '"_id"') { throw "_id leaked" }
}

Test "Invalid ticket format rejected (400)" {
    ExpectStatus { Invoke-RestMethod "$base/registrations/verify/abc%24where" } 400
}

Test "Missing ticket returns 404" {
    ExpectStatus { Invoke-RestMethod "$base/registrations/verify/EVH-FAKE-XXXXX" } 404
}
#endregion

#region Capacity edge case
Write-Host ""
Write-Host "## Capacity / concurrency" -ForegroundColor Yellow

Test "Event capacity enforced (fill remaining slots + reject overflow)" {
    # event capacity is 5, 1 already registered. Register 4 more, then a 6th should fail.
    for ($i = 1; $i -le 4; $i++) {
        $e = "filler-$rand-$i@gmail.com"
        $body = @{ name="Filler $i"; email=$e; password='Pass1234' } | ConvertTo-Json
        $r = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body
        $h = @{ Authorization = "Bearer $($r.token)" }
        Invoke-RestMethod -Method Post -Uri "$base/registrations/$eventId" -Headers $h | Out-Null
    }
    # 6th should fail with 400 (event full)
    $e6 = "filler-$rand-overflow@gmail.com"
    $body = @{ name="Overflow"; email=$e6; password='Pass1234' } | ConvertTo-Json
    $r6 = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body
    $h6 = @{ Authorization = "Bearer $($r6.token)" }
    ExpectStatus { Invoke-RestMethod -Method Post -Uri "$base/registrations/$eventId" -Headers $h6 } 400
}
#endregion

#region Analytics
Write-Host ""
Write-Host "## Analytics" -ForegroundColor Yellow

Test "Event analytics (organizer)" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $r = Invoke-RestMethod "$base/analytics/event/$eventId" -Headers $h
    if (-not $r.analytics) { throw "no analytics" }
}

Test "Event analytics blocked for non-owner (403)" {
    ExpectStatus { 
        $h = @{ Authorization = "Bearer $usrToken" }
        Invoke-RestMethod "$base/analytics/event/$eventId" -Headers $h 
    } 403
}
#endregion

#region Headers / Security
Write-Host ""
Write-Host "## Security headers" -ForegroundColor Yellow

Test "x-powered-by header is hidden" {
    $r = Invoke-WebRequest "$base/health" -UseBasicParsing
    if ($r.Headers['X-Powered-By']) { throw "x-powered-by leaked" }
}

Test "Helmet security headers present" {
    $r = Invoke-WebRequest "$base/health" -UseBasicParsing
    if (-not $r.Headers['X-Content-Type-Options']) { throw "missing X-Content-Type-Options" }
    if (-not $r.Headers['X-Frame-Options']) { throw "missing X-Frame-Options" }
}
#endregion

#region Cleanup
Write-Host ""
Write-Host "## Cleanup" -ForegroundColor Yellow

Test "User can cancel own registration" {
    $h = @{ Authorization = "Bearer $usrToken" }
    $r = Invoke-RestMethod -Method Delete -Uri "$base/registrations/$regId" -Headers $h
    Expect $r.success $true "cancel returned success"
}

Test "Organizer can delete own event" {
    $h = @{ Authorization = "Bearer $orgToken" }
    $r = Invoke-RestMethod -Method Delete -Uri "$base/events/$eventId" -Headers $h
    Expect $r.success $true "delete returned success"
}
#endregion

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Results: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
Write-Host "========================================" -ForegroundColor Cyan

if ($fail -gt 0) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
} else {
    Write-Host ""
    Write-Host "All checks green. Safe for production." -ForegroundColor Green
    exit 0
}
