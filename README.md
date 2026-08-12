# Salience

Salience is an in-development, local-first Android and web prototype for structured personal wellbeing records. It explores daily check-ins, sleep and journal records, reminders, trend summaries, user-controlled exports, and a compact Android home-screen widget.

## Status and boundaries

This is a source snapshot for technical review. It is not a medical device, clinical service, diagnostic system, treatment recommendation, or emergency service. The prototype has not been presented as clinically validated or suitable for making healthcare decisions.

The application is designed to keep records on the user's device. Report and export features operate on records selected by the user. This repository contains no end-user records, environment files, signing material, application packages, or release bundles.

## Technology

- React and TypeScript
- Vite
- IndexedDB through Dexie
- Zod validation
- Capacitor for the Android wrapper
- Vitest and Testing Library

## Web development

```powershell
npm ci
npm run dev
```

## Validation

```powershell
npm run lint
npm test
npm run build
```

## Android development

Install JDK 21 and the Android SDK, then set `JAVA_HOME` and either `ANDROID_HOME` or `ANDROID_SDK_ROOT` before running:

```powershell
npm run android:build:debug
npm run android:lint
```

Generated application packages, machine-specific SDK paths, signing files, and copied web assets are intentionally excluded from version control.

## Android test build

A prebuilt Android package is available for controlled testing from the owned project host:

- [Download the Salience APK](https://finnerty.me/salience.apk)
- [Verify the SHA-256 checksum](https://finnerty.me/salience.sha256.txt)

This is an in-development sideloaded test build, not an app-store release. Android may require explicit permission to install an app from this source. Review the source and verify the checksum before installing. The package remains external to this repository and is subject to the same non-clinical boundaries described above.

## Source use

No license is granted by the presence of this public source snapshot. The code is available for inspection unless and until a separate licence is added.
