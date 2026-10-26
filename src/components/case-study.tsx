import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, BedDouble, CalendarRange, Check, CreditCard, Gauge, Lightbulb, Undo2, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shot = (name: string) => `${import.meta.env.BASE_URL}shots/${name}`;
const REPO = "https://github.com/jgarstecki/hotelmanager-redesign";

const ILLOGICAL = [
  "Zakładka „Rezerwacje” miesza pokoje z rezerwacjami – statusy wolny / sprzątanie / naprawa opisują pokój, nie rezerwację.",
  "„R” (rezerwuj) jest aktywne także przy zajętych pokojach, a „R” i „E” robią to samo.",
  "Formularz zaczyna od wyboru pokoju, który potem kłóci się z datami.",
  "Brak źródła rezerwacji i brak rezerwacji na kilka pokoi naraz.",
];

const UNPOLISHED = [
  "Toolbar jako osobny pas, a „Excel” i „PDF” to dwa przyciski do jednej czynności.",
  "Poziome taby, a profil i wersja systemu rozrzucone po nagłówku.",
  "Brak spójnego systemu: Times obok Ariala, status pisany 7,7 px, narysowany pasek przewijania.",
];

/** Brief requirements mapped to where the answer lives on this page or in the prototype. */
const BRIEF: { ask: string; answer: string; href: string }[] = [
  { ask: "Analiza: co nielogiczne, co mało estetyczne, jeden główny problem", answer: "Dwie listy i problem w jednym zdaniu", href: "#/?s=punkt-wyjscia" },
  { ask: "Działający redesign w przeglądarce z kluczową funkcją", answer: "Przyjęcie gościa walk-in – od pytania o miejsce do płatności", href: "#/prototyp?s=walkin" },
  { ask: "Recepcjonista pod presją czasu", answer: "Odpowiedź o dostępności po dwóch polach", href: "#/prototyp?s=walkin-group" },
  { ask: "Właściciel – szybki przegląd obłożenia", answer: "Wyciszony pasek obłożenia nad listą", href: "#/prototyp" },
  { ask: "Jak sterujesz modelem i jakie poprawki wymuszasz", answer: "Podział pracy i lista poprawek", href: "#/?s=proces" },
];

/** Original vs. redesign, row by row – the core of the task. */
const BEFORE_AFTER: { area: string; before: string; after: string }[] = [
  { area: "Wiersz tabeli", before: "Pokój ze statusem wolny / zajęty / sprzątanie / naprawa", after: "Rezerwacja – pokój jest jej atrybutem" },
  { area: "Kolumny", before: "Piętro i typ pokoju w tabeli, brak źródła rezerwacji", after: "Piętro i typ po najechaniu na nr pokoju, dodane źródło, kwota i płatność" },
  { area: "Akcje w wierszu", before: "„R” i „E” robią to samo, „R” aktywne przy zajętych pokojach, „U” usuwa po systemowym okienku", after: "Szczegóły z edycją i anulowanie z powodem oraz zwrotem" },
  { area: "Filtry", before: "Szukaj, piętro, checkboxy statusu pokoju, daty wpisywane jako tekst", after: "Szukaj, termin z kalendarza, źródło, status rezerwacji, płatność" },
  { area: "Nowa rezerwacja", before: "Zaczyna od wpisania nr pokoju, daty i cena za noc wpisywane ręcznie", after: "Termin i goście → odpowiedź o dostępności → pokój proponowany przez system, także kilka naraz" },
  { area: "Obłożenie", before: "Trzeba policzyć kolorowe statusy w tabeli", after: "Jedna wyciszona linia: dziś, najbliższe 7 dni, pokoje wyłączone" },
  { area: "Przyciski", before: "Osobny pas: Nowa rezerwacja, Drukuj, Excel, PDF, Odśwież", after: "W linii z tytułem: Odśwież, Drukuj, Pobierz (CSV / PDF), Nowa rezerwacja" },
  { area: "Nawigacja i wygląd", before: "Poziome taby, Times obok Ariala, status 7,7 px", after: "Sidebar z profilem i wersją, spójny UI kit (shadcn/ui), tekst min. 12 px" },
];

