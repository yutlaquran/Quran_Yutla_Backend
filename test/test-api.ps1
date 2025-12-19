# Simple API Testing Script for Recitations Module
# Usage: .\test-api.ps1

$baseUrl = "http://localhost:3777/api/v1"
$results = @()

Write-Host "`n🧪 Recitations API Tests" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Helper function to add test result
function Add-TestResult {
    param($Name, $Status, $Details = "")
    $script:results += [PSCustomObject]@{
        Test = $Name
        Status = $Status
        Details = $Details
    }
}

# Step 1: Register a test student
Write-Host "`n[Step 1] Registering test student..." -ForegroundColor Yellow

# Use unique email each time
$guid = [Guid]::NewGuid().ToString().Substring(0,8)
$studentEmail = "apitest-$guid@example.com"
$studentPassword = "Test@123456"

Write-Host "   Using email: $studentEmail" -ForegroundColor Gray

$studentData = @{
    email = $studentEmail
    password = $studentPassword
    fullName = "API Test Student"
    phoneNumber = "+201234567890"
    country = "Egypt"
    ageGroup = "13-17"
    gender = "male"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$baseUrl/auth/sign-up" -Method Post `
        -Body $studentData -ContentType "application/json"
    
    Write-Host "✅ Student registered: $studentEmail" -ForegroundColor Green
    Add-TestResult "Registration" "PASS" "Email: $studentEmail"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  Student already exists ($studentEmail)" -ForegroundColor Yellow
        Add-TestResult "Registration" "SKIP" "User already exists"
    } else {
        $errorDetails = ""
        if ($_.ErrorDetails) {
            $errorJSON = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorJSON.errors) {
                $errorDetails = $errorJSON.errors -join ", "
            }
        }
        Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($errorDetails) {
            Write-Host "   Errors: $errorDetails" -ForegroundColor Red
        }
        Add-TestResult "Registration" "FAIL" $_.Exception.Message
    }
}

# Step 2: Login
Write-Host "`n[Step 2] Logging in..." -ForegroundColor Yellow

$loginData = @{
    identifier = $studentEmail
    password = $studentPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
        -Body $loginData -ContentType "application/json"
    
    $token = $loginResponse.data.accessToken
    $userId = $loginResponse.data.user.id
    
    Write-Host "✅ Login successful - User ID: $userId" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    Add-TestResult "Login" "PASS" "User ID: $userId"
} catch {
    $errorDetails = ""
    if ($_.ErrorDetails) {
        $errorDetails = $_.ErrorDetails.Message
    }
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Details: $errorDetails" -ForegroundColor Red
    Add-TestResult "Login" "FAIL" $_.Exception.Message
    exit 1
}

# Setup headers with authentication
$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 1: GET /recitations/me
Write-Host "`n[Test 1] GET /recitations/me" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/recitations/me?page=1&limit=10" `
        -Method Get -Headers $headers
    
    if ($response.success -and $response.data) {
        Write-Host "✅ PASS - Retrieved $($response.meta.total) recitations" -ForegroundColor Green
        Add-TestResult "GET /recitations/me" "PASS" "Total: $($response.meta.total)"
    } else {
        Write-Host "❌ FAIL - Invalid response structure" -ForegroundColor Red
        Add-TestResult "GET /recitations/me" "FAIL" "Invalid response"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 200) {
        Write-Host "✅ PASS - Endpoint accessible" -ForegroundColor Green
        Add-TestResult "GET /recitations/me" "PASS" "200 OK"
    } else {
        Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "GET /recitations/me" "FAIL" $_.Exception.Message
    }
}

# Test 2: GET /recitations/me/statistics
Write-Host "`n[Test 2] GET /recitations/me/statistics" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/recitations/me/statistics" `
        -Method Get -Headers $headers
    
    if ($response.success -and $response.data) {
        $stats = $response.data
        $requiredFields = @('totalRecitations', 'completedRecitations', 'averageScore', 
                           'pendingRecitations', 'totalDuration', 'recitationsBySurah')
        
        $missingFields = $requiredFields | Where-Object { -not ($stats.PSObject.Properties.Name -contains $_) }
        
        if ($missingFields.Count -eq 0) {
            Write-Host "✅ PASS - All 6 required fields present:" -ForegroundColor Green
            Write-Host "   • totalRecitations: $($stats.totalRecitations)" -ForegroundColor Gray
            Write-Host "   • completedRecitations: $($stats.completedRecitations)" -ForegroundColor Gray
            Write-Host "   • averageScore: $($stats.averageScore)" -ForegroundColor Gray
            Write-Host "   • pendingRecitations: $($stats.pendingRecitations)" -ForegroundColor Gray
            Write-Host "   • totalDuration: $($stats.totalDuration)" -ForegroundColor Gray
            Write-Host "   • recitationsBySurah: $($stats.recitationsBySurah.Count) items" -ForegroundColor Gray
            Add-TestResult "GET /me/statistics" "PASS" "All 6 fields present"
        } else {
            Write-Host "❌ FAIL - Missing fields: $($missingFields -join ', ')" -ForegroundColor Red
            Add-TestResult "GET /me/statistics" "FAIL" "Missing: $($missingFields -join ', ')"
        }
    } else {
        Write-Host "❌ FAIL - Invalid response structure" -ForegroundColor Red
        Add-TestResult "GET /me/statistics" "FAIL" "Invalid response"
    }
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "GET /me/statistics" "FAIL" $_.Exception.Message
}

