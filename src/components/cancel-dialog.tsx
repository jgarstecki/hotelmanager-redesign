import { useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHODS, SOURCES, formatDay, formatPLN } from "@/lib/domain";
import { useStore } from "@/lib/store";

const REASONS = ["Zmiana planów gościa", "Choroba lub zdarzenie losowe", "Pomyłka przy rezerwacji", "Gość nie przyjechał (no-show)", "Inny powód"];

type Props = { id: string | null; onClose: () => void };

export function CancelDialog({ id, onClose }: Props) {
  const { state } = useStore();
  const r = state.reservations.find((x) => x.id === id);
  return (
    <Dialog open={!!r} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">{r && <Form key={r.id} id={r.id} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function Form({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const r = state.reservations.find((x) => x.id === id)!;
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [refundMode, setRefundMode] = useState<"FULL" | "PARTIAL" | "NONE">("FULL");
  const [partial, setPartial] = useState("");
  const [tried, setTried] = useState(false);

  const viaOta = r.method === "OTA";
  const canRefund = r.paid > 0 && !viaOta;
  const partialAmount = Math.min(r.paid, Number(partial.replace(",", ".")) || 0);
  const refund = !canRefund ? 0 : refundMode === "FULL" ? r.paid : refundMode === "PARTIAL" ? partialAmount : 0;
  const noShow = reason === REASONS[3];

  const problems = {
    reason: !reason ? "Wybierz powód" : reason === "Inny powód" && !note.trim() ? "Opisz powód w notatce" : null,
    partial: canRefund && refundMode === "PARTIAL" && partialAmount <= 0 ? "Wpisz kwotę zwrotu" : null,
  };

  const confirm = () => {
    setTried(true);
    if (problems.reason || problems.partial) return;
    dispatch({ type: "cancel", id: r.id, noShow, cancellation: { reason, note: note.trim(), refund } });
    toast.success(`Anulowano ${r.id}`, { description: refund > 0 ? `Zwrot ${formatPLN(refund)} – ${PAYMENT_METHODS[r.method].toLowerCase()}` : "Bez zwrotu" });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Anulować rezerwację {r.id}?</DialogTitle>
        <DialogDescription>
          {r.guest.firstName} {r.guest.lastName} · pokój {r.rooms.map((s) => s.roomNr).join(", ")} · {formatDay(r.checkIn)} – {formatDay(r.checkOut)}. Pokój wróci do puli wolnych.
        </DialogDescription>
      </DialogHeader>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Powód</legend>
        <RadioGroup value={reason} onValueChange={setReason} aria-invalid={tried && !!problems.reason}>
          {REASONS.map((x) => (
            <div key={x} className="flex items-center gap-2">
              <RadioGroupItem value={x} id={`reason-${x}`} />
              <Label htmlFor={`reason-${x}`} className="font-normal">
                {x}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Label htmlFor="cancel-note" className="mt-2">
          Notatka {reason === "Inny powód" ? "" : <span className="font-normal text-muted-foreground">(opcjonalnie)</span>}
        </Label>
        <Textarea id="cancel-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        {tried && problems.reason && <p className="text-xs font-medium text-destructive">{problems.reason}</p>}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Zwrot</legend>
        {viaOta ? (
          <p className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            Płatność przyjął {SOURCES[r.source]} – zwrot obsługuje pośrednik według swoich warunków. Zapisujemy tylko powód.
          </p>
        ) : r.paid === 0 ? (
          <p className="text-sm text-muted-foreground">Nic nie wpłacono – brak zwrotu.</p>
        ) : (
          <RadioGroup value={refundMode} onValueChange={(v) => setRefundMode(v as typeof refundMode)}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="FULL" id="refund-full" />
              <Label htmlFor="refund-full" className="font-normal">
                Pełny zwrot · <span className="tabular">{formatPLN(r.paid)}</span>
              </Label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RadioGroupItem value="PARTIAL" id="refund-partial" />
              <Label htmlFor="refund-partial" className="font-normal">
                Część
              </Label>
              {refundMode === "PARTIAL" && (
                <Input aria-label="Kwota zwrotu w złotych" inputMode="decimal" className="tabular h-8 w-28" value={partial} onChange={(e) => setPartial(e.target.value)} autoFocus />
              )}
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="NONE" id="refund-none" />
              <Label htmlFor="refund-none" className="font-normal">
                Bez zwrotu
              </Label>
            </div>
            {tried && problems.partial && <p className="text-xs font-medium text-destructive">{problems.partial}</p>}
            {refund > 0 && <p className="text-sm text-muted-foreground">Zwrot tą samą metodą: {PAYMENT_METHODS[r.method].toLowerCase()}.</p>}
          </RadioGroup>
        )}
      </fieldset>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Zostaw rezerwację
        </Button>
        <Button variant="destructive" onClick={confirm}>
          {noShow ? "Oznacz jako no-show" : refund > 0 ? `Anuluj i zwróć ${formatPLN(refund)}` : "Anuluj rezerwację"}
        </Button>
      </DialogFooter>
    </>
  );
}
