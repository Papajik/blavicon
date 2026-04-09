# Blavicon Festival Planner

## Cíl

Vytvořit malou statickou webovou aplikaci pro GitHub Pages, která:

- zobrazí festivalový program pro několik dní a více scén,
- umožní označovat události, které chci navštívit,
- umí předvyplnit výběr podle současně zeleně zvýrazněných položek,
- po refreshi zachová stav přes cookie,
- nabídne export a import konfigurace jako krátký textový řetězec,
- z exportu umí vytvořit i sdílitelný odkaz.

## Omezení a pracovní předpoklady

- Implementace bude čistě `HTML + CSS + JavaScript`.
- Aplikace poběží bez backendu na GitHub Pages.
- Zdroj dat bude lokální statický soubor s přepsaným programem.
- Současné screenshoty stačí na návrh aplikace a hrubou inicializaci dat.
- Pro finální přesné názvy některých událostí bude vhodná ruční kontrola, protože část textu na screenshotech je hůře čitelná.

## Doporučená architektura

### 1. Statická SPA bez frameworku

Jedna stránka, která po načtení:

1. načte program z lokálního datového modulu,
2. načte uloženou konfiguraci z cookie,
3. případně aplikuje sdílenou konfiguraci z URL parametru,
4. vyrenderuje:
   - přehled "co je teď / co je další",
   - seznam vybraných událostí,
   - celý program s možností kliknutí na výběr.

### 2. Datová vrstva oddělená od UI

Program musí být v samostatném souboru, aby šly události později upravit bez zásahu do render logiky.

Navržený tvar dat:

```js
const festivalData = {
  meta: {
    title: "Blavicon Planner",
    planSchemaVersion: 1,
    days: [
      { id: "thu", label: "Čtvrtek" },
      { id: "fri", label: "Pátek" },
      { id: "sat", label: "Sobota" }
    ],
    venues: [
      { id: "main-stage", label: "Hlavní stage" },
      { id: "alt-stage", label: "Alternativní stage a tribuny" }
    ]
  },
  events: [
    {
      id: "thu-official-1200",
      planIndex: 0,
      dayId: "thu",
      venueId: "main-stage",
      title: "Oficiální zahájení",
      type: "concert",
      start: "12:00",
      end: "12:15",
      defaultSelected: true
    }
  ]
};
```

Poznámky:

- `id` musí být stabilní a krátké.
- `planIndex` bude použit pro export/import a po zveřejnění aplikace se nesmí měnit bez zvýšení `planSchemaVersion`.
- `defaultSelected` použijeme pro převod zeleně označených položek do výchozího plánu.
- `type` umožní barevné rozlišení.
- Pokud nebude známé přesné datum festivalu, logika "další událost" pojede nad vybraným dnem a časem.
- Pokud budou později známé skutečné datumy, doplníme `date` a aplikace začne počítat "teď" podle reálného času.
- Pokud doplníme reálné datumy, budeme počítat podle časového pásma festivalu, tedy `Europe/Prague`.

### 3. Stav aplikace

Vnitřní stav bude jednoduchý objekt:

```js
const state = {
  selectedEventIds: new Set(),
  activeDayId: "thu",
  importedPlanCode: null
};
```

Pravidla inicializace stavu:

- priorita zdrojů bude `URL plan > cookie > defaultSelected`,
- import z URL vždy nahradí aktuální výběr, nebude se s ním slučovat,
- pokud nebudou známá reálná data festivalu, `activeDayId` se nastaví na první den s vybranou budoucí událostí, jinak na první den programu.

Další odvozené výpočty:

- `selectedEventsForDay`
- `selectedUpcomingEvents`
- `nextSelectedEvent`
- `activeConflicts`

## Persistenční strategie

### Proč neukládat celé JSON do cookie

Cookie má omezenou velikost, proto není vhodné ukládat celý objekt s názvy událostí.

### Doporučené řešení

Uložit jen seznam vybraných událostí v kompaktním kódu.

Navržené kódování:

- každá událost dostane explicitní `planIndex`,
- výběr se převede na bitové pole,
- bitové pole se zakóduje do `base64url`,
- před payload se přidá verze, např. `v1.abCdEf`.

