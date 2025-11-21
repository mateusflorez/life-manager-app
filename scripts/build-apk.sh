#!/bin/bash

# =============================================================================
# Life Manager Mobile - APK Build Script
# =============================================================================
# This script builds an APK for the Life Manager Mobile app using EAS Build.
#
# Usage:
#   ./scripts/build-apk.sh [option]
#
# Options:
#   local      - Build locally (requires Android SDK)
#   preview    - Build on EAS cloud (preview profile)
#   production - Build on EAS cloud (production profile)
#   dev        - Build development client APK
#
# Default: preview (if no option provided)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

print_header() {
    echo ""
    print_msg $BLUE "=============================================="
    print_msg $BLUE "  Life Manager Mobile - APK Builder"
    print_msg $BLUE "=============================================="
    echo ""
}

# Check if eas-cli is installed
check_eas_cli() {
    if ! command -v eas &> /dev/null; then
        print_msg $YELLOW "EAS CLI not found. Installing..."
        npm install -g eas-cli
        print_msg $GREEN "EAS CLI installed successfully!"
    else
        print_msg $GREEN "EAS CLI found: $(eas --version)"
    fi
}

# Check if user is logged in to EAS
check_eas_login() {
    if ! eas whoami &> /dev/null; then
        print_msg $YELLOW "Not logged in to EAS. Please login:"
        eas login
    else
        print_msg $GREEN "Logged in as: $(eas whoami)"
    fi
}

# Build APK locally (requires Android SDK)
build_local() {
    print_msg $BLUE "Building APK locally..."
    print_msg $YELLOW "Note: This requires Android SDK to be installed and configured."
    echo ""

    # Run prebuild to generate native project
    print_msg $BLUE "Running expo prebuild..."
    npx expo prebuild --platform android --clean

    # Navigate to android folder and build
    print_msg $BLUE "Building APK with Gradle..."
    cd android
    ./gradlew assembleRelease
    cd ..

    # Find the APK
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        print_msg $GREEN "APK built successfully!"
        print_msg $GREEN "Location: $APK_PATH"

        # Copy to project root for convenience
        cp "$APK_PATH" "./life-manager-mobile.apk"
        print_msg $GREEN "Copied to: ./life-manager-mobile.apk"
    else
        print_msg $RED "APK not found at expected location."
        print_msg $YELLOW "Searching for APK files..."
        find android -name "*.apk" -type f 2>/dev/null
    fi
}

# Build APK using EAS Build cloud
build_eas() {
    local profile=$1
    print_msg $BLUE "Building APK on EAS Cloud (profile: $profile)..."
    echo ""

    check_eas_login

    print_msg $BLUE "Starting EAS Build..."
    eas build --platform android --profile "$profile"

    print_msg $GREEN "Build submitted to EAS!"
    print_msg $YELLOW "You can download the APK from the EAS dashboard or using:"
    print_msg $YELLOW "  eas build:list"
}

# Build development client
build_dev() {
    print_msg $BLUE "Building Development Client APK..."
    echo ""

    check_eas_login

    eas build --platform android --profile development

    print_msg $GREEN "Development build submitted!"
}

# Main script
main() {
    print_header

    # Check dependencies
    print_msg $BLUE "Checking dependencies..."
    check_eas_cli
    echo ""

    # Get build type from argument or default to preview
    BUILD_TYPE=${1:-preview}

    case $BUILD_TYPE in
        local)
            build_local
            ;;
        preview)
            build_eas "preview"
            ;;
        production)
            build_eas "production"
            ;;
        dev|development)
            build_dev
            ;;
        help|--help|-h)
            echo "Usage: ./scripts/build-apk.sh [option]"
            echo ""
            echo "Options:"
            echo "  local      - Build locally (requires Android SDK)"
            echo "  preview    - Build on EAS cloud (preview profile) [default]"
            echo "  production - Build on EAS cloud (production profile)"
            echo "  dev        - Build development client APK"
            echo ""
            ;;
        *)
            print_msg $RED "Unknown option: $BUILD_TYPE"
            print_msg $YELLOW "Use --help for usage information."
            exit 1
            ;;
    esac

    echo ""
    print_msg $GREEN "Done!"
}

# Run main function
main "$@"
