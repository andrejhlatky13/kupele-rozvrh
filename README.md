# Kúpeľný rozvrh (MVP)
Osobný rozvrh kúpeľnej liečby: odpočet, dnešný plán, foto plánu → OCR → kontrola → uloženie, lokálne upozornenia 30/15 min.
Osobný plán klienta – nie oficiálna aplikácia kúpeľov.

## Android (spoľahlivé upozornenia)
APK: `dist/kupelny-rozvrh-0.1.0-debug.apk` (aj GitHub Releases). Na mobile: stiahnuť → povoliť inštaláciu z neznámych zdrojov → nainštalovať → povoliť upozornenia (a „Budíky a pripomienky“ ak sa pýta).
Upozornenia plánuje `@capacitor/local-notifications` v systéme Android – chodia aj keď je appka zavretá.

Build: `JAVA_HOME=/home/box/jdk17 ANDROID_HOME=/home/box/android-sdk npm run apk`

## Web
`npm run serve` alebo GitHub Pages. Upozornenia na webe iba best-effort (len keď je appka otvorená/na pozadí).

## Zostáva pre Play Store
Release keystore + podpísaný AAB, vlastná ikona/splash, privacy policy URL, Data safety formulár, žiadosť o SCHEDULE_EXACT_ALARM (alebo USE_EXACT_ALARM odôvodnenie), offline OCR (Tesseract dáta zabaliť do APK – teraz sa sťahujú z CDN), screenshoty, testovanie na viacerých plánoch.
