import { cloneElement, isValidElement, useCallback, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { AlertTriangle, BedDouble, Check, CheckCircle2, Dog, Sparkles } from "lucide-react";
import { parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Counter } from "@/components/counter";
import { PaymentPanel } from "@/components/payment-panel";
import { cn } from "@/lib/utils";
import {
  DOC_TYPES,
  ROOM_TYPES,
  TODAY,
  allocate,
  availableRooms,
  fitProblem,
  formatDay,
  formatPLN,
  nightsBetween,
  nightsLabel,
  personsLabel,
  propose,
  roomPriceLines,
  roomStayPrice,
  toISO,
  type DocType,
  type Occupancy,
  type PaymentMethod,
  type Reservation,
  type Room,
  type RoomStay,
} from "@/lib/domain";
import { nextReservationId, useStore } from "@/lib/store";

const STEPS = ["Termin i goście", "Pokój", "Dane gościa", "Płatność"] as const;

type GuestForm = { firstName: string; lastName: string; docType: DocType | ""; docNumber: string; phone: string; email: string; notes: string };
const EMPTY_GUEST: GuestForm = { firstName: "", lastName: "", docType: "", docNumber: "", phone: "", email: "", notes: "" };

const DEFAULT_PARTY: Occupancy = { adults: 2, children: 0, infants: 0, pets: 0 };

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onShow: (id: string) => void; initialParty?: Occupancy };

