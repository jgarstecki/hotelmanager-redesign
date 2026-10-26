# HotelManager PRO – analiza i plan redesignu

> Analiza pochodzi z mojej odręcznej notatki, spisanej bez AI po przejściu przez prototyp.
> AI (Claude Code) pomogło ją uporządkować i skrócić, nie dodając własnych wniosków. Wszędzie, gdzie AI coś doradziło albo zdecydowało, jest to wyraźnie zaznaczone.

---

## 1. Proces

| # | Krok | Kto | Po co |
|---|------|-----|-------|
| 1 | Sklonowanie prototypu do lokalnej, izolowanej wersji | AI na moje polecenie | Pracuję na działającym kodzie, a nie na zrzutach ekranu |
| 2 | Stress test: 8 → 46 rekordów z przypadkami brzegowymi | AI generuje dane, ja ustalam, co ma się w nich znaleźć | Sprawdzam ekran przy realnym hotelu (do 50 pokoi), a nie przy 8 wierszach |
| 3 | Obserwacje i propozycje rozwiązań | **ja, bez AI** | Rdzeń analizy |
| 4 | Uporządkowanie notatki | AI | Krótsza i czytelniejsza forma, ta sama treść |
| 5 | Sprawdzenie, czy AI dobrze mnie zrozumiało | ja + AI | AI streściło swoje rozumienie, wskazało luki, a ja zdecydowałem, co z tego biorę (szczegóły w sekcji 7) |
| 6 | Działający prototyp według moich zaleceń | AI buduje, ja prowadzę i akceptuję | Kod to tylko narzędzie – liczy się to, czy rozwiązanie broni tezy |
| 7 | Iteracje | ja + AI | Poprawki i nowe obserwacje po klikaniu w prototyp |

Podział jest celowy. Brief nie narzucał stacku, więc AI traktuję jak narzędzie wykonawcze: analiza i decyzje są moje, implementacja należy do modelu.

**Narzędzia:** Claude Code i shadcn/ui. Przy projektowaniu AI korzystało z moich własnych, zainstalowanych skilli (instrukcji dla modelu), których użycie mu zleciłem:

- `ux-heuristics-review` – 10 heurystyk Nielsena
- `cognitive-load-conversion` – ograniczanie obciążenia poznawczego
- `craft` – detale wizualne, stany, typografia
- `accessibility` – WCAG 2.1 AA
- `copy-voice` – mój styl pisania w tym dokumencie

---

## 2. Główny problem

**Ekran „Rezerwacje” pokazuje pokoje, a nie rezerwacje. Przez to nie da się ani sprawnie zarządzać rezerwacjami, ani szybko odpowiedzieć gościowi walk-in, czy jest wolny pokój na jego daty.**

Wszystko inne – kolumny, akcje, filtry i flow tworzenia – wynika z tego jednego błędu w modelu danych.

---

## 3. Co jest nielogiczne

**Architektura**
- Zakładka „Rezerwacje” miesza dwa obiekty: pokój i rezerwację. Statusy WOLNY / SPRZATANIE / NAPRAWA opisują pokój, nie rezerwację.
- Wiersz powinien być rezerwacją, a pokój – jednym z jej atrybutów.

**Akcje w wierszu**
- Przycisk „R” (rezerwuj) jest aktywny także przy pokojach zajętych.
- „R” i „E” robią dokładnie to samo.

**Flow nowej rezerwacji**
- Formularz zaczyna od wyboru pokoju, a ten może kłócić się z datami podanymi później. Pokój powinien być **wynikiem**, nie punktem wyjścia.
- Brak źródła rezerwacji (strona, pośrednik, na miejscu).
- Nie da się zarezerwować kilku pokoi naraz (np. dwie pary albo rodzice z dziećmi, gdy nie ma wolnego pokoju 4-osobowego, ale są dwa 2-osobowe).

## 4. Co jest tylko mało estetyczne

