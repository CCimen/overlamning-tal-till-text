# Överlämningen: tal till text i produktion

En statisk webbplats med läget för arbetet, vägen till produktion, planen för första leveransen till eneo-test, gallringen, space och ägande, MFA och beställningen till OneGate. Den byggs med Astro och Starlight, med temat flexoki (`starlight-theme-flexoki`), och är på svenska. Allt den visar finns i det här förrådet. Bygget hämtar ingenting.

## Vad som finns var

| Sökväg | Innehåll |
|---|---|
| `src/content/docs/index.mdx` | Startsidan "Ta över arbetet". Läget överst, spåren och antalen under "På GitHub" läses ur datafilen; resten är vanlig text. Raden "Pausat" i läget visas så länge något spår är pausat, men texten "Produktionen (space, ägande och MFA)" är skriven för hand och ändras när produktionsarbetet startar. |
| `src/content/docs/forsta-leveransen.mdx` | "Första leveransen till eneo-test". |
| `src/content/docs/vagen-till-produktion.mdx` | "Vägen till produktion": hur ett möte går genom systemet, var det byggs, kraven, ordningen och stegen fram till produktion. |
| `src/content/docs/gallring.mdx` | "Gallring": en tid per nivå, motorn, var innehållet finns, stegen och besluten för gallringen, och underärendena till #1425. |
| `src/content/docs/space-och-agande.mdx` | "Space och ägande i Eneo". |
| `src/content/docs/mfa.mdx` | "MFA i Eneo", och underärendena till #804. |
| `src/content/docs/onegate.mdx` | "MFA med OneGate: vem gör vad". |
| `src/data/lage.json` | Läget: spåren, det som pågår, beslut som väntar och underärendena. Skrivs av exporten; för hand bara när exporten inte går (se nedan). |
| `src/styles/sajt.css` | Figurernas och rutornas utseende: temats ytor, hörn och accent i båda lägena, och figurernas egna klasser. |
| `src/components/Underarenden.astro` | Tabellen med underärendena till en epic, ur datafilen. |
| `src/content/i18n/sv.json` | De få gränssnittstexter som Starlight saknar på svenska. |
| `scripts/kontroll.mjs` | Kontrollen av publik text, se nedan. |
| `scripts/lankar.mjs` | Länkkontrollen: varje intern länk i den byggda sidan pekar på en sida och ett ankare som finns. Körs efter bygget. |
| `scripts/kontrast.js` | Kontrastmätningen enligt WCAG 2.2, körs för hand i webbläsaren, se nedan. |

## Förutsättningar

- Node 22 (22.23.4 eller senare) och npm, som `.nvmrc` och `engines` i `package.json` säger.
- För att uppdatera läget dessutom: `python3`, `br` (ärendelistan) och `gh`, inloggad mot GitHub med `gh auth login`.

Installera beroendena exakt som låsfilen säger:

```sh
npm ci
```

## Ändra en text

1. Öppna sidans fil under `src/content/docs/` och ändra texten. Det är Markdown; `.mdx` betyder att sidan också kan använda komponenter, som märkena `<Badge … />`.
2. Förhandsvisa (se nedan) och läs sidan.
3. Checka in (se nedan).

Ett exempel. Steg G3 på sidan Gallring har landat. Raden i tabellen under "Klart och kvar" i `src/content/docs/gallring.mdx` ändras från

```mdx
| G3 | **Stegnivån** <Badge text="Före eneo-test" variant="default" /><br />Ett steg kan ha en kortare tid, i timmar. … | D E | <Badge text="Kvar" variant="default" /> |
```

till

```mdx
| G3 | **Stegnivån**<br />Ett steg kan ha en kortare tid, i timmar. … Landade 2 december.<br />[PR #1234](https://github.com/eneo-ai/eneo/pull/1234) | D E | <Badge text="Klart" variant="success" /> |
```

En länk till ett avsnitt på en annan sida skrivs med sidans adress och rubrikens ankare, till exempel `[Klart och kvar](/gallring/#klart-och-kvar)`. Ankaret är rubriken med små bokstäver och bindestreck, med å, ä och ö kvar. Länkkontrollen säger till om ett ankare inte finns.

En ny sida är en ny fil i samma mapp. Lägg den i `sidebar` i `astro.config.mjs`.

## När ett steg landar

Utöver `lage.json` (som exporten skriver) står läget på några ställen i texten. Gå igenom dem:

