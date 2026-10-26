# Surowa notatka – moje obserwacje przed użyciem AI

To jest moja notatka w oryginalnej formie, bez redakcji: tak, jak wkleiłem ją do Claude Code po sklonowaniu i przejrzeniu prototypu. Nie poprawiałem literówek ani składni. Uporządkowaną wersję z decyzjami opisuje [analiza.md](analiza.md).

---

Nielogiczna architektura: będąc w karcie Rezerwacje pokazują się też pokoje o innych statusach niż zajęte – a w zasadzie, to w ogóle nie powinno być tych konkretnych statusów, bo one dotyczą pokoi jako takich, a tu mamy rezerwacje. Naturalnie w tej karcie powinne być widoczne rekordy będące rezerwacjami zawierającymi odpowiednie szczegóły, w tym pokój jako atrybut. Biorąc pod uwagę możliwość stworzenia rezerwacji walk-in z tego poziomu, powinien być przycisk stworzenia rezerwacji i następnie flow, w którym jej się dokonuje podając szczegóły (podanie dat powinno pre-filtrować dostępne pokoje, które powinny być elementem końcowym). Warto przewidzieć możliwość rezerwacji dwóch pokoi w przypadku np. dwóch małżeństw lub rodziców z dziećmi, gdyby nie było już dostępnego pokoju 4-osobowego, a dwa 2-osobowe.

Myślę że wypada też, skoro to są wszystkie rezerwacje w systemie, żeby było podane źródło rezerwacji – np. strona internetowa, pośrednik, na miejscu (nazwy do przemyślenia).

Akcje: błędem było umieszczenie aktywnego przycisku rezerwuj nawet przy zajętych pokojach.  
W związku z tym, że proponuję inną architekturę systemu, powinna być jedynie możliwość wejścia w szczegóły rezerwacji oraz flow rezygnacji z rezerwacji (zwrotu kosztów, powodu, etc). W szczegółach rezerwacji niech będzie możliwość edycji.

Kolumny tabeli: id rezerwacji, nr pokoju, gość, tel, mail, daty, długość pobytu, cena całkowita wynajmu, metoda płatności, źródło rezerwacji uwagi, akcje.  
Wyrzucamy piętro, typ pokoju, bo one są parametrami pokoju i nie są potrzebne na tym poziomie operacji, ale dałbym podgląd tych detali na hoverze na wszelki wypadek aby umożliwić szybki dostęp do informacji, gdyby ktoś przy ladzie zapytał. Wyrzucamy także status – już wyjaśnione.  
W kolumnie gość zostawmy tylko imię i nazwisko.

W filtrach pozostanie nam zatem wyszukiwarka i dodajmy wybór źródła rezerwacji.

Teraz flow tworzenia rezerwacji. Przy ujęciu które proponuję, ten ekran stanie się tak naprawdę focal pointer. Zatem przy założonym scenariuszu przyjmowania gościa walk-in recepcjonista tworzy nową rezerwację klikając w przycisk. Otwiera mu się pop-up.  
Najpierw uwagi do obecnego stanu i co jest nie tak. Obecnie to pokój niepotrzebnie zabiera uwagę, ponieważ wybór na początku może krzyżować się z nadchodzącymi danymi takimi jak daty. Moim zdaniem powinien być produktem końcowym,

Wyobraźmy sobie sytuację, gdy wchodzi gość. „Dzień dobry, czy macie jakieś wolne pokoje?” – to już jest pierwsza rzecz dla użytkownika do poinformowania (o gotowości i wydolności systemu). Aby udzielić dobrej odpowiedzi dopyta „Dzień dobry. Na ile nocy (zakres dat - input z kalendarzem, w którym jest zaznaczanie dni oraz informacja o ilości dni) i dla ilu osób państwo potrzebują?”. Wyobrażam sobie, że po pytaniu od gościa, user klika w przycisk nowa rezerwacja. Aby móc udzielić odpowiedzi potrzebuje tych dwóch informacji, aby system sprawdził dostępność pokojów. Dopiero wtedy można odpowiedzieć, czy rezerwacja jest możliwa, bo system proponuje pokój/pokoje, najlepiej automatycznie, ale z możliwością ręcznej zmiany z listy pokoi, które są dostępne wg wymogów rezerwacji. Wtedy

dopiero potrzebujemy wprowadzić dane: imię, nazwisko, drop-down z wyborem dokumentu potwierdzającego tożsamość oraz numer tego dokumentu, nr tel, email oraz miejsce na uwagi.

I tutaj pozostawiam jedyne pytanie wprost, przy którym zdam się na AI: jak rozwiązać zakończenie procesu rezerwacji? Nie znam powszechnych praktyk. Chodzi mi o to jak powinna wyglądać finalizacja rezerwacji pod kątem płatności. Czy jeśli wybierzemy metodę płatności gotówką, to program jest zsynchronizowany z kasą? to samo z terminalem płatniczym? nie mam pojęcia jak to działa realnie. Ale chyba nie chcę robić możliwości istnienia rezerwacji nieopłaconych. Czyli rezerwacje , aby widniały w systemie muszą być opłacone. Jeśli nie są, to nie istnieją.

Grupa przycisków „nowa rezerwacja”, „drukuj”…:  
Umieść je w linii z ACME CORP HOTEL, ale z alignem do prawej strony. Pozostaw priimary „nowa rezerwacja”, „drukuj”, „pobierz” z wyborem rodzaju pliku, „odśwież” też niech zostanie w razie czego. Czyli usuwamy przyciski „excel” i „pdf” i zamiast nich dajemy jeden.

Co do UI: Użyj dostępnego na rynku darmowego UI kitu, aby projekt był spójny. Wprowadź redesign tak, aby po lewej był sidebar z nawigacją (obecne taby u góry - start, rezerwacje, pokoje…) oraz logo/nazwą systemu, danymi profilu użytkownika oraz wersją systemu itd.

---

## Polecenie, które dopisałem do notatki

To jest moja notatka i mój realny wkład analityczny. Chcę, aby moje obserwacje były przedstawione bardziej składnie i krócej wypisane, aby reviewer zadania widział ile mojej ekspertyzy się w tym znajduje i że nie użyłem AI do wykonania całego zadania zamiast mnie. Potrzebuję też nakreślenia mojego planu na to zadanie. Czyli sklonowanie, stress test na wszelki wypadek, luźne wypisanie obserwacji i rozwiązań, przekazanie tobie notatki do jej ustrukturyzowania, zrozumienie tego, czy ty dobrze mnie zrozumiałeś, prośba o stworzenie działającego prototypu na podstawie moich zaleceń i iteracja w razie potrzeby poprawek lub gdyby pojawiły się moje nowe obserwacje. Reviewer musi wiedzieć, że to jest świadomy proces redesignu i dokładne miejsca gdzie zaplanowałem użycie AI. Projektując skorzystaj z wgranych przeze mnie skill – i o tym też napisz w podsumowaniu, że ci to zleciłem i że je posiadam. Projekt stwórz jako nowe repo na GitHub, które udostępnimy jako GitHub sites.

Wskaż też moje blind spots (ale sam nic nie zmieniaj!) i oceń moją pracę
