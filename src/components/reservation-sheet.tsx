import { useState } from "react";
import { AlertTriangle, BedDouble, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PaymentBadge, StatusBadge } from "@/components/badges";
import { Counter } from "@/components/counter";
import { PaymentPanel } from "@/components/payment-panel";
import {
  DOC_TYPES,
  PAYMENT_METHODS,
  ROOM_TYPES,
  SOURCES,
  TODAY,
  balance,
  fitProblem,
  formatDay,
  formatPLN,
  isActive,
  needsExtraBed,
  nightsBetween,
  nightsLabel,
  personsLabel,
  reservationTotal,
  roomPriceLines,
  type Occupancy,
  type Reservation,
} from "@/lib/domain";
import { useStore } from "@/lib/store";

type Props = { id: string | null; onClose: () => void; onCancel: (id: string) => void };

export function ReservationSheet({ id, onClose, onCancel }: Props) {
  const { state } = useStore();
  const reservation = state.reservations.find((r) => r.id === id);
  return (
    <Sheet open={!!reservation} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {reservation && <Details key={reservation.id} reservation={reservation} onCancel={onCancel} />}
      </SheetContent>
    </Sheet>
  );
}

function Details({ reservation: r, onCancel }: { reservation: Reservation; onCancel: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(r);
  const [collecting, setCollecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const roomOf = (nr: string) => state.rooms.find((x) => x.nr === nr)!;
  const shown = editing ? draft : r;
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const draftTotal = reservationTotal(state.rooms, draft.rooms, draft.checkIn, draft.checkOut);
  const draftProblem = draft.rooms.map((s) => fitProblem(roomOf(s.roomNr), s)).find(Boolean);
  const due = balance(r);

  const editStay = (nr: string, key: keyof Occupancy, v: number) => setDraft({ ...draft, rooms: draft.rooms.map((s) => (s.roomNr === nr ? { ...s, [key]: v } : s)) });

  const save = () => {
    if (!draft.guest.firstName.trim() || !draft.guest.lastName.trim()) return toast.error("Imię i nazwisko są wymagane");
    if (draftProblem) return;
    const diff = draftTotal - r.total;
    dispatch({ type: "update", reservation: { ...draft, total: draftTotal } });
    setEditing(false);
    toast.success("Zapisano zmiany", { description: diff > 0 ? `Do dopłaty ${formatPLN(diff)}` : diff < 0 ? `Cena niższa o ${formatPLN(-diff)} – nadpłatę zwróć przy wymeldowaniu` : undefined });
  };

  // The lifecycle step depends on dates, status and whether the stay is settled.
  const canCheckIn = r.status === "UPCOMING" && r.checkIn <= TODAY;
  const canCheckOut = r.status === "CHECKED_IN";
  // Company invoices are settled later by transfer; everything else is settled at the desk.
  const blocksCheckOut = due > 0 && r.method !== "INVOICE";

  return (
    <>
      <SheetHeader className="border-b p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} />
          <PaymentBadge reservation={r} />
        </div>
        <SheetTitle className="mt-2 text-xl">
          {r.guest.firstName} {r.guest.lastName}
        </SheetTitle>
        <SheetDescription className="tabular">
          {r.id} · {SOURCES[r.source]} · {formatDay(r.checkIn)} – {formatDay(r.checkOut)} · {nights} {nightsLabel(nights)}
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-6 p-6">
        {/* Settle-up loop: unpaid balance blocks check-out until money is collected */}
        {isActive(r) && due > 0 && (
          <section aria-labelledby="due-h" className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 id="due-h" className="text-sm font-semibold text-amber-950">
                  Do zapłaty: <span className="tabular">{formatPLN(due)}</span>
                </h3>
                <p className="text-sm text-amber-900">{r.method === "INVOICE" ? "Faktura z terminem płatności – można też pobrać na miejscu." : "Pobierz przed wymeldowaniem."}</p>
              </div>
              {!collecting && (
                <Button variant="outline" className="bg-card" onClick={() => setCollecting(true)}>
                  Pobierz płatność
                </Button>
              )}
            </div>
            {collecting && (
              <div className="mt-4">
                <PaymentPanel
                  amount={due}
                  onBusyChange={setBusy}
                  onPaid={(method) => {
                    dispatch({ type: "pay", id: r.id, amount: due, method });
                    setCollecting(false);
                    toast.success(`Przyjęto ${formatPLN(due)}`, { description: method === "CASH" ? "Paragon wydrukowany" : "Płatność kartą zaakceptowana" });
                  }}
                />
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="rooms-h">
          <div className="flex items-center justify-between">
            <h3 id="rooms-h" className="text-sm font-semibold">
              {shown.rooms.length > 1 ? `Pokoje (${shown.rooms.length})` : "Pokój"}
            </h3>
          </div>
          <div className="mt-3 grid gap-3">
            {shown.rooms.map((s) => {
              const room = roomOf(s.roomNr);
              const type = ROOM_TYPES[room.type];
              return (
                <div key={s.roomNr} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <BedDouble className="size-4 text-muted-foreground" aria-hidden /> {room.nr} · {type.label}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Piętro {room.floor} · do {type.maxPersons} os.{room.features.length > 0 && ` · ${room.features.join(", ")}`}
                      </p>
                    </div>
                  </div>
                  {editing ? (
                    <div className="mt-2 divide-y">
                      <Counter label="Dorośli" value={s.adults} min={1} max={6} onChange={(v) => editStay(s.roomNr, "adults", v)} />
                      <Counter label="Dzieci" hint="3–12 lat" value={s.children} max={6} onChange={(v) => editStay(s.roomNr, "children", v)} />
                      <Counter label="Niemowlęta" hint="0–2 lata, łóżeczko" value={s.infants} max={1} onChange={(v) => editStay(s.roomNr, "infants", v)} />
                      <Counter label="Zwierzęta" value={s.pets} max={2} onChange={(v) => editStay(s.roomNr, "pets", v)} />
                      {fitProblem(room, s) && (
                        <p role="alert" className="flex items-center gap-1.5 pt-2 text-sm font-medium text-destructive">
                          <AlertTriangle className="size-4" aria-hidden /> {fitProblem(room, s)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm">
                      {personsLabel(s)}
                      {needsExtraBed(room, s) && <span className="text-muted-foreground"> · dostawka</span>}
                      {s.infants > 0 && <span className="text-muted-foreground"> · łóżeczko</span>}
                    </p>
                  )}
                  <ul className="mt-3 grid gap-1 border-t pt-3 text-sm">
                    {roomPriceLines(room, s, nights).map((l) => (
                      <li key={l.label} className="flex justify-between gap-3 text-muted-foreground">
                        <span>{l.label}</span>
                        <span className="tabular text-foreground">{formatPLN(l.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <dl className="mt-4 grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium">Razem</dt>
              <dd className="tabular text-base font-semibold">{formatPLN(editing ? draftTotal : r.total)}</dd>
            </div>
            {editing && draftTotal !== r.total && (
              <div className="flex justify-between text-amber-900">
                <dt>{draftTotal > r.total ? "Dopłata po zmianie" : "Nadpłata po zmianie"}</dt>
                <dd className="tabular font-medium">{formatPLN(Math.abs(draftTotal - r.total))}</dd>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <dt>Zapłacono · {PAYMENT_METHODS[r.method]}</dt>
              <dd className="tabular">{formatPLN(r.paid)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="guest-h">
          <h3 id="guest-h" className="text-sm font-semibold">
            Gość
          </h3>
          {editing ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["firstName", "Imię"],
                  ["lastName", "Nazwisko"],
                  ["phone", "Telefon"],
                  ["email", "E-mail"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="grid gap-1.5">
                  <Label htmlFor={`edit-${key}`}>{label}</Label>
                  <Input id={`edit-${key}`} value={draft.guest[key]} onChange={(e) => setDraft({ ...draft, guest: { ...draft.guest, [key]: e.target.value } })} />
                </div>
              ))}
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="edit-notes">Uwagi</Label>
                <Textarea id="edit-notes" rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>
            </div>
          ) : (
            <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Telefon</dt>
              <dd className="tabular">{r.guest.phone || "brak"}</dd>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="break-all">{r.guest.email || "brak"}</dd>
              <dt className="text-muted-foreground">Dokument</dt>
              <dd>{r.guest.docType ? `${DOC_TYPES[r.guest.docType]} · ${r.guest.docNumber?.replace(/.(?=.{3})/g, "•")}` : "Do uzupełnienia przy zameldowaniu"}</dd>
              <dt className="text-muted-foreground">Uwagi</dt>
              <dd>{r.notes || "–"}</dd>
            </dl>
          )}
        </section>

        {r.cancellation && (
          <section aria-labelledby="cancel-h" className="rounded-lg border bg-muted/40 p-4 text-sm">
            <h3 id="cancel-h" className="font-semibold">
              {r.status === "NO_SHOW" ? "Gość nie przyjechał" : "Anulowano"}
            </h3>
            <p className="mt-1">{r.cancellation.reason}</p>
            {r.cancellation.note && <p className="text-muted-foreground">{r.cancellation.note}</p>}
            <p className="mt-1 text-muted-foreground">Zwrot: {formatPLN(r.cancellation.refund)}</p>
          </section>
        )}
      </div>

      <SheetFooter className="mt-auto border-t bg-muted/30 p-4 sm:flex-row sm:justify-between">
        {editing ? (
          <>
            <Button variant="ghost" onClick={() => (setDraft(r), setEditing(false))}>
              Odrzuć zmiany
            </Button>
            <Button onClick={save} disabled={!!draftProblem}>
              Zapisz zmiany
            </Button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              {isActive(r) && (
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busy} onClick={() => onCancel(r.id)}>
                  Anuluj rezerwację
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isActive(r) && (
                <Button variant="outline" disabled={busy} onClick={() => (setDraft(r), setEditing(true))}>
                  <Pencil className="size-4" /> Edytuj
                </Button>
              )}
              {canCheckIn && (
                <Button disabled={busy} onClick={() => (dispatch({ type: "checkIn", id: r.id }), toast.success(`Zameldowano: ${r.guest.lastName}`, { description: "Wydaj klucz" }))}>
                  Zamelduj
                </Button>
              )}
              {canCheckOut && (
                <Button
                  disabled={busy || blocksCheckOut}
                  title={blocksCheckOut ? "Najpierw rozlicz płatność" : undefined}
                  onClick={() => (dispatch({ type: "checkOut", id: r.id }), toast.success(`Wymeldowano: ${r.guest.lastName}`, { description: "Pokój trafia do sprzątania" }))}
                >
                  Wymelduj
                </Button>
              )}
            </div>
          </>
        )}
      </SheetFooter>
    </>
  );
}
