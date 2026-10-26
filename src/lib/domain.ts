import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

/** The prototype lives on the same "today" as the original screen (last login 28.12.2024). */
export const TODAY = "2024-12-28";

// ─── Rooms ────────────────────────────────────────────────────────────────

export type RoomTypeId = "SINGLE" | "DOUBLE" | "FAMILY" | "STUDIO";

export type RoomType = {
  id: RoomTypeId;
  label: string;
  /** Persons (adults + children 3–12) covered by the base price. */
  included: number;
  /** Regular beds; anything above needs an extra bed. */
  beds: number;
  /** Hard limit of persons, extra beds included. Infants (0–2) sleep in a crib and don't count. */
  maxPersons: number;
};

export const ROOM_TYPES: Record<RoomTypeId, RoomType> = {
  SINGLE: { id: "SINGLE", label: "Jednoosobowy", included: 1, beds: 1, maxPersons: 1 },
  DOUBLE: { id: "DOUBLE", label: "Dwuosobowy", included: 2, beds: 2, maxPersons: 3 },
  FAMILY: { id: "FAMILY", label: "Rodzinny", included: 4, beds: 4, maxPersons: 5 },
  STUDIO: { id: "STUDIO", label: "Studio", included: 2, beds: 3, maxPersons: 4 },
};

export type Housekeeping =
  | { state: "CLEAN" }
  | { state: "DIRTY"; readyAt: string }
  | { state: "OUT_OF_ORDER"; until: string; reason: string };

export type Room = {
  nr: string;
  floor: number;
  type: RoomTypeId;
  basePrice: number;
  petsAllowed: boolean;
  cribAllowed: boolean;
  features: string[];
  housekeeping: Housekeeping;
};

// ─── Pricing ──────────────────────────────────────────────────────────────

export const PRICING = {
  extraAdult: 90,
  extraChild: 50,
  pet: 60,
  crib: 0,
} as const;

export type Occupancy = { adults: number; children: number; infants: number; pets: number };

export type RoomStay = Occupancy & { roomNr: string };

export type PriceLine = { label: string; amount: number };

export function persons(o: Occupancy) {
  return o.adults + o.children;
}

export function needsExtraBed(room: Room, o: Occupancy) {
  return persons(o) > ROOM_TYPES[room.type].beds;
}

/** Why a party can't stay in a room – or null when it fits. */
export function fitProblem(room: Room, o: Occupancy): string | null {
  const type = ROOM_TYPES[room.type];
  if (o.adults < 1) return "W pokoju musi być co najmniej 1 dorosły";
  if (persons(o) > type.maxPersons) return `Maks. ${type.maxPersons} os. w tym pokoju`;
  if (o.infants > 0 && !room.cribAllowed) return "Brak łóżeczka w tym pokoju";
  if (o.infants > 1) return "Maks. 1 łóżeczko na pokój";
  if (o.pets > 0 && !room.petsAllowed) return "Pokój bez zwierząt";
  return null;
}

export function roomPriceLines(room: Room, o: Occupancy, nights: number): PriceLine[] {
  const type = ROOM_TYPES[room.type];
  const extraAdults = Math.max(0, o.adults - type.included);
  const freeForKids = Math.max(0, type.included - o.adults);
  const extraChildren = Math.max(0, o.children - freeForKids);
  const n = `${nights} ${nightsLabel(nights)}`;
  const lines: PriceLine[] = [{ label: `Pokój ${room.nr} · ${n} × ${formatPLN(room.basePrice)}`, amount: room.basePrice * nights }];
  if (extraAdults) lines.push({ label: `Dodatkowy dorosły × ${extraAdults} · ${n}`, amount: extraAdults * PRICING.extraAdult * nights });
  if (extraChildren) lines.push({ label: `Dziecko 3–12 lat × ${extraChildren} · ${n}`, amount: extraChildren * PRICING.extraChild * nights });
  if (o.infants) lines.push({ label: `Łóżeczko dziecięce × ${o.infants}`, amount: PRICING.crib });
  if (o.pets) lines.push({ label: `Zwierzę × ${o.pets} · ${n}`, amount: o.pets * PRICING.pet * nights });
  return lines;
}

export function roomStayPrice(room: Room, o: Occupancy, nights: number) {
  return roomPriceLines(room, o, nights).reduce((sum, l) => sum + l.amount, 0);
}

