# HotelManager PRO – redesign listy rezerwacji

Zadanie rekrutacyjne MasterBorn (Junior UX/UI Designer).

- **Opis projektu i prototyp:** https://jgarstecki.github.io/hotelmanager-redesign/ – strona startowa opisuje pracę i prowadzi do prototypu (także prosto do konkretnych scenariuszy). Z prototypu da się wrócić do opisu.
- **Analiza, proces i decyzje:** [docs/analiza.md](docs/analiza.md)
- **Oryginalny ekran:** https://masterborn-designer-task.figma.site/ (zakładka „Prototyp”)

## Teza w jednym zdaniu

Ekran „Rezerwacje” pokazywał pokoje zamiast rezerwacji. Po rozdzieleniu tych dwóch obiektów recepcjonista od razu odpowiada gościowi walk-in, czy jest miejsce, a pokój jest wynikiem wyszukiwania, nie punktem wyjścia.

## Co warto kliknąć

1. **Nowa rezerwacja** → zostaw daty dziś–jutro i ustaw 4 dorosłych + 2 dzieci. System zaproponuje dwa pokoje.
2. Dodaj zwierzę – propozycja przeskoczy na pokój przyjazny zwierzętom, cena wzrośnie o 60 zł.
3. Przejdź do płatności. Karta trafia na symulowany terminal (pod przyciskiem jest link do symulacji odmowy), gotówka liczy resztę.
4. Zakładka **Wyjazdy dziś** → Ewa Mazur ma nieopłacony pobyt. Wymeldowanie jest zablokowane, dopóki nie pobierzesz płatności.
5. Otwórz dowolną aktywną rezerwację → **Edytuj** → dodaj dziecko i zobacz dopłatę.
6. Najedź na numer pokoju w tabeli, żeby zobaczyć jego parametry.
7. Pod tytułem jest dyskretny pasek obłożenia – podgląd dla właściciela.

Dane są w pamięci, więc odświeżenie strony je resetuje.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) (Radix), lucide-react, date-fns. Zbudowane z Claude Code – podział pracy między mną a AI opisuje [docs/analiza.md](docs/analiza.md#1-proces).

```bash
npm install
npm run dev
```