/** Corrections I forced on the model after clicking through its output. */
const CORRECTIONS = [
  "Szczegóły rezerwacji z panelu bocznego wróciły do okna, jak w oryginale – zmiana wzorca niczego nie naprawiała.",
  "Komunikat o dostępności: zamiast „Tak, mamy miejsce… proponuję pokój 204” – rzeczowo: rezerwacja dostępna, liczba wolnych pokoi, zakres cen.",
  "Pasek obłożenia: skromna, wyciszona forma, która nie odciąga uwagi od listy rezerwacji.",
  "Brakujące filtry statusu i płatności obok wyszukiwarki, źródła i terminu.",
  "Skład gości w szczegółach: dorośli, dzieci, łóżeczko, zwierzęta i ich wpływ na cenę.",
];

const APPROACH = [
  { title: "Zaczynam od sceny przy ladzie", body: "Pierwsze, co recepcjonista musi zrobić, to odpowiedzieć, czy jest miejsce – więc system ma to umieć, zanim ktokolwiek wpisze nazwisko." },
  { title: "Najpierw przyczyna, potem objawy", body: "Złe kolumny, akcje i formularz miały jedno źródło: pomylenie pokoju z rezerwacją. Poprawiłem model danych, reszta ułożyła się z niego." },
  { title: "Oddzielam logikę od estetyki", body: "Analizę skupiłem na tym, co nielogiczne. Estetykę rozwiązuje spójny UI kit, więc nie projektowałem komponentów od zera." },
];

type Change = { icon: typeof Users; title: string; body: string; scenario: string; cta: string };

const CHANGES: Change[] = [
  { icon: CalendarRange, title: "Wiersz to rezerwacja", body: "Pokój jest atrybutem rezerwacji, piętro i typ są pod numerem pokoju po najechaniu.", scenario: "group", cta: "Rezerwacja na 4 pokoje" },
  { icon: BedDouble, title: "Walk-in: pokój na końcu", body: "Termin i liczba gości wystarczą do odpowiedzi. System proponuje pokój, a gdy jeden nie wystarcza – dwa.", scenario: "walkin-group", cta: "4 dorosłych i 2 dzieci" },
  { icon: Users, title: "Skład gości i cena", body: "Dorośli, dzieci, łóżeczko, zwierzęta – zmiana składu przelicza cenę i pokazuje dopłatę.", scenario: "edit", cta: "Edytuj rezerwację" },
  { icon: CreditCard, title: "Płatność domyka rezerwację", body: "Walk-in zapisuje się po opłaceniu, a nieopłacony pobyt wstrzymuje wymeldowanie.", scenario: "checkout", cta: "Wymeldowanie z dopłatą" },
  {
    icon: Undo2,
    title: "Anulowanie z powodem i zwrotem",
    body: "Usunięcie rezerwacji ma konsekwencje: gość mógł już zapłacić, a pokój wraca do sprzedaży. Dlatego zamiast pytania „usunąć?” – powód i decyzja o zwrocie pieniędzy.",
    scenario: "cancel",
    cta: "Anuluj opłaconą rezerwację",
  },
  { icon: Gauge, title: "Obłożenie dla właściciela", body: "Jedna wyciszona linia: dziś, najbliższe 7 dni i pokoje wyłączone ze sprzedaży.", scenario: "", cta: "Zobacz listę" },
];

type Step = { who: "Ja" | "AI" | "Ja + AI"; title: string; body: string; link?: { href: string; label: string } };

const PROCESS: Step[] = [
  { who: "AI", title: "Kopia prototypu", body: "lokalna wersja oryginału do testów, na moje polecenie." },
  { who: "AI", title: "Stress test", body: "myślę obrazem, więc chciałem zobaczyć produkt pod realnym obciążeniem – 46 rekordów zamiast 8 podsunęło mi pomysły." },
  { who: "Ja", title: "Analiza", body: "obserwacje i rozwiązania spisałem sam, bez AI.", link: { href: `${REPO}/blob/main/docs/notatka-surowa.md`, label: "Surowa notatka" } },
  { who: "Ja + AI", title: "Weryfikacja", body: "AI uporządkowało notatkę i wskazało luki, ja zdecydowałem, co przyjmuję." },
  { who: "AI", title: "Prototyp", body: "budowa według moich zaleceń." },
  { who: "Ja", title: "Iteracje", body: "przeklikanie każdej wersji i poprawki poniżej." },
];