- [ ] **Första leveransen** (`forsta-leveransen.mdx`): märket i stegets rubrik (`<details id="steg-…">`, till exempel `<Badge text="Landat" variant="success" />`), stegets text, stegkartan under Tidpunkt 1 (flytta steget till rutan "Landat") och raden med märket "Pågår" överst på sidan.
- [ ] **Vägen till produktion** (`vagen-till-produktion.mdx`): kolumnen Status i tabellerna under "Arbetet, steg för steg", och tabellen över kraven under "De sex kraven" när ett krav ändrar läge.
- [ ] **Gallring** (`gallring.mdx`): tabellen under "Klart och kvar", och märkena i figuren "En motor för all gallring".
- [ ] **MFA i Eneo** och **Space och ägande** (`mfa.mdx`, `space-och-agande.mdx`): avsnitten "Läget" och "Var arbetet står".
- [ ] **Startsidan** (`index.mdx`): listan "Gör i den här ordningen", och figuren "Så hänger arbetet ihop" om en ruta byter rad.
- [ ] Bygg (`npm run build`) så att kontrollen och länkkontrollen körs, och läs sidan.

## Uppdatera läget

Läget kommer ur ärendelistan och GitHub. Exportskriptet `progress.py` ligger i det privata underlaget, som lämnas över tillsammans med ärendelistan; varken skriptet eller listan hör hemma i det här förrådet. Hur ärendelistan lämnas över är en öppen fråga till ägaren.

```sh
python3 arbete/verktyg/progress.py exportera --arbetskopia <arbetskopian med ärendelistan> --webb <den här mappen>
```

Sökvägen `arbete/verktyg/progress.py` gäller från roten av det privata underlaget; stå där när du kör kommandot.

Exporten läser ärendelistan med `br` och underärendena till GitHub-epicerna #804 och #1425 med `gh`. Den skriver `src/data/lage.json` med bara det som sidan visar och en tidsstämpel. Filen byts först när allt är läst och prövat. Saknas ett kort, svarar inte GitHub eller står något i filen som inte får stå i ett publikt förråd, ligger den förra filen och dess tidsstämpel kvar och kommandot slutar med en kod som inte är noll.

Läs alltid diffen innan du checkar in: `git diff src/data/lage.json`. Kortens rubriker och raderna om läget är fritext.

### Vad exporten läser i ärendelistan

Varje leverans är ett kort i ärendelistan, och kortets anteckningar börjar med raden `Läge:`. Exporten läser:

- **`Läge: landat`** som första rad: steget räknas som klart i sitt spår, också innan kortet stängs. Ett stängt kort är alltid klart.
- **`Sida:`**: en mening i vanliga ord om var leveransen står. Den blir texten under "Pågår" och texten för ett beslut som väntar.
- **`Väntar på:`**: vem eller vad leveransen väntar på, i vanliga ord. Den blir raden "Väntar på" under "Pågår".
- **Etiketten `agarfraga`**: kortet är en fråga som väntar på beslut och visas under "Beslut som väntar".
- **Prioriteten**: en fråga med prioritet 0 eller 1 behövs före eneo-test eller överlämningen och visas öppet på startsidan; övriga står i den hopfällda listan under dem.

### Läget för hand

Går exporten inte att köra (till exempel utan tillgång till ärendelistan) får `src/data/lage.json` redigeras för hand. Formen:

```json
{
  "hamtad": "2026-11-20T09:23+01:00",
  "github_hamtad": "2026-11-20T09:23+01:00",
  "kedjor": [{ "namn": "Gallring i övrigt", "klara": 3, "totalt": 6, "nasta": "…", "pausad": null }],
  "pagar": [{ "rubrik": "…", "lage": "…", "vantar": "…" }],
  "beslut": [{ "rubrik": "…", "text": "…", "prioritet": 1 }],
  "github": { "804": [{ "forrad": "eneo", "nummer": 807, "titel": "…", "tillstand": "öppet" }], "1425": [] }
}
```

- `hamtad` är tiden som startsidan visar; sätt den till när du ändrade läget. En ändring för hand ändrar bara `hamtad`.
- `github_hamtad` är när underärendena senast hämtades från GitHub, och visas vid tabellerna med underärenden. Bara exporten skriver den.
- `kedjor` är spåren på startsidan; "Nästa att starta" i läget överst är `nasta` i det första spåret som inte är pausat och har ett. `pausad` är `null` eller en mening om varför spåret står still; spåret får en länk till sin sida om namnet finns i listan `lankar` överst i `index.mdx`.
- `pagar` är "Pågår", `beslut` är "Beslut som väntar" och `github` är underärendena till epicerna #804 och #1425. Startsidan räknar dem under "På GitHub"; ett ärende vars tillstånd börjar med "stängt" räknas som stängt.

Nästa export skriver över det som ändrats för hand.

