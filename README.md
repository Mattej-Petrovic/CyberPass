# CyberPass

CyberPass är en lösenordsinriktad webbapplikation byggd för att hjälpa användare att skapa, utvärdera och kontrollera lösenord på ett mer genomtänkt sätt än enkla standardkontroller. Fokus i projektet ligger på tydlig feedback, starkare egna regler för lösenordsstyrka och integritetsmedveten kontroll av läckta lösenord.

Projektet är byggt som en statisk frontend-applikation i ren HTML, CSS och JavaScript. Målet har varit att kombinera säkerhetstänk med en enkel och tydlig användarupplevelse, utan att gömma logiken bakom externa ramverk eller onödig komplexitet.

## Översikt

Applikationen är uppdelad i tre huvuddelar:

- `Lösenordskontrollant` analyserar hur starkt ett lösenord är och visar resultatet direkt i gränssnittet.
- `Lösenordsskapare` hjälper användaren att bygga ett starkare lösenord med en tydlig kravlista och genererade förslag.
- `Läckta lösenord` kontrollerar om ett lösenord förekommer i kända dataläckor via Have I Been Pwned.

Utöver detta innehåller projektet även en mindre väderwidget. Den är inte huvudfokus i applikationen, men visar arbete med externa API:er, geolokalisering och klientbaserad datahämtning.

## Funktioner

- Realtidsanalys av lösenordsstyrka med visuell poängindikator.
- Egen lösenordspolicy med striktare krav än enbart längd och teckentyper.
- Upptäckt av svaga mönster som vanliga lösenord, sekvenser och repetitiva teckenmönster.
- Guidad lösenordsskapare med checklista som uppdateras medan användaren skriver.
- Generering av starka lösenordsförslag, inklusive både slumpmässiga lösenord och passphrase-inspirerade alternativ.
- Kopieringsfunktion för genererade lösenord.
- Kontroll av läckta lösenord via Have I Been Pwned med k-anonymitetsbaserad prefixsökning.
- Klientbaserad SHA-1-hashning med Web Crypto API innan kontroll mot läckdatabasen.

## Hur styrkan bedöms

En viktig del av projektet är att lösenordsstyrkan inte bara baseras på grundläggande krav som “minst 8 tecken”. I stället används en egen policy där maxnivån kräver att flera villkor uppfylls samtidigt.

För högsta betyg i nuvarande implementation krävs bland annat:

- minst 20 tecken
- minst 4 stora bokstäver
- minst 4 små bokstäver
- minst 3 siffror
- minst 4 specialtecken
- att lösenordet inte är vanligt, sekventiellt eller repetitivt

Det gör att bedömningen blir mer realistisk än i många enklare lösenordsmätare som i praktiken bara belönar längd och variation på en ytlig nivå.

## Säkerhet och integritet

Läckkontrollen är byggd med Have I Been Pwneds k-anonymitetsmodell. Det innebär att hela lösenordet aldrig skickas till tjänsten. I stället hashas lösenordet lokalt i webbläsaren och endast en kort prefixdel av hashvärdet används vid uppslagningen. På så sätt går det att kontrollera lösenord mot kända läckor med bättre hänsyn till användarens integritet.

## Teknik

- HTML5
- CSS3
- Vanilla JavaScript
- Web Crypto API
- Have I Been Pwned - Pwned Passwords API
- Open-Meteo API
- OpenStreetMap Nominatim för omvänd geokodning

## Lokal körning

Projektet består av statiska filer och kan köras lokalt utan byggsteg. Öppna `index.html` i en webbläsare, eller starta en enkel lokal server om du föredrar det.

Tänk på att vissa funktioner kräver internetanslutning:

- kontroll av läckta lösenord
- väderwidgetens väderdata och platsuppslag

## Vad projektet visar

CyberPass är främst ett frontend-projekt, men med tydligt fokus på praktisk säkerhet. Det visar att jag kan bygga ett användarvänligt gränssnitt, formulera egen applikationslogik i JavaScript och integrera externa tjänster på ett sätt som tar hänsyn till både funktion och integritet.