const SKILLS = ["ux-heuristics-review", "cognitive-load-conversion", "craft", "accessibility", "copy-voice"];

// Links into the prototype open in a new tab, so the reader keeps their place here.
const newTab = { target: "_blank", rel: "noreferrer" } as const;

function go(scenario: string) {
  return scenario ? `#/prototyp?s=${scenario}` : "#/prototyp";
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

const TOC = [
  { id: "start", label: "Wstęp" },
  { id: "brief", label: "Brief" },
  { id: "punkt-wyjscia", label: "Co było nie tak" },
  { id: "proces", label: "Jak pracowałem" },
  { id: "co-zmienilem", label: "Co zmieniłem" },
  { id: "sprawdz", label: "Sprawdź prototyp" },
];

/** Right-hand table of contents – shows what's ahead and where the reader is. */
function Toc() {
  const [active, setActive] = useState(TOC[0].id);

  useEffect(() => {
    const onScroll = () => {
      // The last section whose top has passed the upper third of the viewport is the current one.
      let current = TOC[0].id;
      for (const { id } of TOC) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = TOC[TOC.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav aria-label="Spis treści" className="sticky top-14 pt-16 sm:pt-24">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Na tej stronie</p>
      <ol className="mt-3 border-l">
        {TOC.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#/?s=${id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
              aria-current={active === id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active === id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CaseStudy({ section }: { section: string | null }) {
  useEffect(() => {
    if (section) requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView());
  }, [section]);

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl xl:max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="text-sm leading-tight">
            <span className="font-semibold">Jan Garstecki</span>
            <span className="hidden text-muted-foreground sm:inline"> · zadanie rekrutacyjne MasterBorn</span>
          </div>
          <a href={go("")} {...newTab} className={buttonVariants({ size: "sm" })}>
            Otwórz prototyp <ArrowUpRight className="size-4" aria-hidden />
            <span className="sr-only">(otwiera się w nowej karcie)</span>
          </a>
        </div>
      </header>

      {/* Below xl the TOC is hidden – the page then reads top to bottom as before. */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 xl:grid xl:max-w-7xl xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-16">
      <main className="min-w-0">
        {/* Hero */}
        <section id="start" className="scroll-mt-20 pt-16 pb-12 sm:pt-24">
          <p className="text-sm font-medium text-primary">HotelManager PRO · redesign listy rezerwacji</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.15] font-semibold tracking-tight sm:text-5xl">
            <span className="block">
              <span className="sr-only">Gość: </span>„Dzień dobry, czy macie jakieś wolne pokoje?”
            </span>
            <span className="mt-3 block text-muted-foreground">
              <span className="sr-only">Recepcja: </span>„Na ile nocy i dla ilu osób?”
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Od tej rozmowy zacząłem redesign. Recepcjonista nie odpowie gościowi bez terminu i liczby osób – a oryginał zaczynał od wyboru pokoju. Rozmowa ustaliła kolejność zadań: najpierw odpowiedź o dostępności, potem pokój, dane gościa i płatność.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={go("")} {...newTab} className={buttonVariants({ size: "lg" })}>
              Otwórz prototyp <ArrowUpRight className="size-4" aria-hidden />
            <span className="sr-only">(otwiera się w nowej karcie)</span>
            </a>
            <button type="button" onClick={() => scrollTo("proces")} className={buttonVariants({ size: "lg", variant: "outline" })}>
              Jak pracowałem
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Czas pracy: ok. 3–3,5 h · analiza moja, wykonanie z Claude Code · działa bez logowania</p>

          <Figure src={shot("walkin.png")} alt="Nowa rezerwacja na tle listy rezerwacji: kalendarz, liczba gości i odpowiedź systemu – rezerwacja dostępna, liczba wolnych pokoi i zakres cen." caption="Odpowiedź na pytanie gościa pojawia się po dwóch polach, zanim padnie wybór pokoju." className="mt-14" />
        </section>

        {/* Brief */}
        <Section id="brief" eyebrow="Brief" title="Wymagania i odpowiedzi" >
          <ul className="divide-y rounded-xl border bg-card">
            {BRIEF.map((b) => (
              <li key={b.ask}>
                <a
                  href={b.href}
                  {...(b.href.startsWith("#/prototyp") ? newTab : {})}
                  onClick={(e) => {
                    if (b.href.startsWith("#/?s=")) {
                      e.preventDefault();
                      scrollTo(b.href.slice(5));
                    }
                  }}
                  className="grid gap-1 px-5 py-4 text-sm transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:grid-cols-[1.25rem_1fr_1fr_1rem] sm:items-center sm:gap-4"
                >
                  <Check className="hidden size-4 text-primary sm:block" aria-hidden />
                  <span className="text-muted-foreground">{b.ask}</span>
                  <span className="font-medium">{b.answer}</span>
                  {b.href.startsWith("#/prototyp") ? (
                    <>
                      <ArrowUpRight className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
                      <span className="sr-only">(otwiera się w nowej karcie)</span>
                    </>
                  ) : (
                    <ArrowRight className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </Section>

        {/* Starting point */}
        <Section id="punkt-wyjscia" eyebrow="Punkt wyjścia" title="Co było nie tak">
          <Figure src={shot("before.png")} alt="Oryginalny ekran: lista pokoi ze statusami wolny, zajęty, sprzątanie i naprawa, przyciski R, E, U." caption="Oryginał – 8 pokoi udających listę rezerwacji." />
          <p className="mt-10 pl-5 text-sm font-medium text-muted-foreground">Problem</p>
          <blockquote className="mt-2 border-l-2 border-primary pl-5 text-xl leading-snug font-medium text-balance">
            Ekran „Rezerwacje” pokazuje pokoje zamiast rezerwacji, więc recepcjonista nie zarządzi sprawnie rezerwacjami ani nie powie szybko gościowi walk-in, czy jest miejsce na jego daty.
          </blockquote>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <List title="Nielogiczne" items={ILLOGICAL} />
            <List title="Tylko mało estetyczne" items={UNPOLISHED} />
          </div>
          <h3 className="mt-14 font-semibold">Jak do tego podszedłem</h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {APPROACH.map((a) => (
              <li key={a.title} className="rounded-xl border bg-card p-5">
                <p className="font-medium">{a.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Process */}
        <Section id="proces" eyebrow="Proces" title="Jak pracowałem" lead="Analiza i decyzje są moje, implementację wykonał Claude Code. Całość zajęła ok. 3–3,5 h.">
          <ol className="grid gap-px overflow-hidden rounded-xl border bg-border">
            {PROCESS.map((s, i) => (
              <li key={s.title} className="grid gap-1 bg-card p-5 sm:grid-cols-[2.5rem_7rem_1fr] sm:items-baseline sm:gap-4">
                <span className="tabular text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      s.who === "Ja" ? "bg-primary text-primary-foreground ring-primary" : s.who === "AI" ? "bg-muted text-muted-foreground ring-border" : "bg-accent text-accent-foreground ring-border",
                    )}
                  >
                    {s.who}
                  </span>
                </span>
                <span>
                  <span className="font-medium">{s.title}</span>
                  <span className="text-muted-foreground"> – {s.body}</span>
                  {s.link && (
                    <>
                      {" "}
                      <a
                        href={s.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm font-medium whitespace-nowrap text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {s.link.label} <ArrowUpRight className="size-3.5" aria-hidden />
                        <span className="sr-only">(otwiera się w nowej karcie)</span>
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <h3 className="font-semibold">Poprawki, które wymusiłem</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Odsyłałem wersje, które odbiegały od analizy albo zmieniały coś bez powodu.</p>
            <ul className="mt-4 grid gap-2.5 text-sm leading-relaxed text-muted-foreground">
              {CORRECTIONS.map((c) => (
                <li key={c} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-primary uppercase">
                <Lightbulb className="size-4" aria-hidden /> Insight
              </p>
              <h3 className="mt-3 font-semibold">Zapytałem AI o radę</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Nie znałem praktyki płatności w hotelach, więc zapytałem zamiast zgadywać. Wziąłem model z terminalem, kasą fiskalną i statusem „do zapłaty” dla faktur i pośredników – przy mojej
                zasadzie, że nieopłacony walk-in nie istnieje.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                Efekt: płatność stała się częścią cyklu pobytu. Otwartą kwotę widać na liście, a wymeldowanie czeka na jej pobranie.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">Skille dla AI</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Zleciłem projektowanie ze skillami – część napisałem sam, część to gotowe skille, które miałem wcześniej zainstalowane. Heurystyki, WCAG i detale wizualne były dzięki nim wymaganiem od
                pierwszej wersji.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <li key={s} className="rounded-md border bg-muted px-2 py-1 font-mono text-xs">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Changes with deep links */}
        <Section id="co-zmienilem" eyebrow="Rozwiązanie" title="Co zmieniłem względem oryginału" lead="Zakres to jeden ekran – lista rezerwacji i jej okna. Reszty aplikacji nie projektowałem.">
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Porównanie oryginału z redesignem</caption>
              <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="w-40 px-4 py-3 font-medium">Obszar</th>
                  <th scope="col" className="px-4 py-3 font-medium">Oryginał</th>
                  <th scope="col" className="px-4 py-3 font-medium">Po redesignie</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {BEFORE_AFTER.map((r) => (
                  <tr key={r.area} className="align-top">
                    <th scope="row" className="px-4 py-3 font-medium">{r.area}</th>
                    <td className="px-4 py-3 leading-relaxed text-muted-foreground">{r.before}</td>
                    <td className="px-4 py-3 leading-relaxed">{r.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Ograniczenia prototypu: dane żyją w pamięci (odświeżenie je resetuje), terminal i drukarka fiskalna są symulowane, ekran projektowany na desktop recepcji.
          </p>

          <h3 className="mt-14 font-semibold">Zobacz w prototypie</h3>
          <p className="mt-1 text-sm text-muted-foreground">Każda karta otwiera prototyp w nowej karcie, od razu w miejscu zmiany.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHANGES.map((c) => (
              <article key={c.title} className="flex flex-col rounded-xl border bg-card p-5">
                <c.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <a
                  href={go(c.scenario)}
                  {...newTab}
                  className="mt-5 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {c.cta} <ArrowUpRight className="size-4" aria-hidden />
                  <span className="sr-only">(otwiera się w nowej karcie)</span>
                </a>
              </article>
            ))}
          </div>
        </Section>

        {/* Closing CTA */}
        <section id="sprawdz" className="my-20 scroll-mt-24 rounded-2xl bg-foreground px-6 py-12 text-background sm:px-12">
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance">Najlepiej sprawdzić to samemu – zacznij od gościa, który pyta o wolny pokój.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={go("walkin")} {...newTab} className={cn(buttonVariants({ size: "lg" }), "bg-background text-foreground hover:bg-background/90")}>
              Przyjmij gościa walk-in <ArrowUpRight className="size-4" aria-hidden />
              <span className="sr-only">(otwiera się w nowej karcie)</span>
            </a>
            <a href={go("")} {...newTab} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background")}>
              Otwórz cały prototyp <ArrowUpRight className="size-4" aria-hidden />
              <span className="sr-only">(otwiera się w nowej karcie)</span>
            </a>
          </div>
        </section>
      </main>
      <aside className="hidden xl:block">
        <Toc />
      </aside>
      </div>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap xl:max-w-7xl items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <span>Jan Garstecki · 2026</span>
          <nav aria-label="Linki" className="flex flex-wrap gap-x-6 gap-y-2">
            <ExternalLink href={`${REPO}/blob/main/docs/analiza.md`}>Pełna analiza</ExternalLink>
            <ExternalLink href={`${REPO}/blob/main/docs/notatka-surowa.md`}>Surowa notatka</ExternalLink>
            <ExternalLink href={REPO}>Kod źródłowy</ExternalLink>
            <ExternalLink href="https://masterborn-designer-task.figma.site/">Oryginalny ekran</ExternalLink>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Section({ id, eyebrow, title, lead, children }: { id: string; eyebrow: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t py-16 sm:py-20">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 id={`${id}-h`} className="mt-2 text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      {lead && <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{lead}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 grid gap-2.5 text-sm leading-relaxed text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Figure({ src, alt, caption, className }: { src: string; alt: string; caption?: string; className?: string }) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-8px_rgb(0_0_0/0.12)]">
        <img src={src} alt={alt} width={1440} height={900} loading="lazy" className="block h-auto w-full" />
      </div>
      {caption && <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      {children} <ArrowUpRight className="size-3.5" aria-hidden />
      <span className="sr-only">(otwiera się w nowej karcie)</span>
    </a>
  );
}