To stejné použijeme pro:

- cookie,
- exportní textový řetězec,
- import přes URL parametr `?plan=v1.abCdEf`.

Výhody:

- krátký přenositelný formát,
- snadná verze dat,
- dobrá šance vejít se bezpečně do cookie limitu.

### Klíče

- cookie key: `blavicon_plan`
- URL parametr: `plan`

### Chování cookie

- cookie nastavíme s `path=/`,
- expirace bude dlouhá, například `max-age=31536000`,
- použijeme `SameSite=Lax`,
- pokud zápis do cookie selže nebo bude vypnutý, aplikace poběží dál bez persistence a zobrazí krátké upozornění.

## UI návrh

### Hlavní layout

Stránka bude mít tři hlavní bloky:

1. horní sticky panel,
2. přehled vybraného itineráře,
3. celý program po dnech a scénách.

### Sticky panel

Obsah:

- přepínač dne,
- souhrn "teď / další vybraná událost",
- tlačítko `Export`,
- tlačítko `Import`,
- tlačítko `Vymazat výběr`.

### Itinerář

Samostatná sekce s vybranými událostmi pro aktivní den:

- seřazené podle času,
- každá položka ukáže čas, scénu a název,
- zvýrazní právě probíhající událost,
- další nadcházející událost bude mít vlastní badge.

### Program

Dvě rozumné varianty:

1. tabulkový / timeline pohled,
2. jednodušší seznam po dnech a scénách.

Pro první implementaci doporučuji seznam po dnech a scénách, ne pixel-perfect repliku screenshotu.

Důvod:

- rychlejší a robustnější implementace,
- lepší čitelnost na mobilu,
- méně křehké CSS,
- snadnější klikání na výběr.

Každá událost bude karta nebo řádek s:

- názvem,
- časem,
- místem,
- typem,
- tlačítkem nebo checkboxem `Chci vidět`.

Prázdné stavy:

- pokud pro aktivní den nebude nic vybráno, itinerář zobrazí krátkou nápovědu,
- pokud po aktuálním čase už nebude nic následovat, panel ukáže poslední vybranou nebo informaci, že pro daný den je plán hotový.

### Konflikty

Pokud si uživatel označí dvě překrývající se události ve stejný čas, aplikace:

- je ponechá obě vybrané,
- ale viditelně označí konflikt.

To je důležité, protože screenshot už obsahuje osobní preference a reálně tam mohou vznikat kolize.

## Sdílení plánu

### Export

Export nabídne:

- samotný textový kód, např. `v1.abCdEf`,
- plný odkaz, např. `https://user.github.io/blavicon/?plan=v1.abCdEf`.

### Import

Import bude fungovat dvěma způsoby:

1. automaticky z URL parametru při otevření stránky,
2. ručně vložením textového kódu do inputu.

### Chování při importu z URL

Doporučené chování:

- pokud je v URL `plan`, aplikace ho rovnou aplikuje,
- uloží ho do cookie,
- zobrazí krátkou informaci, že byl načten sdílený plán.
- po úspěšném načtení může aplikace URL vyčistit přes `history.replaceState`, aby parametr nezůstával při dalším sdílení omylem zachovaný.

### Chování při nekompatibilním kódu

- pokud `planSchemaVersion` nesedí, aplikace import odmítne a zobrazí srozumitelnou chybu,
- pokud kód obsahuje indexy mimo známý dataset, ignoruje je a zaloguje nebo zobrazí varování,
- import nikdy nesmí rozbít render celé stránky.

## Doporučená struktura souborů

```text
/index.html
/styles.css
/app.js
/data/schedule.js
/docs/README.md
```

Role souborů:

- `index.html`: kostra stránky a mount body pro sekce.
- `styles.css`: layout, barevný systém, mobilní responzivita.
- `app.js`: stav, render, interakce, import/export, cookie logika.
- `data/schedule.js`: statická data programu.
- `docs/README.md`: uživatelské a editační pokyny.

Volitelně:

- `/docs/DATA_ENTRY.md`: pokud bude potřeba oddělit pokyny pro ruční úpravu festivalových dat.

## Implementační moduly v `app.js`

Praktické rozdělení funkcí:

