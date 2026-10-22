# LoveYou ❤️

A small love note in the shape of a heart. It is available as a Python desktop version and as a mobile-ready app for Android and iOS.

## Desktop app

The original desktop version uses Python's standard library:

```powershell
python love.py
```

## Android and iOS

The mobile app uses Vite for the web experience and Capacitor to run it in native Android and iOS shells.

### Run in a browser

Install Node.js, then run:

```powershell
npm install
npm run dev
```

### Build and run on Android

Install Android Studio and its Android SDK, then run:

```powershell
npm install
npm run build
npx cap add android
npx cap sync android
npm run android
```

### Build and run on iOS

iOS builds require macOS and Xcode. On a Mac, run:

```sh
npm install
npm run build
npx cap add ios
npx cap sync ios
npm run ios
```

After changing the web app, run `npm run build` and `npm run sync` to update the native projects. Open the Android project in Android Studio or the iOS project in Xcode to build and distribute the app.
