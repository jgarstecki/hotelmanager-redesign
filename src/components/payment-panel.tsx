import { useEffect, useRef, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPLN, type PaymentMethod } from "@/lib/domain";

type Phase = "idle" | "waiting" | "declined";

type Props = {
  amount: number;
  /** Called once money is confirmed – card approved by the terminal or cash counted. */
  onPaid: (method: PaymentMethod) => void;
  onBusyChange?: (busy: boolean) => void;
};

/**
 * Simulates what a PMS does at the desk: the amount is pushed to an integrated card terminal
 * and the system waits for its answer, or cash is counted, change computed and a fiscal receipt printed.
 */
export function PaymentPanel({ amount, onPaid, onBusyChange }: Props) {
  const [method, setMethod] = useState<"CARD" | "CASH">("CARD");
  const [phase, setPhase] = useState<Phase>("idle");
  const [received, setReceived] = useState("");
  const declineNext = useRef(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    onBusyChange?.(phase === "waiting");
    // The panel unmounts right after a successful payment – release the lock on the way out.
    return () => onBusyChange?.(false);
  }, [phase, onBusyChange]);

  const cash = Number(received.replace(",", ".")) || 0;
  const change = cash - amount;

  const sendToTerminal = () => {
    setPhase("waiting");
    timer.current = window.setTimeout(() => {
      if (declineNext.current) {
        declineNext.current = false;
        setPhase("declined");
      } else {
        setPhase("idle");
        onPaid("CARD");
      }
    }, 2200);
  };

  return (
    <div className="grid gap-4">
      <fieldset disabled={phase === "waiting"} className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Metoda płatności</legend>
        {(
          [
            ["CARD", "Karta", "Terminal przy ladzie", CreditCard],
            ["CASH", "Gotówka", "Paragon z drukarki fiskalnej", Banknote],
          ] as const
        ).map(([id, label, hint, Icon]) => (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              method === id ? "border-primary bg-primary/5" : "hover:bg-muted/60",
            )}
          >
            <input type="radio" name="method" value={id} checked={method === id} onChange={() => (setMethod(id), setPhase("idle"))} className="sr-only" />
            <Icon className={cn("mt-0.5 size-5", method === id ? "text-primary" : "text-muted-foreground")} aria-hidden />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="rounded-lg border bg-muted/40 p-4" aria-live="polite">
        {method === "CARD" && phase === "idle" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Kwota <span className="tabular font-semibold">{formatPLN(amount)}</span> zostanie wysłana na terminal.
            </p>
            <Button onClick={sendToTerminal}>
              <CreditCard className="size-4" /> Wyślij na terminal
            </Button>
          </div>
        )}
        {method === "CARD" && phase === "waiting" && (
          <div className="flex items-center gap-3 text-sm">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
            <div>
              <p className="font-medium">Czekam na terminal…</p>
              <p className="text-muted-foreground">Poproś gościa o przyłożenie karty. Nie zamykaj okna.</p>
            </div>
          </div>
        )}
        {method === "CARD" && phase === "declined" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 text-sm">
              <XCircle className="mt-0.5 size-5 text-destructive" aria-hidden />
              <div>
                <p className="font-medium">Terminal odrzucił płatność</p>
                <p className="text-muted-foreground">Spróbuj ponownie, inną kartą albo gotówką. Rezerwacja nie została zapisana.</p>
              </div>
            </div>
            <Button onClick={sendToTerminal}>Spróbuj ponownie</Button>
          </div>
        )}
        {method === "CASH" && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="received">Otrzymano od gościa</Label>
              <div className="relative">
                <Input id="received" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value)} className="tabular w-40 pr-8" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">zł</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Reszta</div>
              <div className={cn("tabular text-lg font-semibold", change < 0 && cash > 0 && "text-destructive")}>
                {cash === 0 ? "–" : change < 0 ? `brakuje ${formatPLN(-change)}` : formatPLN(change)}
              </div>
            </div>
            <Button className="ml-auto" disabled={cash < amount} onClick={() => onPaid("CASH")}>
              <CheckCircle2 className="size-4" /> Przyjmij i drukuj paragon
            </Button>
          </div>
        )}
      </div>

      {method === "CARD" && phase === "idle" && (
        <button type="button" className="justify-self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => ((declineNext.current = true), sendToTerminal())}>
          Demo: zasymuluj odrzucenie karty
        </button>
      )}
    </div>
  );
}