# Test 3: GET /recitations/me with filters
Write-Host "`n[Test 3] GET /recitations/me (with filters)" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/recitations/me?status=pending&surahId=1" `
        -Method Get -Headers $headers
    
    if ($response.success) {
        Write-Host "✅ PASS - Filters working (returned $($response.meta.total) items)" -ForegroundColor Green
        Add-TestResult "GET /me (filtered)" "PASS" "Filters working"
    } else {
        Write-Host "❌ FAIL - Invalid response" -ForegroundColor Red
        Add-TestResult "GET /me (filtered)" "FAIL" "Invalid response"
    }
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "GET /me (filtered)" "FAIL" $_.Exception.Message
}

# Test 4: Check authentication on protected endpoint
Write-Host "`n[Test 4] Authentication test (no token)" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/recitations/me" -Method Get
    Write-Host "❌ FAIL - Endpoint not protected!" -ForegroundColor Red
    Add-TestResult "Authentication" "FAIL" "Endpoint allows unauthenticated access"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASS - Properly protected (401 Unauthorized)" -ForegroundColor Green
        Add-TestResult "Authentication" "PASS" "401 Unauthorized without token"
    } else {
        Write-Host "⚠️  WARN - Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        Add-TestResult "Authentication" "WARN" "Status: $($_.Exception.Response.StatusCode)"
    }
}

# Test 5: GET /recitations/:id (expect 404 for non-existent)
Write-Host "`n[Test 5] GET /recitations/:id (non-existent)" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/recitations/99999999" `
        -Method Get -Headers $headers
    Write-Host "⚠️  WARN - Expected 404, got success" -ForegroundColor Yellow
    Add-TestResult "GET /recitations/:id" "WARN" "Should return 404 for non-existent ID"
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ PASS - Correctly returns 404" -ForegroundColor Green
        Add-TestResult "GET /recitations/:id" "PASS" "404 for non-existent ID"
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ PASS - Correctly returns 403 (not owned)" -ForegroundColor Green
        Add-TestResult "GET /recitations/:id" "PASS" "403 for unauthorized access"
    } else {
        Write-Host "❌ FAIL - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Add-TestResult "GET /recitations/:id" "FAIL" "Status: $($_.Exception.Response.StatusCode)"
    }
}

# Test 6-11: Other endpoints (basic reachability)
Write-Host "`n[Test 6-11] Testing other endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{Name="GET /parent/children"; Path="/recitations/parent/children"; Expected=403}
    @{Name="GET /parent/children/:id/recitations"; Path="/recitations/parent/children/1/recitations"; Expected=403}
    @{Name="GET /parent/children/:id/statistics"; Path="/recitations/parent/children/1/statistics"; Expected=403}
    @{Name="GET /teacher/students"; Path="/recitations/teacher/students"; Expected=403}
    @{Name="GET /teacher/recitations"; Path="/recitations/teacher/recitations"; Expected=403}
    @{Name="GET /teacher/statistics"; Path="/recitations/teacher/statistics"; Expected=403}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$($endpoint.Path)" -Method Get -Headers $headers
        Write-Host "   ⚠️  $($endpoint.Name) - Unexpected success" -ForegroundColor Yellow
        Add-TestResult $endpoint.Name "WARN" "Expected $($endpoint.Expected), got 200"
    } catch {
        if ($_.Exception.Response.StatusCode -eq $endpoint.Expected) {
            Write-Host "   ✅ $($endpoint.Name) - Correctly returns $($endpoint.Expected)" -ForegroundColor Green
            Add-TestResult $endpoint.Name "PASS" "Returns $($endpoint.Expected) as expected"
        } else {
            Write-Host "   ❌ $($endpoint.Name) - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            Add-TestResult $endpoint.Name "FAIL" "Status: $($_.Exception.Response.StatusCode)"
        }
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warned = ($results | Where-Object { $_.Status -eq "WARN" }).Count

Write-Host "`nResults:" -ForegroundColor White
Write-Host "  ✅ PASSED:  $passed" -ForegroundColor Green
Write-Host "  ❌ FAILED:  $failed" -ForegroundColor Red
Write-Host "  ⚠️  WARNINGS: $warned" -ForegroundColor Yellow
Write-Host "  📝 TOTAL:   $($results.Count)" -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  ❌ $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

Write-Host "`nTesting Complete!" -ForegroundColor Cyan
Write-Host "For detailed Swagger testing, see: test/SWAGGER-TESTING-GUIDE.md" -ForegroundColor Gray
Write-Host ""

# Exit with error code if any tests failed
if ($failed -gt 0) {
    exit 1
}