// ─── Reservations ─────────────────────────────────────────────────────────

export type Source = "WALK_IN" | "WEBSITE" | "BOOKING" | "PHONE" | "AGENCY";

export const SOURCES: Record<Source, string> = {
  WALK_IN: "Na miejscu",
  WEBSITE: "Strona hotelu",
  BOOKING: "Booking.com",
  PHONE: "Telefon / e-mail",
  AGENCY: "Biuro podróży",
};

export type ReservationStatus = "UPCOMING" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";

export const STATUSES: Record<ReservationStatus, string> = {
  UPCOMING: "Nadchodząca",
  CHECKED_IN: "Zameldowana",
  CHECKED_OUT: "Wymeldowana",
  CANCELLED: "Anulowana",
  NO_SHOW: "Nie przyjechał",
};

export type PaymentMethod = "CARD" | "CASH" | "TRANSFER" | "INVOICE" | "OTA";

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  CARD: "Karta",
  CASH: "Gotówka",
  TRANSFER: "Przelew",
  INVOICE: "Faktura",
  OTA: "Przez pośrednika",
};

export type DocType = "ID_CARD" | "PASSPORT" | "RESIDENCE" | "OTHER";

export const DOC_TYPES: Record<DocType, string> = {
  ID_CARD: "Dowód osobisty",
  PASSPORT: "Paszport",
  RESIDENCE: "Karta pobytu",
  OTHER: "Inny dokument",
};

export type Guest = {
  firstName: string;
  lastName: string;
  docType?: DocType;
  docNumber?: string;
  phone: string;
  email: string;
};

export type Cancellation = { reason: string; note: string; refund: number };

export type Reservation = {
  id: string;
  rooms: RoomStay[];
  guest: Guest;
  checkIn: string;
  checkOut: string;
  source: Source;
  status: ReservationStatus;
  method: PaymentMethod;
  /** Money actually collected (after refunds). */
  paid: number;
  /** Price fixed when the reservation was made. */
  total: number;
  notes: string;
  createdAt: string;
  cancellation?: Cancellation;
};

export type PaymentState = "PAID" | "PENDING" | "PARTIAL" | "REFUNDED";

export const PAYMENT_STATES: Record<PaymentState, string> = {
  PAID: "Opłacona",
  PENDING: "Do zapłaty",
  PARTIAL: "Częściowo",
  REFUNDED: "Zwrócona",
};

export function paymentState(r: Reservation): PaymentState {
  if (r.status === "CANCELLED" && r.cancellation && r.cancellation.refund > 0) return "REFUNDED";
  if (r.paid >= r.total) return "PAID";
  if (r.paid > 0) return "PARTIAL";
  return "PENDING";
}

export function balance(r: Reservation) {
  return Math.max(0, r.total - r.paid);
}

export function isActive(r: Reservation) {
  return r.status === "UPCOMING" || r.status === "CHECKED_IN";
}

/** Blocks the room for its dates (cancelled and no-show bookings release it). */
export function blocksRoom(r: Reservation) {
  return r.status !== "CANCELLED" && r.status !== "NO_SHOW" && r.status !== "CHECKED_OUT";
}

export function partyOf(r: Reservation): Occupancy {
  return r.rooms.reduce(
    (acc, s) => ({ adults: acc.adults + s.adults, children: acc.children + s.children, infants: acc.infants + s.infants, pets: acc.pets + s.pets }),
    { adults: 0, children: 0, infants: 0, pets: 0 },
  );
}

export function reservationTotal(rooms: Room[], stays: RoomStay[], checkIn: string, checkOut: string) {
  const n = nightsBetween(checkIn, checkOut);
  return stays.reduce((sum, s) => {
    const room = rooms.find((r) => r.nr === s.roomNr);
    return room ? sum + roomStayPrice(room, s, n) : sum;
  }, 0);
}

// ─── Availability ─────────────────────────────────────────────────────────

export type Availability = { room: Room; note?: string };

/** Rooms free for the whole [from, to) range, with a note when they need attention first. */
export function availableRooms(rooms: Room[], reservations: Reservation[], from: string, to: string, ignoreId?: string): Availability[] {
  return rooms.flatMap((room) => {
    const hk = room.housekeeping;
    if (hk.state === "OUT_OF_ORDER" && hk.until > from) return [];
    const taken = reservations.some(
      (r) => r.id !== ignoreId && blocksRoom(r) && r.rooms.some((s) => s.roomNr === room.nr) && r.checkIn < to && r.checkOut > from,
    );
    if (taken) return [];
    const note = hk.state === "DIRTY" && from === TODAY ? `W sprzątaniu, gotowy ok. ${hk.readyAt}` : undefined;
    return [{ room, note }];
  });
}

