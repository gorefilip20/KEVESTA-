# KEVESTA mobile E2E

KEVESTA uses **Appium 3 + WebdriverIO 9** for native Android and iOS end-to-end coverage. The suite lives in `e2e/specs/mobile-auth-checkout.e2e.js` and covers empty-login validation plus the authenticated flight path through search, seat selection, passenger details, and checkout.

## Device prerequisites

A real Android device, Android emulator, iOS simulator, or an attached Expo Go session is required. This repository does not bundle a device image. For a development build or standalone binary, set `MOBILE_APP_PATH` to the `.apk` or `.app` and select the matching Appium automation driver. For Expo Go, launch the app in Expo Go first and use `APPIUM_EXTERNAL=1` with an Appium server already connected to the device; use the Expo QR/development URL to open the project in Expo Go.

Install the relevant Appium driver once:

```bash
npx appium driver install uiautomator2
# iOS only, on macOS with Xcode:
npx appium driver install xcuitest
```

Run Android:

```bash
E2E_EMAIL='verified@example.com' \
E2E_PASSWORD='your-password' \
MOBILE_APP_PATH="$PWD/mobile/android/app/build/outputs/apk/debug/app-debug.apk" \
npm run mobile:e2e:android
```

Run iOS on macOS:

```bash
E2E_EMAIL='verified@example.com' \
E2E_PASSWORD='your-password' \
MOBILE_APP_PATH="$PWD/mobile/ios/KEVESTA.app" \
MOBILE_DEVICE='iPhone 15' \
npm run mobile:e2e:ios
```

The authenticated test is skipped when `E2E_EMAIL` and `E2E_PASSWORD` are absent, allowing the login validation test to run as a smoke check. Optional variables include `E2E_ORIGIN`, `E2E_DESTINATION`, `MOBILE_DEVICE`, `MOBILE_PLATFORM_VERSION`, `APPIUM_HOST`, `APPIUM_PORT`, and `APPIUM_EXTERNAL=1`.

The app’s `testID` values are deliberately stable and should be kept unchanged when updating the UI: `login-email`, `login-password`, `login-submit`, `login-error`, `flight-origin`, `flight-destination`, `flight-search-submit`, `passenger-first-name`, `passenger-last-name`, `passenger-email`, and `passenger-next`.

A sandbox without a connected device can still validate TypeScript, the production web build, the Expo web renderer, and test configuration loading, but it cannot claim a native Appium pass or real payment settlement.

## Remote Android emulator workflow

GitHub Actions workflow `.github/workflows/mobile-android-e2e.yml` builds a debug Android APK, provisions an Android 15 emulator, installs UiAutomator2, starts Appium, and runs the same WebdriverIO suite. It runs on pull requests that touch the mobile or E2E surface and can also be started manually from the Actions tab.

For the full authenticated booking path, configure these repository or environment secrets:

- `KEVESTA_API_URL`: reachable KEVESTA API base URL
- `KEVESTA_E2E_EMAIL`: verified test account email
- `KEVESTA_E2E_PASSWORD`: test account password
- `KEVESTA_E2E_ORIGIN`: optional origin airport, default `JFK`
- `KEVESTA_E2E_DESTINATION`: optional destination airport, default `LHR`

Without the credentials, the workflow still provisions the emulator and runs the unauthenticated login-validation smoke test; the authenticated flow skips intentionally. Appium logs and test results are uploaded as the `mobile-android-e2e-logs` workflow artifact, including on failure.