export function NewReservationDialog({ open, onOpenChange, onShow, initialParty = DEFAULT_PARTY }: Props) {
  const { state, dispatch } = useStore();
  const today = parseISO(TODAY);
  const [step, setStep] = useState(0);
  const [range, setRange] = useState<DateRange | undefined>({ from: today, to: new Date(today.getTime() + 864e5) });
  const [party, setParty] = useState<Occupancy>(initialParty);
  const [stays, setStays] = useState<RoomStay[] | null>(null);
  const [guest, setGuest] = useState<GuestForm>(EMPTY_GUEST);
  const [errors, setErrors] = useState<Partial<Record<keyof GuestForm, string>>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [created, setCreated] = useState<Reservation | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Opening the details sheet must wait until this dialog has returned focus, or the sheet closes at once.
  const showAfterClose = useRef<string | null>(null);

  const from = range?.from ? toISO(range.from) : undefined;
  const to = range?.to ? toISO(range.to) : undefined;
  const nights = from && to ? nightsBetween(from, to) : 0;

  const available = useMemo(() => (from && to && nights > 0 ? availableRooms(state.rooms, state.reservations, from, to) : []), [state, from, to, nights]);
  const proposal = useMemo(() => (nights > 0 ? propose(available, party, nights) : null), [available, party, nights]);

  const roomOf = (nr: string) => state.rooms.find((r) => r.nr === nr)!;
  const chosen = stays ?? proposal?.stays ?? [];
  const total = chosen.reduce((sum, s) => sum + roomStayPrice(roomOf(s.roomNr), s, nights), 0);

  const sum = (key: keyof Occupancy) => chosen.reduce((acc, s) => acc + s[key], 0);
  const allocationProblem = (() => {
    if (chosen.length === 0) return "Wybierz co najmniej jeden pokój";
    for (const s of chosen) {
      const p = fitProblem(roomOf(s.roomNr), s);
      if (p) return `Pokój ${s.roomNr}: ${p}`;
    }
    for (const key of ["adults", "children", "infants", "pets"] as const) {
      if (sum(key) !== party[key]) return "Rozłóż wszystkich gości między wybrane pokoje";
    }
    return null;
  })();

  const reset = () => {
    setStep(0);
    setRange({ from: today, to: new Date(today.getTime() + 864e5) });
    setParty(DEFAULT_PARTY);
    setStays(null);
    setGuest(EMPTY_GUEST);
    setErrors({});
    setConfirmDiscard(false);
    setCreated(null);
  };

  const dirty = !created && (step > 0 || guest !== EMPTY_GUEST);

  const requestClose = (next: boolean) => {
    if (next) return onOpenChange(true);
    if (busy) return;
    if (dirty) return setConfirmDiscard(true);
    onOpenChange(false);
    reset();
  };

  const updateParty = (key: keyof Occupancy) => (v: number) => {
    setParty((p) => ({ ...p, [key]: v }));
    setStays(null); // re-propose for the new party
  };

  const toggleRoom = (nr: string) => {
    const current = chosen.map((s) => s.roomNr);
    const nextNrs = current.includes(nr) ? current.filter((x) => x !== nr) : [...current, nr];
    const rooms = nextNrs.map(roomOf);
    // Try to spread guests automatically; fall back to an editable split.
    setStays(allocate(rooms, party) ?? nextNrs.map((roomNr, i) => chosen.find((s) => s.roomNr === roomNr) ?? { roomNr, adults: i === 0 ? party.adults : 0, children: 0, infants: 0, pets: 0 }));
  };

  const setField = (key: keyof GuestForm, value: string) => {
    setGuest((g) => ({ ...g, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const editStay = (nr: string, key: keyof Occupancy, v: number) => setStays(chosen.map((s) => (s.roomNr === nr ? { ...s, [key]: v } : s)));

  const validateGuest = () => {
    const e: typeof errors = {};
    if (!guest.firstName.trim()) e.firstName = "Wpisz imię";
    if (!guest.lastName.trim()) e.lastName = "Wpisz nazwisko";
    if (!guest.docType) e.docType = "Wybierz dokument";
    if (!guest.docNumber.trim()) e.docNumber = "Wpisz numer dokumentu";
    if (!guest.phone.trim()) e.phone = "Wpisz telefon – przyda się, gdyby gość nie wrócił na noc";
    if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) e.email = "Sprawdź adres – np. jan@example.com";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return !first;
  };

  const next = () => {
    if (step === 1 && !stays && proposal) setStays(proposal.stays);
    if (step === 2 && !validateGuest()) return;
    setStep((s) => s + 1);
  };

  const onPaid = useCallback(
    (method: PaymentMethod) => {
      const reservation: Reservation = {
        id: nextReservationId(state.reservations),
        rooms: chosen,
        guest: { firstName: guest.firstName.trim(), lastName: guest.lastName.trim(), docType: guest.docType as DocType, docNumber: guest.docNumber.trim(), phone: guest.phone.trim(), email: guest.email.trim() },
        checkIn: from!,
        checkOut: to!,
        source: "WALK_IN",
        status: from === TODAY ? "CHECKED_IN" : "UPCOMING",
        method,
        paid: total,
        total,
        notes: guest.notes.trim(),
        createdAt: TODAY,
      };
      dispatch({ type: "add", reservation });
      setCreated(reservation);
    },
    [state.reservations, chosen, guest, from, to, total, dispatch],
  );

  const canNext = step === 0 ? !!proposal : step === 1 ? !allocationProblem : true;

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="flex max-h-[92svh] w-[min(1080px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none" onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
          if (!showAfterClose.current) return;
          e.preventDefault();
          onShow(showAfterClose.current);
          showAfterClose.current = null;
        }}
      >
        <div className="border-b px-6 pt-5 pb-4">
          <DialogTitle className="text-lg">Nowa rezerwacja</DialogTitle>
          <DialogDescription className="sr-only">Rezerwacja dla gościa na miejscu: termin, pokój, dane gościa i płatność.</DialogDescription>
          {!created && (
            <ol className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {STEPS.map((label, i) => (
                <li key={label} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-2", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
                  <span className={cn("grid size-6 place-items-center rounded-full text-xs font-semibold", i < step ? "bg-primary text-primary-foreground" : i === step ? "ring-2 ring-primary text-primary" : "bg-muted")}>
                    {i < step ? <Check className="size-3.5" aria-label="ukończono" /> : i + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </div>

        {created ? (
          <Success reservation={created} onClose={() => (onOpenChange(false), reset())} onShow={() => ((showAfterClose.current = created.id), onOpenChange(false), reset())} />
        ) : (
          <>
            <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1fr_300px]">
              <div className="min-w-0 p-6">
                {step === 0 && (
                  <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
                    <section aria-labelledby="dates-h">
                      <h3 id="dates-h" className="text-sm font-semibold">
                        Na kiedy?
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {from && to && nights > 0 ? `${formatDay(from)} – ${formatDay(to)} · ${nights} ${nightsLabel(nights)}` : "Zaznacz dzień przyjazdu i wyjazdu"}
                      </p>
                      <Calendar
                        mode="range"
                        locale={pl}
                        numberOfMonths={1}
                        defaultMonth={today}
                        selected={range}
                        onSelect={(r) => (setRange(r), setStays(null))}
                        disabled={{ before: today }}
                        className="mt-2 rounded-lg border"
                      />
                    </section>
                    <section aria-labelledby="party-h" className="min-w-0">
                      <h3 id="party-h" className="text-sm font-semibold">
                        Dla ilu osób?
                      </h3>
                      <div className="mt-2 divide-y rounded-lg border px-4">
                        <Counter label="Dorośli" value={party.adults} min={1} max={12} onChange={updateParty("adults")} />
                        <Counter label="Dzieci" hint="3–12 lat" value={party.children} max={8} onChange={updateParty("children")} />
                        <Counter label="Niemowlęta" hint="0–2 lata, łóżeczko gratis" value={party.infants} max={3} onChange={updateParty("infants")} />
                        <Counter label="Zwierzęta" hint={`+${formatPLN(60)} / noc`} value={party.pets} max={2} onChange={updateParty("pets")} />
                      </div>
                      <AvailabilityAnswer nights={nights} availableCount={available.length} proposal={proposal ? { rooms: proposal.stays.map((s) => s.roomNr), total: proposal.total } : null} />
                    </section>
                  </div>
                )}

                {step === 1 && (
                  <section aria-labelledby="rooms-h">
                    <h3 id="rooms-h" className="text-sm font-semibold">
                      Pokoje wolne w tym terminie
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Zaznaczone są proponowane. Możesz wybrać inne – także kilka, np. dwa pokoje dwuosobowe zamiast jednego rodzinnego.
                    </p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {available
                        .slice()
                        .sort((a, b) => Number(chosen.some((s) => s.roomNr === b.room.nr)) - Number(chosen.some((s) => s.roomNr === a.room.nr)) || a.room.nr.localeCompare(b.room.nr))
                        .map(({ room, note }) => {
                          const selected = chosen.some((s) => s.roomNr === room.nr);
                          const proposed = proposal?.stays.some((s) => s.roomNr === room.nr);
                          const type = ROOM_TYPES[room.type];
                          return (
                            <li key={room.nr}>
                              <label
                                className={cn(
                                  "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                                  selected ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                                )}
                              >
                                <Checkbox checked={selected} onCheckedChange={() => toggleRoom(room.nr)} className="mt-0.5" aria-label={`Pokój ${room.nr}`} />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    <span className="tabular font-semibold">{room.nr}</span>
                                    <span className="text-sm">{type.label}</span>
                                    {proposed && (
                                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                                        <Sparkles className="size-3" aria-hidden /> Proponowany
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted-foreground">
                                    Piętro {room.floor} · do {type.maxPersons} os. · {formatPLN(room.basePrice)} / noc
                                    {room.petsAllowed && " · zwierzęta OK"}
                                    {room.features.length > 0 && ` · ${room.features.join(", ")}`}
                                  </span>
                                  {note && (
                                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-800">
                                      <AlertTriangle className="size-3.5" aria-hidden /> {note}
                                    </span>
                                  )}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                )}

                {step === 2 && (
                  <form ref={formRef} noValidate className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={(e) => (e.preventDefault(), next())}>
                    <Field label="Imię" required error={errors.firstName}>
                      <Input name="firstName" autoComplete="off" value={guest.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                    </Field>
                    <Field label="Nazwisko" required error={errors.lastName}>
                      <Input name="lastName" autoComplete="off" value={guest.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                    </Field>
                    <Field label="Dokument tożsamości" required error={errors.docType}>
                      <Select value={guest.docType} onValueChange={(v) => setField("docType", v as DocType)}>
                        <SelectTrigger name="docType" aria-label="Dokument tożsamości" className="w-full">
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(DOC_TYPES) as DocType[]).map((d) => (
                            <SelectItem key={d} value={d}>
                              {DOC_TYPES[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Numer dokumentu" required error={errors.docNumber}>
                      <Input name="docNumber" autoComplete="off" className="uppercase" value={guest.docNumber} onChange={(e) => setField("docNumber", e.target.value)} />
                    </Field>
                    <Field label="Telefon" required error={errors.phone}>
                      <Input name="phone" type="tel" inputMode="tel" value={guest.phone} onChange={(e) => setField("phone", e.target.value)} />
                    </Field>
                    <Field label="E-mail" hint="Opcjonalnie – potwierdzenie i faktura" error={errors.email}>
                      <Input name="email" type="email" value={guest.email} onChange={(e) => setField("email", e.target.value)} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Uwagi" hint="Opcjonalnie">
                        <Textarea name="notes" rows={3} value={guest.notes} onChange={(e) => setField("notes", e.target.value)} />
                      </Field>
                    </div>
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                      Źródło rezerwacji: <span className="font-medium text-foreground">Na miejscu</span>
                    </p>
                    <button type="submit" hidden />
                  </form>
                )}

                {step === 3 && (
                  <section aria-labelledby="pay-h" className="max-w-2xl">
                    <h3 id="pay-h" className="text-sm font-semibold">
                      Do zapłaty: <span className="tabular">{formatPLN(total)}</span>
                    </h3>
                    <p className="mt-1 mb-4 text-sm text-muted-foreground">Rezerwacja na miejscu zapisuje się dopiero po opłaceniu.</p>
                    <PaymentPanel amount={total} onPaid={onPaid} onBusyChange={setBusy} />
                  </section>
                )}
              </div>

              <Summary from={from} to={to} nights={nights} party={party} stays={step >= 1 ? chosen : []} total={total} step={step} onEditStay={editStay} problem={step === 1 ? allocationProblem : null} roomOf={roomOf} />
            </div>

            <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-3">
              {confirmDiscard ? (
                <div role="alertdialog" aria-labelledby="discard-t" className="flex w-full flex-wrap items-center justify-between gap-3">
                  <p id="discard-t" className="text-sm font-medium">
                    Przerwać? Wpisane dane zostaną utracone, rezerwacja nie powstanie.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" autoFocus onClick={() => setConfirmDiscard(false)}>
                      Wróć do rezerwacji
                    </Button>
                    <Button variant="destructive" onClick={() => (onOpenChange(false), reset())}>
                      Przerwij
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="ghost" disabled={busy} onClick={() => (step === 0 ? requestClose(false) : setStep(step - 1))}>
                    {step === 0 ? "Anuluj" : "Wstecz"}
                  </Button>
                  {step < 3 && (
                    <Button disabled={!canNext} onClick={next}>
                      {step === 0 ? "Pokaż pokoje" : step === 1 ? "Dalej: dane gościa" : "Dalej: płatność"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityAnswer({ nights, availableCount, proposal }: { nights: number; availableCount: number; proposal: { rooms: string[]; total: number } | null }) {
  if (nights === 0) return <p className="mt-4 text-sm text-muted-foreground">Wybierz datę wyjazdu, żeby sprawdzić dostępność.</p>;
  return (
    <div
      aria-live="polite"
      className={cn("mt-4 flex items-start gap-3 rounded-lg border p-4 text-sm", proposal ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950")}
    >
      {proposal ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />}
      {proposal ? (
        <p>
          <span className="font-semibold">Tak, mamy miejsce.</span> Wolnych pokoi w tym terminie: {availableCount}. Proponuję{" "}
          {proposal.rooms.length > 1 ? `${proposal.rooms.length} pokoje: ${proposal.rooms.join(" + ")}` : `pokój ${proposal.rooms[0]}`} – razem{" "}
          <span className="tabular font-semibold">{formatPLN(proposal.total)}</span>.
        </p>
      ) : (
        <p>
          <span className="font-semibold">Brak miejsca dla tej grupy.</span>{" "}
          {availableCount === 0 ? "Wszystkie pokoje są zajęte w tym terminie." : `Wolnych pokoi: ${availableCount}, ale żadne 1–2 nie pomieszczą tych gości. Zmień termin albo liczbę osób.`}
        </p>
      )}
    </div>
  );
}

type SummaryProps = {
  from?: string;
  to?: string;
  nights: number;
  party: Occupancy;
  stays: RoomStay[];
  total: number;
  step: number;
  problem: string | null;
  onEditStay: (nr: string, key: keyof Occupancy, v: number) => void;
  roomOf: (nr: string) => Room;
};

function Summary({ from, to, nights, party, stays, total, step, problem, onEditStay, roomOf }: SummaryProps) {
  const editable = step === 1 && stays.length > 1;
  return (
    <aside aria-label="Podsumowanie rezerwacji" className="border-t bg-muted/30 p-6 md:border-t-0 md:border-l">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Podsumowanie</h3>
      <dl className="mt-3 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Termin</dt>
          <dd className="font-medium">{from && to && nights > 0 ? `${formatDay(from)} – ${formatDay(to)} · ${nights} ${nightsLabel(nights)}` : "–"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Goście</dt>
          <dd className="font-medium">{personsLabel(party)}</dd>
        </div>
      </dl>

      {stays.length > 0 && (
        <div className="mt-4 grid gap-3">
          {stays.map((s) => {
            const room = roomOf(s.roomNr);
            return (
              <div key={s.roomNr} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <BedDouble className="size-4 text-muted-foreground" aria-hidden /> Pokój {s.roomNr}
                  </span>
                  <span className="tabular">{formatPLN(roomStayPrice(room, s, nights))}</span>
                </div>
                {editable ? (
                  <div className="mt-1 divide-y">
                    <Counter label="Dorośli" value={s.adults} min={1} max={party.adults} onChange={(v) => onEditStay(s.roomNr, "adults", v)} />
                    {party.children > 0 && <Counter label="Dzieci" value={s.children} max={party.children} onChange={(v) => onEditStay(s.roomNr, "children", v)} />}
                    {party.infants > 0 && <Counter label="Niemowlęta" value={s.infants} max={1} onChange={(v) => onEditStay(s.roomNr, "infants", v)} />}
                    {party.pets > 0 && <Counter label="Zwierzęta" value={s.pets} max={party.pets} onChange={(v) => onEditStay(s.roomNr, "pets", v)} />}
                  </div>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    {s.pets > 0 && <Dog className="size-3.5" aria-hidden />}
                    {personsLabel(s)}
                  </p>
                )}
                {step === 3 && (
                  <ul className="mt-2 grid gap-1 border-t pt-2 text-xs text-muted-foreground">
                    {roomPriceLines(room, s, nights).map((l) => (
                      <li key={l.label} className="flex justify-between gap-2">
                        <span>{l.label}</span>
                        <span className="tabular">{formatPLN(l.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {problem && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {problem}
        </p>
      )}

      {stays.length > 0 && (
        <div className="mt-4 flex items-baseline justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Razem</span>
          <span className="tabular text-xl font-semibold">{formatPLN(total)}</span>
        </div>
      )}
    </aside>
  );
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, "aria-invalid": !!error || undefined, "aria-describedby": `${id}-msg` }) : children;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="gap-1">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only">(wymagane)</span>}
      </Label>
      {control}
      <p id={`${id}-msg`} className={cn("text-xs", error ? "flex items-center gap-1.5 font-medium text-destructive" : "text-muted-foreground")}>
        {error ? (
          <>
            <AlertTriangle className="size-3.5" aria-hidden /> {error}
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}

function Success({ reservation, onClose, onShow }: { reservation: Reservation; onClose: () => void; onShow: () => void }) {
  return (
    <div className="grid place-items-center gap-4 px-6 py-16 text-center" role="status">
      <CheckCircle2 className="size-12 text-emerald-600" aria-hidden />
      <div>
        <p className="text-lg font-semibold">Opłacono i zapisano rezerwację {reservation.id}</p>
        <p className="mt-1 text-muted-foreground">
          {reservation.guest.firstName} {reservation.guest.lastName} · {reservation.rooms.length > 1 ? "pokoje" : "pokój"} {reservation.rooms.map((s) => s.roomNr).join(", ")} ·{" "}
          {formatDay(reservation.checkIn)} – {formatDay(reservation.checkOut)}
        </p>
        {reservation.status === "CHECKED_IN" && <p className="mt-3 text-sm font-medium">Gość jest zameldowany – wydaj {reservation.rooms.length > 1 ? "klucze" : "klucz"}.</p>}
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" onClick={onShow}>
          Pokaż rezerwację
        </Button>
        <Button autoFocus onClick={onClose}>
          Gotowe
        </Button>
      </div>
    </div>
  );
}