export type Proposal = { stays: RoomStay[]; total: number };

/** Split a party across rooms (largest first); null when it can't be done. */
export function allocate(selected: Room[], party: Occupancy): RoomStay[] | null {
  if (selected.length === 0 || party.adults < selected.length) return null;
  const order = [...selected].sort((a, b) => ROOM_TYPES[b.type].maxPersons - ROOM_TYPES[a.type].maxPersons);
  let adults = party.adults;
  let children = party.children;
  let infants = party.infants;
  let pets = party.pets;
  const stays: RoomStay[] = [];
  order.forEach((room, i) => {
    const roomsLeft = order.length - i - 1;
    const cap = ROOM_TYPES[room.type].maxPersons;
    const a = Math.max(1, Math.min(adults - roomsLeft, cap));
    const c = Math.min(children, cap - a);
    const inf = infants > 0 && room.cribAllowed ? 1 : 0;
    const p = pets > 0 && room.petsAllowed ? pets : 0;
    adults -= a;
    children -= c;
    infants -= inf;
    pets -= p;
    stays.push({ roomNr: room.nr, adults: a, children: c, infants: inf, pets: p });
  });
  if (adults || children || infants || pets) return null;
  if (stays.some((s, i) => fitProblem(order[i], s))) return null;
  return stays;
}

/** Best single room, otherwise the cheapest pair of rooms. Clean rooms are preferred. */
export function propose(available: Availability[], party: Occupancy, nights: number): Proposal | null {
  const score = (stays: RoomStay[]) =>
    stays.reduce((sum, s) => {
      const a = available.find((x) => x.room.nr === s.roomNr)!;
      // A room still being cleaned only wins when it's clearly cheaper.
      return sum + roomStayPrice(a.room, s, nights) + (a.note ? 40 : 0);
    }, 0);

  let best: { stays: RoomStay[]; score: number } | null = null;
  for (const a of available) {
    const stays = allocate([a.room], party);
    if (stays) {
      const s = score(stays);
      if (!best || s < best.score) best = { stays, score: s };
    }
  }
  if (!best) {
    for (let i = 0; i < available.length; i++) {
      for (let j = i + 1; j < available.length; j++) {
        const stays = allocate([available[i].room, available[j].room], party);
        if (stays) {
          const s = score(stays);
          if (!best || s < best.score) best = { stays, score: s };
        }
      }
    }
  }
  if (!best) return null;
  const total = best.stays.reduce((sum, s) => sum + roomStayPrice(available.find((x) => x.room.nr === s.roomNr)!.room, s, nights), 0);
  return { stays: best.stays, total };
}

// ─── Formatting ───────────────────────────────────────────────────────────

export function nightsBetween(from: string, to: string) {
  return Math.max(0, differenceInCalendarDays(parseISO(to), parseISO(from)));
}

export function nightsLabel(n: number) {
  if (n === 1) return "noc";
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "noce" : "nocy";
}

export function formatPLN(n: number) {
  return `${n.toLocaleString("pl-PL")} zł`;
}

export function formatDay(iso: string) {
  return format(parseISO(iso), "d MMM", { locale: pl });
}

export function formatDayLong(iso: string) {
  return format(parseISO(iso), "EEEE, d MMMM yyyy", { locale: pl });
}

export function toISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function shiftDay(iso: string, days: number) {
  return toISO(addDays(parseISO(iso), days));
}

export function personsLabel(o: Occupancy) {
  const parts = [`${o.adults} ${o.adults === 1 ? "dorosły" : "dorosłych"}`];
  if (o.children) parts.push(`${o.children} ${o.children === 1 ? "dziecko" : "dzieci"} 3–12`);
  if (o.infants) parts.push(`${o.infants} ${o.infants === 1 ? "niemowlę" : "niemowląt"}`);
  if (o.pets) parts.push(`${o.pets} ${o.pets === 1 ? "zwierzę" : "zwierzęta"}`);
  return parts.join(", ");
}
