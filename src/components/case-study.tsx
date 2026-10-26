import { useEffect, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, BedDouble, CalendarRange, CreditCard, Gauge, Undo2, Users } from "lucide-react";
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

type Change = { icon: typeof Users; title: string; body: string; scenario: string; cta: string };

const CHANGES: Change[] = [
  {
    icon: CalendarRange,
    title: "Wiersz to rezerwacja",
    body: "Pokój jest atrybutem rezerwacji. Piętro i typ nie zajmują kolumn – są pod numerem pokoju, po najechaniu, na wypadek pytania przy ladzie. Do tego statusy, termin, źródło i płatność jako filtry.",
    scenario: "group",
    cta: "Rezerwacja grupowa na 4 pokoje",
  },
  {
    icon: BedDouble,
    title: "Walk-in: pokój na końcu",
    body: "Daty i liczba gości wystarczą, żeby od razu odpowiedzieć gościowi, czy jest miejsce i ile to mniej więcej kosztuje. System sam proponuje pokój, a gdy jeden nie wystarcza – dwa. Recepcjonista może to zmienić.",
    scenario: "walkin-group",
    cta: "4 dorosłych i 2 dzieci",
  },
  {
    icon: Users,
    title: "Skład gości i cena",
    body: "Dorośli, dzieci, niemowlęta z łóżeczkiem i zwierzęta – każdy pokój z rozbiciem ceny. Zmiana składu przelicza kwotę i pokazuje dopłatę.",
    scenario: "edit",
    cta: "Edytuj rezerwację",
  },
  {
    icon: CreditCard,
    title: "Płatność domyka rezerwację",
    body: "Walk-in zapisuje się dopiero po opłaceniu: karta przez terminal albo gotówka z resztą. Nieopłacony pobyt blokuje wymeldowanie, dopóki recepcja nie pobierze dopłaty.",
    scenario: "checkout",
    cta: "Wymeldowanie z dopłatą",
  },
  {
    icon: Undo2,
    title: "Anulowanie z powodem i zwrotem",
    body: "Zamiast „U” i systemowego okienka – powód, zwrot pełny, częściowy albo żaden, a przy pośrednikach jasna informacja, kto oddaje pieniądze.",
    scenario: "cancel",
    cta: "Anuluj opłaconą rezerwację",
  },
  {
    icon: Gauge,
    title: "Obłożenie dla właściciela",
    body: "Jedna wyciszona linia pod tytułem: dziś, najbliższe 7 dni i pokoje wyłączone ze sprzedaży. Podgląd, nie dashboard – nie odciąga uwagi od listy.",
    scenario: "",
    cta: "Zobacz listę",
  },
];

type Step = { who: "Ja" | "AI" | "Ja + AI"; title: string; body: string };

const PROCESS: Step[] = [
  { who: "AI", title: "Izolowana kopia prototypu", body: "Na moje polecenie AI odtworzyło działający ekran lokalnie, żebym mógł go psuć i testować." },
  { who: "AI", title: "Stress test", body: "Na moją prośbę 8 → 46 rekordów z przypadkami brzegowymi: długie nazwiska, zdublowani goście, grupa, brakujące dane." },
  { who: "Ja", title: "Analiza", body: "Obserwacje i rozwiązania spisałem sam, bez AI. To rdzeń całej pracy." },
  { who: "AI", title: "Uporządkowanie notatki", body: "Krótsza forma, ta sama treść. Bez dopisywania wniosków." },
  { who: "Ja + AI", title: "Sprawdzenie zrozumienia", body: "AI streściło, jak mnie rozumie, i wskazało luki. Zdecydowałem, co przyjmuję, a co odkładam." },
  { who: "AI", title: "Prototyp", body: "Budowa według moich zaleceń. Prowadziłem i akceptowałem każdy krok." },
  { who: "Ja + AI", title: "Iteracje", body: "Filtry statusu i płatności, pasek obłożenia, ta strona – po klikaniu w gotowy prototyp." },
];

const SKILLS = ["ux-heuristics-review", "cognitive-load-conversion", "craft", "accessibility", "copy-voice"];

