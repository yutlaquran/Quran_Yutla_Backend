#!/bin/bash
# Recitations Test Runner Script
# This script helps run the recitations e2e tests with various options

echo "🧪 Quran Yutla - Recitations E2E Test Runner"
echo "=============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Function to run specific test
run_test() {
    case $1 in
        "all")
            echo "🚀 Running all recitations tests..."
            npm run test:e2e -- recitations.e2e-spec
            ;;
        "upload")
            echo "📤 Running upload tests..."
            npm run test:e2e -- recitations.e2e-spec -t "upload"
            ;;
        "student")
            echo "👨‍🎓 Running student endpoint tests..."
            npm run test:e2e -- recitations.e2e-spec -t "GET /v1/recitations/me"
            ;;
        "parent")
            echo "👨‍👩‍👧 Running parent endpoint tests..."
            npm run test:e2e -- recitations.e2e-spec -t "Parent Endpoints"
            ;;
        "teacher")
            echo "👨‍🏫 Running teacher endpoint tests..."
            npm run test:e2e -- recitations.e2e-spec -t "Teacher Endpoints"
            ;;
        "evaluation")
            echo "📝 Running teacher evaluation tests..."
            npm run test:e2e -- recitations.e2e-spec -t "Teacher Evaluation"
            ;;
        "webhook")
            echo "🔗 Running webhook tests..."
            npm run test:e2e -- recitations.e2e-spec -t "webhook"
            ;;
        "coverage")
            echo "📊 Running tests with coverage..."
            npm run test:e2e -- recitations.e2e-spec --coverage
            ;;
        "watch")
            echo "👀 Running tests in watch mode..."
            npm run test:e2e -- recitations.e2e-spec --watch
            ;;
        "verbose")
            echo "📢 Running tests in verbose mode..."
            npm run test:e2e -- recitations.e2e-spec --verbose
            ;;
        *)
            echo "❌ Unknown test option: $1"
            echo ""
            echo "Available options:"
            echo "  all         - Run all recitations tests"
            echo "  upload      - Run upload tests only"
            echo "  student     - Run student endpoint tests"
            echo "  parent      - Run parent endpoint tests"
            echo "  teacher     - Run teacher endpoint tests"
            echo "  evaluation  - Run teacher evaluation tests"
            echo "  webhook     - Run webhook tests"
            echo "  coverage    - Run with coverage report"
            echo "  watch       - Run in watch mode"
            echo "  verbose     - Run with verbose output"
            echo ""
            echo "Usage: ./run-recitations-tests.sh <option>"
            exit 1
            ;;
    esac
}

# Main execution
if [ -z "$1" ]; then
    echo "📋 Please select a test option:"
    echo ""
    echo "1. All tests"
    echo "2. Upload tests"
    echo "3. Student endpoints"
    echo "4. Parent endpoints"
    echo "5. Teacher endpoints"
    echo "6. Teacher evaluation"
    echo "7. Webhook tests"
    echo "8. With coverage"
    echo "9. Watch mode"
    echo ""
    read -p "Enter choice (1-9): " choice
    
    case $choice in
        1) run_test "all" ;;
        2) run_test "upload" ;;
        3) run_test "student" ;;
        4) run_test "parent" ;;
        5) run_test "teacher" ;;
        6) run_test "evaluation" ;;
        7) run_test "webhook" ;;
        8) run_test "coverage" ;;
        9) run_test "watch" ;;
        *) echo "❌ Invalid choice"; exit 1 ;;
    esac
else
    run_test $1
fi

echo ""
echo "✅ Test execution completed!"
