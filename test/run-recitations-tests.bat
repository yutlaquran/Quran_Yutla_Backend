@echo off
REM Recitations Test Runner Script for Windows
REM This script helps run the recitations e2e tests with various options

echo.
echo 🧪 Quran Yutla - Recitations E2E Test Runner
echo ==============================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Parse command line argument
if "%1"=="" goto MENU
if "%1"=="all" goto ALL
if "%1"=="upload" goto UPLOAD
if "%1"=="student" goto STUDENT
if "%1"=="parent" goto PARENT
if "%1"=="teacher" goto TEACHER
if "%1"=="evaluation" goto EVALUATION
if "%1"=="webhook" goto WEBHOOK
if "%1"=="coverage" goto COVERAGE
if "%1"=="watch" goto WATCH
if "%1"=="verbose" goto VERBOSE

echo ❌ Unknown test option: %1
echo.
goto USAGE

:MENU
echo 📋 Please select a test option:
echo.
echo 1. All tests
echo 2. Upload tests
echo 3. Student endpoints
echo 4. Parent endpoints
echo 5. Teacher endpoints
echo 6. Teacher evaluation
echo 7. Webhook tests
echo 8. With coverage
echo 9. Watch mode
echo 0. Exit
echo.
set /p choice="Enter choice (0-9): "

if "%choice%"=="1" goto ALL
if "%choice%"=="2" goto UPLOAD
if "%choice%"=="3" goto STUDENT
if "%choice%"=="4" goto PARENT
if "%choice%"=="5" goto TEACHER
if "%choice%"=="6" goto EVALUATION
if "%choice%"=="7" goto WEBHOOK
if "%choice%"=="8" goto COVERAGE
if "%choice%"=="9" goto WATCH
if "%choice%"=="0" goto END

echo ❌ Invalid choice
goto END

:ALL
echo 🚀 Running all recitations tests...
call npm run test:e2e -- recitations.e2e-spec
goto DONE

:UPLOAD
echo 📤 Running upload tests...
call npm run test:e2e -- recitations.e2e-spec -t "upload"
goto DONE

:STUDENT
echo 👨‍🎓 Running student endpoint tests...
call npm run test:e2e -- recitations.e2e-spec -t "GET /v1/recitations/me"
goto DONE

:PARENT
echo 👨‍👩‍👧 Running parent endpoint tests...
call npm run test:e2e -- recitations.e2e-spec -t "Parent Endpoints"
goto DONE

:TEACHER
echo 👨‍🏫 Running teacher endpoint tests...
call npm run test:e2e -- recitations.e2e-spec -t "Teacher Endpoints"
goto DONE

:EVALUATION
echo 📝 Running teacher evaluation tests...
call npm run test:e2e -- recitations.e2e-spec -t "Teacher Evaluation"
goto DONE

:WEBHOOK
echo 🔗 Running webhook tests...
call npm run test:e2e -- recitations.e2e-spec -t "webhook"
goto DONE

:COVERAGE
echo 📊 Running tests with coverage...
call npm run test:e2e -- recitations.e2e-spec --coverage
goto DONE

:WATCH
echo 👀 Running tests in watch mode...
call npm run test:e2e -- recitations.e2e-spec --watch
goto DONE

:VERBOSE
echo 📢 Running tests in verbose mode...
call npm run test:e2e -- recitations.e2e-spec --verbose
goto DONE

:USAGE
echo Available options:
echo   all         - Run all recitations tests
echo   upload      - Run upload tests only
echo   student     - Run student endpoint tests
echo   parent      - Run parent endpoint tests
echo   teacher     - Run teacher endpoint tests
echo   evaluation  - Run teacher evaluation tests
echo   webhook     - Run webhook tests
echo   coverage    - Run with coverage report
echo   watch       - Run in watch mode
echo   verbose     - Run with verbose output
echo.
echo Usage: run-recitations-tests.bat [option]
goto END

:DONE
echo.
echo ✅ Test execution completed!

:END
echo.
pause