- Toolbar wisi nad wszystkim jako osobny pas, a „Excel” i „PDF” to dwa przyciski do jednej czynności.
- Nawigacja w poziomych tabach, a dane użytkownika i wersja systemu rozrzucone po nagłówku.
- Brak spójnego systemu wizualnego.

---

## 5. Rozwiązanie (zbudowane)

**Lista rezerwacji**
- Wiersz = rezerwacja. Kolumny: nr rezerwacji · pokój · gość · telefon · e-mail · daty · liczba nocy · kwota · płatność · źródło · status · uwagi · akcje.
- Usunięte: piętro, typ pokoju, status pokoju. Piętro, typ, miejsca i cena bazowa są widoczne w podglądzie po najechaniu na numer pokoju (także z klawiatury), na wypadek pytania przy ladzie.
- W kolumnie „Gość” tylko imię i nazwisko.
- Filtry: wyszukiwarka, termin pobytu, źródło, status rezerwacji i status płatności (opłacona / do zapłaty / częściowo / zwrot).
- Nad tabelą zakładki z najczęstszymi widokami recepcji: Aktywne · Przyjazdy dziś · Wyjazdy dziś · W hotelu · Archiwum · Wszystkie.
- Akcje: szczegóły (z edycją w środku) i anulowanie z powodem oraz zwrotem.
- Akcje w jednej linii z tytułem, po prawej: Odśwież · Drukuj · Pobierz (CSV / PDF) · **Nowa rezerwacja**.
- Sidebar: logo i nazwa systemu, hotel, nawigacja, profil, wersja, język.

**Perspektywa właściciela – pasek obłożenia**

Odpowiedź na drugiego użytkownika z briefu: właściciel chce szybko zobaczyć, jak zajęty jest hotel. Pod tytułem jest jedna dyskretna linia:

- obłożenie dziś (np. 18/46 · 39%) z cienkim paskiem,
- mini-wykres najbliższych 7 dni (dokładne wartości po najechaniu),
- liczba pokoi w naprawie i w sprzątaniu.

Celowo jest to narzędzie do ogólnego podglądu, a nie dashboard: szare, małe, bez kolorów alarmowych i bez interakcji. Nie konkuruje z listą rezerwacji, która jest głównym zadaniem recepcjonisty. Pełne raporty obłożenia zostają w zakładce „Raporty”.

**Nowa rezerwacja – walk-in**
1. Gość: „Czy macie wolne pokoje?” → recepcjonista klika **Nowa rezerwacja**.
2. **Daty** (kalendarz z zakresem i liczbą nocy) i **goście**: dorośli, dzieci 3–12, niemowlęta (łóżeczko), zwierzęta. System **od razu odpowiada**: „Tak, mamy miejsce, proponuję pokój X za Y zł” albo „Brak miejsca dla tej grupy”.
3. **Pokój jest wynikiem.** System proponuje jeden pokój, a gdy żaden nie pomieści grupy – dwa. Recepcjonista może wybrać inne z listy wolnych, także kilka naraz, i rozłożyć gości między pokoje.
4. **Dane gościa:** imię, nazwisko, rodzaj i numer dokumentu, telefon, e-mail, uwagi.
5. **Płatność** – rezerwacja zapisuje się dopiero po opłaceniu (sekcja 6).

**Szczegóły rezerwacji**
- Każdy pokój osobno: skład gości (dorośli, dzieci, niemowlęta, zwierzęta), dostawka, łóżeczko i rozbicie ceny. Całość podsumowana kwotą łączną.
- Cennik w prototypie: cena pokoju obejmuje 1, 2 lub 4 osoby zależnie od typu. Dodatkowy dorosły +90 zł/noc, dziecko 3–12 +50 zł/noc, zwierzę +60 zł/noc, łóżeczko gratis.
- Edycja składu gości przelicza cenę na żywo i pokazuje dopłatę.
- Akcje cyklu pobytu: **Zamelduj** i **Wymelduj**. Wymeldowanie jest zablokowane, dopóki nie zostanie pobrana dopłata (oprócz faktur z terminem).

