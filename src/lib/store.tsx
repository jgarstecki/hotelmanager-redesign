import { createContext, useContext, useReducer, type ReactNode } from "react";
import { type Cancellation, type PaymentMethod, type Reservation, type Room } from "./domain";
import { RESERVATIONS, ROOMS } from "./seed";

type State = { rooms: Room[]; reservations: Reservation[]; lastCreatedId?: string };

type Action =
  | { type: "add"; reservation: Reservation }
  | { type: "update"; reservation: Reservation }
  | { type: "pay"; id: string; amount: number; method: PaymentMethod }
  | { type: "checkIn"; id: string }
  | { type: "checkOut"; id: string }
  | { type: "cancel"; id: string; cancellation: Cancellation; noShow: boolean }
  | { type: "reset" };

function patch(state: State, id: string, fn: (r: Reservation) => Reservation): State {
  return { ...state, reservations: state.reservations.map((r) => (r.id === id ? fn(r) : r)) };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return { ...state, reservations: [action.reservation, ...state.reservations], lastCreatedId: action.reservation.id };
    case "update":
      return patch(state, action.reservation.id, () => action.reservation);
    case "pay":
      return patch(state, action.id, (r) => ({ ...r, paid: r.paid + action.amount, method: action.method }));
    case "checkIn":
      return patch(state, action.id, (r) => ({ ...r, status: "CHECKED_IN" }));
    case "checkOut": {
      const left = state.reservations.find((r) => r.id === action.id)?.rooms.map((s) => s.roomNr) ?? [];
      const next = patch(state, action.id, (r) => ({ ...r, status: "CHECKED_OUT" }));
      // Vacated rooms go to housekeeping before they can be sold again today.
      return { ...next, rooms: state.rooms.map((room) => (left.includes(room.nr) ? { ...room, housekeeping: { state: "DIRTY", readyAt: "15:00" } } : room)) };
    }
    case "cancel":
      return patch(state, action.id, (r) => ({
        ...r,
        status: action.noShow ? "NO_SHOW" : "CANCELLED",
        paid: r.paid - action.cancellation.refund,
        cancellation: action.cancellation,
      }));
    case "reset":
      return initial;
  }
}

const initial: State = { rooms: ROOMS, reservations: RESERVATIONS };

const StoreContext = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}

export function nextReservationId(reservations: Reservation[]) {
  const max = Math.max(...reservations.map((r) => Number(r.id.replace("R-", ""))));
  return `R-${max + 1}`;
}