function go(scenario: string) {
  return scenario ? `#/prototyp?s=${scenario}` : "#/prototyp";
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

export function CaseStudy({ section }: { section: string | null }) {
  useEffect(() => {
    if (section) requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView());
  }, [section]);

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="text-sm leading-tight">
            <span className="font-semibold">Jan Garstecki</span>
            <span className="hidden text-muted-foreground sm:inline"> · zadanie rekrutacyjne MasterBorn</span>
          </div>
          <a href={go("")} className={buttonVariants({ size: "sm" })}>
            Otwórz prototyp <ArrowRight className="size-4" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Hero */}
        <section className="pt-16 pb-12 sm:pt-24">
          <p className="text-sm font-medium text-primary">HotelManager PRO · lista rezerwacji</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">Najpierw termin i liczba gości. Pokój na końcu.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Oryginalna lista rezerwacji pokazywała pokoje, a nie rezerwacje. Rozdzieliłem te dwa obiekty i przestawiłem flow walk-in tak, żeby recepcjonista odpowiadał gościowi przy ladzie w
            kilka sekund – a pokój był wynikiem, nie pierwszym polem formularza.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={go("")} className={buttonVariants({ size: "lg" })}>
              Otwórz prototyp <ArrowRight className="size-4" />
            </a>
            <button type="button" onClick={() => scrollTo("proces")} className={buttonVariants({ size: "lg", variant: "outline" })}>
              Jak pracowałem
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Działa w przeglądarce, bez logowania.</p>

          <Figure src={shot("after.png")} alt="Nowa lista rezerwacji: sidebar z nawigacją, pasek obłożenia, zakładki statusów, filtry i tabela rezerwacji." className="mt-14" />
        </section>

        {/* Starting point */}
        <Section id="punkt-wyjscia" eyebrow="Punkt wyjścia" title="Co było nie tak">
          <Figure src={shot("before.png")} alt="Oryginalny ekran: lista pokoi ze statusami wolny, zajęty, sprzątanie i naprawa, przyciski R, E, U." caption="Oryginał – 8 pokoi udających listę rezerwacji." />
          <blockquote className="mt-10 border-l-2 border-primary pl-5 text-xl leading-snug font-medium text-balance">
            Ekran „Rezerwacje” pokazuje pokoje, a nie rezerwacje. Dlatego nie da się ani sprawnie zarządzać rezerwacjami, ani szybko powiedzieć gościowi walk-in, czy jest miejsce na jego daty.
          </blockquote>
          <p className="mt-3 pl-5 text-sm text-muted-foreground">Główny problem – wszystko inne z niego wynika.</p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <List title="Nielogiczne" items={ILLOGICAL} />
            <List title="Tylko mało estetyczne" items={UNPOLISHED} />
          </div>
        </Section>

        {/* Changes with deep links */}
        <Section id="co-zmienilem" eyebrow="Rozwiązanie" title="Co zmieniłem" lead="Każda karta prowadzi prosto do miejsca w prototypie, gdzie widać rozwiązanie w działaniu.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHANGES.map((c) => (
              <article key={c.title} className="flex flex-col rounded-xl border bg-card p-5">
                <c.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <a
                  href={go(c.scenario)}
                  className="mt-5 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {c.cta} <ArrowRight className="size-4" aria-hidden />
                </a>
              </article>
            ))}
          </div>
          <Figure src={shot("walkin.png")} alt="Okno nowej rezerwacji: kalendarz, liczba gości i odpowiedź systemu z propozycją dwóch pokoi." caption="Walk-in – odpowiedź pojawia się, zanim recepcjonista wybierze pokój." className="mt-12" />
        </Section>

        {/* Process */}
        <Section id="proces" eyebrow="Proces" title="Jak pracowałem" lead="Brief nie narzucał stacku, więc podzieliłem pracę świadomie: analiza i decyzje są moje, a implementację wykonał Claude Code jako narzędzie.">
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
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">Własne skille dla AI</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Zleciłem modelowi projektowanie z moimi skillami – instrukcjami, które sam przygotowałem i zainstalowałem. Dzięki nim heurystyki, WCAG i detale wizualne były wymaganiem od pierwszej
                wersji, a nie poprawką na końcu.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <li key={s} className="rounded-md border bg-muted px-2 py-1 font-mono text-xs">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">Tu zapytałem AI o radę</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Nie znałem praktyki płatności w systemach hotelowych. Z odpowiedzi AI wziąłem model z terminalem zintegrowanym z systemem, kasą z paragonem fiskalnym i statusem „do zapłaty” dla
                faktur i pośredników. Moja zasada „nieopłacony walk-in nie istnieje” została, a reszta źródeł domyka płatność przed wymeldowaniem.
              </p>
            </div>
          </div>
        </Section>

        {/* Decisions */}
        <Section id="decyzje" eyebrow="Decyzje" title="Co świadomie zostawiłem">
          <div className="grid gap-8 md:grid-cols-2">
            <List
              title="Wybory, które warto znać"
              items={[
                "shadcn/ui jako UI kit – oszczędność czasu i sprawdzone rozmiary, odstępy i kontrast (WCAG) zamiast wymyślania ich od zera.",
                "Powiązane dane w dwuwierszowych komórkach (gość + uwagi, telefon + e-mail, daty + noce), żeby 12 kolumn zmieściło się na laptopie.",
                "Pasek obłożenia celowo cichy – właściciel dostaje ogólny podgląd, pełne raporty zostają w „Raportach”.",
              ]}
            />
            <List
              title="Ograniczenia prototypu"
              items={[
                "Dane żyją w pamięci – odświeżenie strony przywraca stan początkowy.",
                "Terminal, drukarka fiskalna i zwroty są symulowane.",
                "Zmiana dat lub pokoju w istniejącej rezerwacji jest poza zakresem.",
                "Projektowane na desktop recepcji.",
              ]}
            />
          </div>
        </Section>

        {/* Closing CTA */}
        <section className="my-20 rounded-2xl bg-foreground px-6 py-12 text-background sm:px-12">
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance">Najlepiej sprawdzić to samemu – zacznij od gościa, który pyta o wolny pokój.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={go("walkin")} className={cn(buttonVariants({ size: "lg" }), "bg-background text-foreground hover:bg-background/90")}>
              Przyjmij gościa walk-in <ArrowRight className="size-4" />
            </a>
            <a href={go("")} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background")}>
              Otwórz cały prototyp
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <span>Jan Garstecki · 2026</span>
          <nav aria-label="Linki" className="flex flex-wrap gap-x-6 gap-y-2">
            <ExternalLink href={`${REPO}/blob/main/docs/analiza.md`}>Pełna analiza</ExternalLink>
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