---

## 6. Płatność – zapytałem AI o radę

Nie znałem praktyki rynkowej, więc wprost zapytałem AI, jak systemy hotelowe (PMS) domykają rezerwację płatnością.

**Odpowiedź AI w skrócie:**
- **Karta:** PMS jest zintegrowany z terminalem. Kwota trafia na terminal, a system czeka na potwierdzenie i sam oznacza płatność.
- **Gotówka:** wpłata rejestrowana w kasie recepcji, z wyliczeniem reszty. W Polsce usługa noclegowa dla osoby prywatnej wymaga paragonu fiskalnego z drukarki zintegrowanej z PMS.
- **Przelew / faktura:** rezerwacja istnieje ze statusem „do zapłaty” – firmy, grupy.
- **Pośrednicy (np. Booking.com):** często płatność na miejscu albo rozliczenie przez pośrednika.

**Co przyjąłem:**
- Walk-in = nieopłacona rezerwacja nie istnieje. Karta przechodzi przez symulowany terminal (z możliwością odrzucenia), gotówka przez kwotę otrzymaną, resztę i paragon.
- Pozostałe źródła mogą mieć status „do zapłaty” albo „częściowo”, a domyka je dopłata przed wymeldowaniem. To pętla zwrotna płatności, która łączy się ze statusami rezerwacji.

---

## 7. Decyzje po weryfikacji z AI

Po kroku 5 AI wskazało luki w mojej notatce. Część przyjąłem, część świadomie odłożyłem:

| Temat | Decyzja |
|-------|---------|
| Filtr dat i statusy rezerwacji | **Przyjęte** – filtr terminu, zakładki widoków, a potem na moją prośbę osobne filtry statusu rezerwacji i statusu płatności |
| Skład gości i wpływ na cenę | **Dodałem od siebie** – dorośli / dzieci / niemowlęta / zwierzęta, dostawka i łóżeczko, rozbicie ceny |
| Perspektywa właściciela (szybki przegląd obłożenia) | **Przyjęte po przemyśleniu** – AI zaproponowało pasek obłożenia, a ja ustaliłem formę: skromny, wyciszony, tylko do ogólnego podglądu, bez odciągania uwagi od listy |
| UI kit | shadcn/ui – oszczędność czasu i gotowe, sprawdzone rozwiązania: rozmiary, odstępy, kontrast i dostępność (WCAG). Poprawki czytelności, np. tekst statusu 7,68 px → 12 px, wynikają wprost z kitu |

**Decyzje wykonawcze AI** (do mojej akceptacji, łatwe do zmiany):
- Żeby 12 kolumn zmieściło się na laptopie (1440 px) bez przewijania w bok, AI połączyło powiązane dane w dwuwierszowe komórki: gość + uwagi, telefon + e-mail, daty + liczba nocy. Wszystkie dane z mojej listy są widoczne.
- Główny przycisk „Nowa rezerwacja” stoi jako ostatni po prawej – zgodnie z konwencją, że akcja główna jest na końcu grupy.
- Pokój w trakcie sprzątania jest proponowany tylko wtedy, gdy jest wyraźnie tańszy, i zawsze z informacją „gotowy ok. 15:00”.

---

## 8. Ograniczenia prototypu

- Dane żyją w pamięci przeglądarki – odświeżenie strony przywraca stan początkowy.
- Terminal, drukarka fiskalna i zwroty są symulowane.
- Zmiana dat lub pokoju w istniejącej rezerwacji jest poza zakresem – edytowalne są skład gości, dane kontaktowe i uwagi.
- Ekran projektowany na desktop recepcji. Na wąskich ekranach sidebar się chowa.
- Data „dziś” jest stała (28.12.2024), tak jak w oryginalnym prototypie.
