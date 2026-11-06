# Google Play – checklist (Kúpeľný rozvrh)

- **Package name:** `sk.kupelnyrozvrh.app`
- **Verzia:** 0.1.2 (versionCode 3)
- **Privacy policy:** https://andrejhlatky13.github.io/kupele-rozvrh/privacy.html
- **AAB:** `dist/kupelny-rozvrh-0.1.2-release.aab` (aj na GitHub Release v0.1.2)
- **Ikona 512×512:** `store-icon-512.png`
- **Keystore:** mimo gitu (`/home/box/secrets/`). Odporúčame Play App Signing – tento kľúč bude upload key. Nestratiť!

## Data safety
- Zbiera aplikácia dáta? **Nie** (všetko zostáva v zariadení).
- Zdieľa dáta s tretími stranami? **Nie**.
- Šifrovanie pri prenose: N/A (nič sa neprenáša). Vymazanie: odinštalovaním / vymazaním dát appky.
- Účet: nevyžaduje. Reklamy: nie. Cieľová skupina: 18+.

## Krátky popis (max 80 znakov)
Prehľad kúpeľných procedúr s odpočtom a pripomienkou 30 a 15 min vopred.

## Úplný popis
Kúpeľný rozvrh ti pomôže nezmeškať žiadnu procedúru počas kúpeľného pobytu.
• Prehľad dnešných a nasledujúcich procedúr s odpočtom do ďalšej
• Pripomienky 30 a 15 minút pred procedúrou – fungujú aj pri zatvorenej aplikácii
• Odfoť papierový rozvrh – text sa rozpozná priamo v telefóne (aj offline), riadky skontroluješ a uložíš
• Tipy, kedy si pripraviť plavky
• Bez účtu, bez reklám, bez sledovania – údaje zostávajú iba v tvojom zariadení

Upozornenie: nejde o oficiálnu aplikáciu žiadnych kúpeľov. Rozhodujúci je vždy rozvrh vydaný kúpeľným zariadením.

## Presné budíky (SCHEDULE_EXACT_ALARM) – zdôvodnenie
Aplikácia je pripomienkovač rozvrhu: používateľ si uloží časy kúpeľných procedúr a aplikácia ho upozorní presne 30 a 15 minút pred každou. Oneskorené upozornenie by spôsobilo zmeškanie procedúry, preto sú potrebné presné budíky. (Ak Play požaduje USE_EXACT_ALARM, kategória: „kalendár/pripomienky“.)

## Postup
1. Play Console → Vytvoriť aplikáciu (sk, aplikácia, zadarmo).
2. Vyplniť obsah aplikácie: privacy URL, Data safety, hodnotenie obsahu, cieľová skupina, reklamy = nie.
3. Store listing: popisy vyššie, ikona 512, feature graphic 1024×500, **min. 2 screenshoty telefónu** (urobiť ručne).
4. Testovanie → Interné testovanie → Nové vydanie → nahrať AAB → zaviesť.
5. Nové osobné účty: uzavretý test s 12 testermi 14 dní pred produkciou.

## 0.1.2 – čistá appka pre nových používateľov
- Prvé spustenie **nenačíta žiadne dáta** (žiadna ukážka Číž). Otvorí sa „Nový pobyt“: predvoľba (Všeobecné / Číž / Piešťany / Nimnica – len tipy a časy jedál), názov kúpeľov, meno, izba, dátumy, časy jedál, „Bez obeda“.
- Domov bez rozvrhu: tlačidlá „Pridať rozvrh“, „Odfotiť plán“, „Zadať ručne“.
- Ukážka Číž len cez Nastavenia → „Načítať ukážku (Číž)“.

**Čo je nové (Play Console release notes):**
Čistý štart pre nových používateľov: sprievodca novým pobytom, časy jedál, rýchle pridanie rozvrhu fotkou alebo ručne.
