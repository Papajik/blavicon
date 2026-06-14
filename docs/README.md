# Event Planner

Statická webová aplikace pro GitHub Pages. `app.js` je obecný planner engine, konkrétní akce se popisuje jen daty v `data/<slug>/event.json`.

## Soubory

- `index.html`: generická kostra stránky.
- `styles.css`: layout a vzhled.
- `app.js`: načtení manifestu, validace datasetu, render, výběr akcí, import/export plánu.
- `data/events.json`: seznam dostupných akcí a výchozí slug.
- `data/<slug>/event.json`: kompletní konfigurace jedné akce včetně textů, assetů a programu.

## Co je v JSONu

Dataset má čtyři hlavní části:

- `app`: identita aplikace, locale, timezone, verze schématu, cookie key.
- `branding`: texty v horní části stránky.
- `assets`: volitelné toolbar akce typu odkazy na mapu nebo PDF.
- `ui`: všechny viditelné texty a aria šablony.
- `schedule`: časové rozpětí, dny, místa, typy akcí a samotné eventy.

Manifest `data/events.json` určuje:

- `defaultEventSlug`
- `events[]` se `slug`, `label`, cestou k datasetu a termínem `startsOn` / `endsOn`

Bez `?event=...` se jako výchozí otevře:

1. právě probíhající akce,
2. jinak nejbližší budoucí akce,
3. jinak `defaultEventSlug`

## Důležitá pravidla

- `schedule.days[].date` je povinné skutečné datum ve formátu `YYYY-MM-DD`.
- `events[].planIndex` je stabilní identifikátor pro export/import plánu.
- Pokud změníš význam starého `planIndex`, zvyš `app.planSchemaVersion`.
- `events[].dayId`, `venueId` a `type` musí odkazovat na existující položky v datasetu.

## Jak přidat jinou akci

1. Uprav `app`, `branding`, `assets` a `ui`.
2. Nahraď `schedule.days`, `schedule.venues`, `schedule.types` a `schedule.events`.
3. Zachovej unikátní `id` a `planIndex`.
4. Pokud staré odkazy už nemají sedět na nový dataset, zvyš `app.planSchemaVersion`.
5. Přidej záznam do `data/events.json`.

## Struktura složek

```text
data/
  events.json
  blavicon/
    event.json
    mapa.jpg
  slavnosti/
    event.json
```

Výběr akce je v patičce přes modal s kartami akcí. Karty se berou z `data/events.json`, takže tam patří i stručný `summary`, pokud ho chceš zobrazit.

Toolbar odkazy se definují v datasetu takto:

```json
{
  "assets": {
    "actions": [
      {
        "id": "map",
        "label": "Zobrazit mapu",
        "href": "./mapa.jpg",
        "newTab": true
      }
    ]
  }
}
```

`href` se vyhodnocuje relativně k umístění daného `event.json`.

Když akce žádné odkazy nepotřebuje, dej `assets.actions: []` nebo `assets` úplně vynech.

Planner nepotřebuje build krok. Pro GitHub Pages stačí statické soubory.

## Lokální spuštění

```bash
python3 -m http.server 8080
```

Pak otevři `http://localhost:8080/`.

## GitHub Pages

Publikace je pořád bez buildu:

1. push do repozitáře,
2. zapnout GitHub Pages nad rootem branch `main`,
3. ponechat statické soubory tak, jak jsou.