- `loadScheduleData()`
- `loadPlanFromCookie()`
- `savePlanToCookie()`
- `encodePlan(selectedIds)`
- `decodePlan(code)`
- `applyImportedPlanFromUrl()`
- `getSelectedEvents(dayId)`
- `getNextSelectedEvent(nowContext)`
- `getConflicts(events)`
- `renderHeader()`
- `renderItinerary()`
- `renderSchedule()`
- `bindEvents()`

I když vše zůstane v jednom JS souboru, tohle členění udrží aplikaci čitelnou.

## UX pravidla

- Kliknutí na událost musí být obousměrné: vybrat / odebrat.
- Výběr musí být vizuálně jasný.
- Aktivní den musí být zřetelně odlišený.
- Mobil je prvořadý, desktop druhý.
- Export musí být snadno kopírovatelný jedním klikem.
- Import nesmí rozbít stránku při neplatném kódu; místo toho ukáže chybovou hlášku.

## Přístupnost a základní robustnost

- ovládací prvky budou skutečná `button`, `input` a `label`, ne klikatelné `div`,
- stránka musí být ovladatelná klávesnicí,
- vybraný stav nesmí být rozpoznatelný jen barvou, přidá se i textový nebo ikonický stav,
- kontrast textu a pozadí musí zůstat čitelný i na mobilu venku za denního světla,
- copy-to-clipboard dostane fallback pro prohlížeče, kde API nebude dostupné.

## Rizika a jak je ošetřit

### 1. Nečitelná část screenshotu

Riziko:

- některé názvy událostí budou při přepisu nepřesné.

Řešení:

- udělat datový soubor snadno editovatelný,
- v první verzi preferovat správné časy a místa,
- texty doladit ručně po implementaci.

### 2. Neznámé přesné datum festivalu

Riziko:

- "další událost" nejde navázat na skutečné datum a čas.

Řešení:

- v první verzi počítat "další" v rámci zvoleného dne,
- pokud doplníš skutečná data, stačí doplnit `date` k jednotlivým dnům.

### 3. Cookie limit

Riziko:

- při neefektivním formátu by se stav mohl nevejít.

Řešení:

- export i cookie ukládat jako bitset payload, ne JSON.

### 4. Změna datasetu po nasdílení odkazu

Riziko:

- po úpravě programu by starý export mohl ukazovat jiné události.

Řešení:

- použít `planSchemaVersion`,
- držet stabilní `planIndex`,
- při nekompatibilní verzi zobrazit jasnou chybu místo tichého poškození plánu.

## QA checklist pro implementaci

- první načtení bez cookie ukáže `defaultSelected` plán,
- refresh zachová výběr,
- import z `?plan=` nahradí lokální výběr,
- exportovaný kód po vložení obnoví stejný seznam vybraných akcí,
- konfliktní akce se vizuálně označí,
- neplatný import zobrazí chybu bez pádu stránky,
- layout zůstane čitelný na mobilní šířce i desktopu,
- aplikace funguje i při prázdném výběru.

## Doporučený implementační postup

1. Připravit statický layout a základní vizuální systém.
2. Založit datový soubor s dny, scénami a událostmi.
3. Přenést současně zeleně zvýrazněné položky do `defaultSelected`.
4. Implementovat render programu a výběr událostí.
5. Implementovat cookie persistenci.
6. Implementovat export/import kódu.
7. Doplnit logiku "další vybraná událost".
8. Přidat detekci konfliktů.
9. Ošetřit nekompatibilní import, cookie fallback a prázdné stavy.
10. Dopsat uživatelské pokyny do `docs/README.md`.

## Co udělám v druhém kroku

V implementačním kroku dodám:

- plně funkční statickou aplikaci,
- počáteční dataset podle screenshotu,
- cookie persistenci,
- export/import plánu,
- základní dokumentaci pro úpravy a nasazení na GitHub Pages.

## Rozhodnutí pro implementaci

Pro další krok doporučuji držet se těchto rozhodnutí:

- bez frameworku,
- bez build procesu,
- bez externích knihoven,
- první verze jako čitelný seznam, ne věrná grafická kopie screenshotu,
- sdílení přes `?plan=...`,
- perzistence přes cookie s kompaktním payloadem.
