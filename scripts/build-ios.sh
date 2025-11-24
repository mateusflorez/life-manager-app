#!/bin/bash

set -e

# =============================================================================
# Cores e funções de print (precisam vir ANTES de qualquer chamada!)
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

print_header() {
    echo ""
    print_msg $BLUE "=============================================="
    print_msg $BLUE "  Life Manager Mobile - iOS Builder"
    print_msg $BLUE "=============================================="
    echo ""
}

# Check if running on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_msg $RED "iOS builds require macOS!"
        exit 1
    fi
    print_msg $GREEN "Running on macOS: $(sw_vers -productVersion)"
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

# Build iOS locally (requires Xcode)
build_local() {
    local profile=${1:-preview}
    print_msg $BLUE "Building iOS locally with EAS (profile: $profile)..."
    print_msg $YELLOW "Note: Requires Xcode and EAS credentials available locally."
    echo ""

    check_eas_login

    eas build --platform ios --profile "$profile" --local --output ./life-manager-mobile.ipa

    if [ -f "./life-manager-mobile.ipa" ]; then
        print_msg $GREEN "IPA built successfully!"
        print_msg $GREEN "Location: ./life-manager-mobile.ipa"
    else
        print_msg $RED "IPA not found after local build."
    fi
}

# Build iOS using EAS Build cloud
build_eas() {
    local profile=$1
    print_msg $BLUE "Building iOS on EAS Cloud (profile: $profile)..."
    echo ""

    check_eas_login

    print_msg $BLUE "Starting EAS Build..."
    eas build --platform ios --profile "$profile"

    print_msg $GREEN "Build submitted to EAS!"
    print_msg $YELLOW "You can download the IPA from the EAS dashboard or using:"
    print_msg $YELLOW "  eas build:list"
}

# Build development client
build_dev() {
    print_msg $BLUE "Building Development Client for iOS..."
    echo ""

    check_eas_login

    eas build --platform ios --profile development

    print_msg $GREEN "Development build submitted!"
}

# Main script
main() {
    print_header

    # Check dependencies
    print_msg $BLUE "Checking dependencies..."
    check_macos
    check_eas_cli
    echo ""

    # Get build type from argument or default to preview
    BUILD_TYPE=${1:-preview}

    case $BUILD_TYPE in
        local)
            # Optional second arg sets the EAS profile (default: preview)
            build_local "${2:-preview}"
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
            echo "Usage: ./scripts/build-ios.sh [option]"
            echo ""
            echo "Options:"
            echo "  local      - Build locally (requires Xcode on macOS)"
            echo "  preview    - Build on EAS cloud (preview profile) [default]"
            echo "  production - Build on EAS cloud (production profile)"
            echo "  dev        - Build development client"
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
