# Blavicon Planner

Statická webová aplikace pro GitHub Pages, která zobrazuje festivalový program, umožňuje vybírat události, ukládá plán do cookie a umí ho exportovat jako krátký kód nebo sdílecí odkaz.

## Soubory

- `index.html`: základní struktura stránky.
- `styles.css`: layout, responzivita, barvy a stavy komponent.
- `app.js`: render, výběr událostí, výpočet další akce, cookie persistence a sdílení plánu.
- `data/schedule.js`: festivalová data a výchozí výběr.

## Jak aplikace funguje

- Aktivní den se přepíná přes horní lištu.
- Aktuální čas se bere automaticky podle `Europe/Prague` a průběžně se obnovuje.
- Výběr událostí se ukládá do cookie `blavicon_plan`.
- Export používá krátký kód ve formátu `v1....`.
- Import umí přijmout samotný kód i celý odkaz s parametrem `?plan=...`.
- Rozvrh scén je responzivní: na mobilu se posouvá horizontálně a levý sloupec s časem zůstává viditelný.
- Malé bloky v timetable otevřeš klepnutím do detailu; v detailu jde událost rovnou přidat nebo odebrat z plánu.

## Výchozí plán

- Položky označené v `data/schedule.js` jako `defaultSelected: true` odpovídají původnímu zeleně podbarvenému výběru ze screenshotu.
- Tlačítko `Výchozí plán` vrátí aplikaci do tohoto stavu.

## Úprava programu

Program upravuj v `data/schedule.js`.

Každá událost má:

- `id`: interní stabilní identifikátor.
- `planIndex`: stabilní index použitý v exportu/importu.
- `dayId`: den programu.
- `venueId`: scéna nebo místo.
- `title`: název události.
- `type`: `concert`, `performance`, `talk`, `tabletop`, `workshop`.
- `start` a `end`: čas ve formátu `HH:MM`.
- `defaultSelected`: jestli je položka ve výchozím osobním plánu.

Důležitá pravidla:

- `planIndex` po zveřejnění neměň, pokud zároveň nezvýšíš `meta.planSchemaVersion`.
- Když přidáš novou událost, dej jí nový dosud nepoužitý `planIndex`.
- Pokud upravíš staré indexy bez změny verze, staré sdílené odkazy začnou ukazovat špatné události.

## Přesnost dat

Aktuální dataset je přepsaný ze screenshotu programu. Většina položek sedí, ale část názvů a několik časů je zatím orientačních. Pokud dostaneš ostřejší PDF nebo lepší screenshot, oprav vše rovnou v `data/schedule.js`.

## Lokální spuštění

Kvůli ES modulům je lepší spouštět aplikaci přes jednoduchý lokální server.

Příklady:

```bash
python3 -m http.server 8080
```

nebo

```bash
npx serve .
```

Pak otevři `http://localhost:8080/`.

## GitHub Pages

Protože je aplikace čistě statická, stačí repozitář publikovat přes GitHub Pages bez build kroku.
V repu je připravený workflow `.github/workflows/deployment.yml` a soubor `CNAME` pro doménu `blavicon.papajik.cz`.

Nejjednodušší varianta:

1. pushnout soubory do repozitáře,
2. v GitHubu zapnout Pages pro branch `main`,
3. jako source nechat root adresář.

## Co případně doplnit později

- přesná kalendářní data festivalu pro skutečné "teď" podle dne,
- timeline pohled místo seznamu,
- druhý datový zdroj s finálním ručně ověřeným programem.
