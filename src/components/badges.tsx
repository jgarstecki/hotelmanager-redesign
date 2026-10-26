import { cn } from "@/lib/utils";
import {
  PAYMENT_STATES,
  STATUSES,
  balance,
  formatPLN,
  paymentState,
  type PaymentState,
  type Reservation,
  type ReservationStatus,
} from "@/lib/domain";

// Status is never colour-only: every badge carries its label and a shaped dot (WCAG 1.4.1).
const STATUS_TONE: Record<ReservationStatus, string> = {
  UPCOMING: "bg-sky-50 text-sky-800 ring-sky-200",
  CHECKED_IN: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CHECKED_OUT: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200 line-through decoration-slate-400",
  NO_SHOW: "bg-rose-50 text-rose-800 ring-rose-200",
};

const PAYMENT_TONE: Record<PaymentState, string> = {
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200",
  PARTIAL: "bg-amber-50 text-amber-900 ring-amber-200",
  REFUNDED: "bg-slate-100 text-slate-700 ring-slate-200",
};

const base = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={cn(base, STATUS_TONE[status])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUSES[status]}
    </span>
  );
}

export function PaymentBadge({ reservation }: { reservation: Reservation }) {
  const state = paymentState(reservation);
  const label =
    state === "PARTIAL"
      ? `Do zapłaty ${formatPLN(balance(reservation))}`
      : state === "REFUNDED"
        ? `Zwrot ${formatPLN(reservation.cancellation!.refund)}`
        : PAYMENT_STATES[state];
  return (
    <span className={cn(base, PAYMENT_TONE[state])}>
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current opacity-70", state === "PENDING" || state === "PARTIAL" ? "rounded-none rotate-45" : "")} />
      {label}
    </span>
  );
}