Skyddet är detsamma som för exporten: `npm run kontroll` (och bygget, som kör den) nekar text som inte får stå i ett publikt förråd.

## Från ärendelistan till sidan

Så når ett nytt läge den publicerade sidan, från början till slut:

1. **Exportera** i den privata arbetsmappen, som ovan. Kommandot skriver `src/data/lage.json` i den här mappen.
2. **Läs diffen:** `git diff src/data/lage.json`. Det är fritext ur korten, och den blir publik. Kontrollen stoppar id:n, namn och sökvägar, men inte allt: kundnamn, och detaljer om ett fel som ännu inte är rättat och utgivet, ska inte stå där. Står något sådant där: ändra kortet och exportera igen.
3. **Bygg:** `npm run build`. Kontrollen av publik text körs före och efter bygget, och länkkontrollen efter.
4. **Checka in** det som ändrats, och `git commit` med skälet i brödtexten:
   - en textändring: `git add src/content/docs/<sida>.mdx`;
   - läget: `git add src/data/lage.json`.
5. **Pusha** till `main`, som Dokploy bygger från: `git push`.
6. **Starta bygget** med **Deploy** i appen i Dokploy. En push bygger inte om sidan av sig själv; det kräver Dokploys webhook i förrådets inställningar på GitHub (Settings → Webhooks, med adressen från appens Deployments-flik).
7. **Kontrollera** att startsidan visar den nya tiden efter "Läget uppdaterades". Står den gamla tiden kvar har bygget fallerat, och byggloggen i Dokploy säger varför.

Samma väg gäller för en ändrad text, utan steg 1 och 2; i steg 7 öppnas då den ändrade sidan.

## Förhandsvisa

```sh
npm run build
npm run preview
```

Öppna adressen som `preview` skriver ut. Sökningen fungerar bara i den byggda sidan, inte i `npm run dev`.

## Kontrollen av publik text

```sh
npm run kontroll
```

Söker igenom `src/`, `astro.config.mjs`, `dist/` och den här filen och nekar, med fil och radnummer, vid sådant som inte ska stå i ett publikt förråd: interna kort-id och beslutsnummer, granskningsmodellernas namn, personnamn och lokala sökvägar. Den körs också före och efter varje bygge. Ger den en träff: ändra texten, lätta inte på mönstren. Exportskriptet nekar samma mönster innan det skriver `lage.json`.

Kontrasten (WCAG 2.2, 4.5:1 för text och 3:1 för grafik) mäts med `scripts/kontrast.js` i en byggd sida: kör `npm run preview`, öppna sidan i Chrome och skriv i DevTools-konsolen `await (<innehållet i scripts/kontrast.js>)()`, alltså `await (`, hela filens innehåll och `)()`. Gör det en gång i ljust och en gång i mörkt läge.
Svaret ska ha en tom lista `fel` och `grafikFel` lika med 0 på varje sida; `lagst` och `grafikLagst` visar de lägsta kvoterna. `grafikFel` räknar det som underskrider 3:1 bland streck och pilar i figurerna, staplarna mot sitt spår och länkarna i figurerna i hovringsläge (där ska texten nå 4.5:1). Skriptet mäter inte fokusramarna; prova dem separat, med Tab genom sidan i båda lägena.

Efter bygget körs också länkkontrollen (`node scripts/lankar.mjs dist`). Den nekar en intern länk till en sida eller ett ankare som inte finns.

## Checka in

```sh
npm run build          # kör kontrollen före och efter bygget, och länkkontrollen efter
git add -A
git commit
```

Skriv commit-meddelandet på svenska, med skälet i brödtexten.

## Driftsätta i Dokploy

1. Skapa en **Application** som bygger från förrådet.
2. Välj byggtypen **Nixpacks**. Den väljer Node-version ur `engines` i `package.json` (22.23.4 eller senare), installerar med `npm ci` och kör `npm run build`. Kontrollera i byggloggen vilken Node som valdes; sidan är byggd och provad med Node 22, som `.nvmrc` säger.
3. Sätt **Publish Directory** till `./dist`. Då serveras de byggda filerna av nginx som en statisk sida.
4. Lägg till domänen med port 80, HTTPS och Let's Encrypt. Publicera inte containerns port direkt på värden.
5. Sidan är publik tills vidare. Ska den skyddas: slå på Basic Auth under **Advanced → Security**. Ett användarnamn och ett lösenord räcker för teamet.

Ett lösenord skyddar bara den byggda sidan. Det skyddar inte förrådet: är förrådet publikt kan vem som helst läsa allt som är incheckat, också `src/data/lage.json` och historiken. Därför får förrådet bara innehålla det som tål att vara publikt, och därför finns kontrollen ovan.
