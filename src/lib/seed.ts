// Seed data built from the original prototype + the stress-test records,
// remodelled as rooms (inventory) and reservations (bookings).

import { reservationTotal, type Housekeeping, type Reservation, type Room, type RoomTypeId, type RoomStay } from "./domain";

const CLEAN: Housekeeping = { state: "CLEAN" };

function room(nr: string, type: RoomTypeId, basePrice: number, extra: Partial<Room> = {}): Room {
  return {
    nr,
    floor: Number(nr[0]),
    type,
    basePrice,
    petsAllowed: false,
    cribAllowed: type !== "SINGLE",
    features: [],
    housekeeping: CLEAN,
    ...extra,
  };
}

export const ROOMS: Room[] = [
  room("101", "SINGLE", 180),
  room("102", "DOUBLE", 250, { features: ["Balkon"] }),
  room("103", "FAMILY", 280, { housekeeping: { state: "DIRTY", readyAt: "14:00" } }),
  room("104", "SINGLE", 180),
  room("105", "STUDIO", 350, { housekeeping: { state: "OUT_OF_ORDER", until: "2024-12-30", reason: "Wymiana kranu" } }),
  room("106", "DOUBLE", 250),
  room("107", "SINGLE", 180),
  room("108", "DOUBLE", 250, { housekeeping: { state: "DIRTY", readyAt: "13:00" } }),
  room("109", "FAMILY", 320),
  room("110", "SINGLE", 170, { features: ["Okno na parking"] }),
  room("111", "STUDIO", 350, { features: ["Aneks kuchenny"] }),
  room("112", "DOUBLE", 250, { housekeeping: { state: "OUT_OF_ORDER", until: "2024-12-29", reason: "Klimatyzacja – serwis" } }),
  room("201", "DOUBLE", 250),
  room("202", "SINGLE", 180),
  room("203", "FAMILY", 320),
  room("204", "DOUBLE", 250),
  room("205", "DOUBLE", 250),
  room("206", "SINGLE", 180),
  room("207", "FAMILY", 320, { features: ["Połączony z 208"] }),
  room("208", "FAMILY", 320, { features: ["Połączony z 207"] }),
  room("209", "DOUBLE", 250, { housekeeping: { state: "DIRTY", readyAt: "15:00" } }),
  room("210", "SINGLE", 160),
  room("211", "STUDIO", 350),
  room("212", "STUDIO", 350),
  room("301", "DOUBLE", 250),
  room("302", "DOUBLE", 250),
  room("303", "SINGLE", 180),
  room("304", "DOUBLE", 280, { features: ["Widok na jezioro"] }),
  room("305", "DOUBLE", 250),
  room("306", "FAMILY", 320, { housekeeping: { state: "OUT_OF_ORDER", until: "2025-01-10", reason: "Malowanie po zalaniu" } }),
  room("307", "SINGLE", 180, { housekeeping: { state: "DIRTY", readyAt: "12:30" } }),
  room("308", "DOUBLE", 280, { features: ["Widok na jezioro"] }),
  room("309", "STUDIO", 380, { features: ["Widok na jezioro", "Aneks kuchenny"] }),
  room("310", "DOUBLE", 280, { features: ["Widok na jezioro"] }),
  room("311", "SINGLE", 180),
  room("312", "DOUBLE", 250, { petsAllowed: true, features: ["Przyjazny zwierzętom"] }),
  room("401", "FAMILY", 420, { petsAllowed: true, features: ["Poddasze", "2 łazienki"] }),
  room("402", "SINGLE", 160, { features: ["Poddasze, skos"] }),
  room("403", "SINGLE", 160, { features: ["Poddasze, skos"] }),
  room("404", "DOUBLE", 250, { housekeeping: { state: "DIRTY", readyAt: "15:30" } }),
  room("405", "DOUBLE", 250),
  room("406", "STUDIO", 380),
  room("407", "DOUBLE", 250, { petsAllowed: true, features: ["Przyjazny zwierzętom"] }),
  room("408", "SINGLE", 160, { housekeeping: { state: "OUT_OF_ORDER", until: "2024-12-29", reason: "Wymiana zamka" } }),
  room("409", "DOUBLE", 250),
  room("410", "FAMILY", 320),
];

const stay = (roomNr: string, adults: number, children = 0, infants = 0, pets = 0): RoomStay => ({ roomNr, adults, children, infants, pets });

type Seed = Omit<Reservation, "total" | "paid" | "createdAt"> & { paid: "full" | "none" | number };

const seeds: Seed[] = [
  // In house
  { id: "R-1021", rooms: [stay("201", 2)], guest: { firstName: "Piotr", lastName: "Zieliński", phone: "+44 7123 456 789", email: "piotr.z@email.co.uk" }, checkIn: "2024-12-25", checkOut: "2025-01-03", source: "WEBSITE", status: "CHECKED_IN", method: "TRANSFER", paid: "full", notes: "VIP, późny checkout" },
  { id: "R-1024", rooms: [stay("111", 1)], guest: { firstName: "Ahmed", lastName: "Al-Rashid", phone: "+971 50 123 4567", email: "a.alrashid@gmail.com" }, checkIn: "2024-12-20", checkOut: "2025-01-05", source: "WEBSITE", status: "CHECKED_IN", method: "CARD", paid: "full", notes: "Długi pobyt, sprzątanie co 2 dni" },
  { id: "R-1026", rooms: [stay("210", 1)], guest: { firstName: "Oleksandr", lastName: "Shevchenko", phone: "+380 67 123 4567", email: "o.shevchenko@ukr.net" }, checkIn: "2024-12-22", checkOut: "2025-01-08", source: "AGENCY", status: "CHECKED_IN", method: "TRANSFER", paid: 1360, notes: "Rabat długoterminowy -10% (rozliczany przez biuro)" },
  { id: "R-1030", rooms: [stay("406", 1)], guest: { firstName: "Jean-Baptiste", lastName: "Lefèvre-Dubois", phone: "+33 6 12 34 56 78", email: "jb.lefevre-dubois@orange.fr" }, checkIn: "2024-12-23", checkOut: "2024-12-28", source: "BOOKING", status: "CHECKED_IN", method: "OTA", paid: "full", notes: "Wyjazd dziś, jeszcze nie oddał klucza" },
  { id: "R-1032", rooms: [stay("109", 2, 2, 1)], guest: { firstName: "Joanna", lastName: "Nowak", phone: "+48 501 765 432", email: "nowak.rodzina@wp.pl" }, checkIn: "2024-12-26", checkOut: "2025-01-02", source: "PHONE", status: "CHECKED_IN", method: "TRANSFER", paid: "full", notes: "Alergia na orzechy (dziecko)" },
  { id: "R-1033", rooms: [stay("401", 2, 3, 1)], guest: { firstName: "Daan", lastName: "van der Berg", phone: "+31 6 1234 5678", email: "vanderberg@ziggo.nl" }, checkIn: "2024-12-26", checkOut: "2025-01-01", source: "BOOKING", status: "CHECKED_IN", method: "OTA", paid: "full", notes: "Parking na busa (B1–B2)" },
  { id: "R-1035", rooms: [stay("106", 2)], guest: { firstName: "Katarzyna", lastName: "Lewandowska-Kowalczyk", phone: "+48 600 111 222", email: "katarzyna.lewandowska-kowalczyk@przedsiebiorstwo-budowlane.com.pl" }, checkIn: "2024-12-27", checkOut: "2024-12-31", source: "WEBSITE", status: "CHECKED_IN", method: "CARD", paid: "full", notes: "Sylwester – stolik w restauracji na 20:00, prosi o pokój z dala od windy" },
  { id: "R-1036", rooms: [stay("104", 1)], guest: { firstName: "Maria", lastName: "Wiśniewska", phone: "+48 791 234 567", email: "maria.w@company.pl" }, checkIn: "2024-12-27", checkOut: "2024-12-30", source: "PHONE", status: "CHECKED_IN", method: "INVOICE", paid: "none", notes: "FV na firmę ABC Sp. z o.o., termin 14 dni" },
  { id: "R-1037", rooms: [stay("203", 2, 2)], guest: { firstName: "Klaus", lastName: "Schmidt", phone: "+49 123 456 7890", email: "schmidt@deutsche.de" }, checkIn: "2024-12-27", checkOut: "2024-12-29", source: "BOOKING", status: "CHECKED_IN", method: "CARD", paid: "full", notes: "Dzieci 5 i 8 lat" },
  { id: "R-1038", rooms: [stay("308", 2)], guest: { firstName: "Wei", lastName: "Li", phone: "+86 138 1234 5678", email: "li.wei@163.com" }, checkIn: "2024-12-27", checkOut: "2025-01-03", source: "BOOKING", status: "CHECKED_IN", method: "OTA", paid: "full", notes: "Śniadanie wegetariańskie, komunikacja po angielsku" },
  { id: "R-1039", rooms: [stay("311", 1)], guest: { firstName: "Krzysztof", lastName: "Zieliński", phone: "+48 600 700 800", email: "k.zielinski@corp.com" }, checkIn: "2024-12-27", checkOut: "2024-12-28", source: "PHONE", status: "CHECKED_IN", method: "INVOICE", paid: "none", notes: "Późny checkout do 16:00 (+50 zł)" },
  { id: "R-1040", rooms: [stay("206", 1)], guest: { firstName: "Ewa", lastName: "Mazur", phone: "+48 784 555 001", email: "ewa.mazur@firma.pl" }, checkIn: "2024-12-27", checkOut: "2024-12-28", source: "WEBSITE", status: "CHECKED_IN", method: "CARD", paid: "none", notes: "Płatność przy wymeldowaniu" },
  { id: "R-1044", rooms: [stay("205", 2)], guest: { firstName: "Jan", lastName: "Kowalski", docType: "ID_CARD", docNumber: "ABC123456", phone: "+48 691 002 003", email: "jan.kowalski.lodz@interia.pl" }, checkIn: "2024-12-28", checkOut: "2024-12-29", source: "WALK_IN", status: "CHECKED_IN", method: "CASH", paid: "full", notes: "Inny Jan Kowalski niż w R-1045" },

  // Already left
  { id: "R-1018", rooms: [stay("103", 2, 1)], guest: { firstName: "Anna", lastName: "Nowak", phone: "+48 601 234 567", email: "a.nowak@gmail.com" }, checkIn: "2024-12-26", checkOut: "2024-12-28", source: "WEBSITE", status: "CHECKED_OUT", method: "CASH", paid: "full", notes: "" },
  { id: "R-1019", rooms: [stay("108", 2)], guest: { firstName: "Tomasz", lastName: "Nowak", phone: "+48 512 345 678", email: "t.nowak@onet.pl" }, checkIn: "2024-12-24", checkOut: "2024-12-28", source: "PHONE", status: "CHECKED_OUT", method: "CASH", paid: "full", notes: "" },
  { id: "R-1020", rooms: [stay("307", 1)], guest: { firstName: "Marek", lastName: "Wójcik", phone: "+48 605 404 404", email: "" }, checkIn: "2024-12-25", checkOut: "2024-12-28", source: "WALK_IN", status: "CHECKED_OUT", method: "CASH", paid: "full", notes: "Zostawił ładowarkę – w recepcji" },
  { id: "R-1011", rooms: [stay("107", 1)], guest: { firstName: "Tomasz", lastName: "Lis", phone: "+48 502 111 333", email: "tomasz.lis@gmail.com" }, checkIn: "2024-12-20", checkOut: "2024-12-23", source: "BOOKING", status: "CHECKED_OUT", method: "OTA", paid: "full", notes: "" },

  // Arriving today
  { id: "R-1045", rooms: [stay("102", 2)], guest: { firstName: "Jan", lastName: "Kowalski", phone: "+48 501 234 567", email: "j.kowalski@example.com" }, checkIn: "2024-12-28", checkOut: "2025-01-02", source: "WEBSITE", status: "UPCOMING", method: "CARD", paid: "full", notes: "Śniadanie 7:30, parking A5" },
  { id: "R-1046", rooms: [stay("211", 2), stay("212", 2), stay("301", 2), stay("302", 2)], guest: { firstName: "Karolina", lastName: "Wrona", phone: "+48 22 123 45 67", email: "eventy@acme.pl" }, checkIn: "2024-12-28", checkOut: "2024-12-30", source: "PHONE", status: "UPCOMING", method: "INVOICE", paid: "none", notes: "Grupa ACME, integracja firmowa – jedna faktura na 4 pokoje" },
  { id: "R-1047", rooms: [stay("310", 2)], guest: { firstName: "Agnieszka", lastName: "Kamińska", phone: "+48 509 876 543", email: "kaminscy.slub@gmail.com" }, checkIn: "2024-12-28", checkOut: "2025-01-04", source: "WEBSITE", status: "UPCOMING", method: "TRANSFER", paid: "full", notes: "Podróż poślubna – szampan i kwiaty przed przyjazdem, nie mówić gościom" },
  { id: "R-1048", rooms: [stay("405", 1)], guest: { firstName: "Anna", lastName: "Nowak", phone: "+48 601 111 999", email: "anna.nowak@o2.pl" }, checkIn: "2024-12-28", checkOut: "2024-12-30", source: "WEBSITE", status: "UPCOMING", method: "CARD", paid: "full", notes: "Inna Anna Nowak niż w R-1018" },
  { id: "R-1049", rooms: [stay("409", 2)], guest: { firstName: "Magdalena", lastName: "Szymańska", phone: "", email: "m.szymanska@gmail.com" }, checkIn: "2024-12-28", checkOut: "2024-12-29", source: "PHONE", status: "UPCOMING", method: "CARD", paid: "none", notes: "Może przedłużyć – potwierdzi przy przyjeździe" },
  { id: "R-1050", rooms: [stay("303", 1)], guest: { firstName: "Robert", lastName: "Maj", phone: "+48 600 222 444", email: "r.maj@gmail.com" }, checkIn: "2024-12-27", checkOut: "2024-12-28", source: "BOOKING", status: "NO_SHOW", method: "OTA", paid: "full", notes: "Opłata za brak przyjazdu pobrana przez Booking.com" },

  // Future
  { id: "R-1052", rooms: [stay("304", 2)], guest: { firstName: "Sophie", lastName: "Müller", phone: "+49 151 1234 5678", email: "sophie.mueller@web.de" }, checkIn: "2024-12-29", checkOut: "2025-01-02", source: "BOOKING", status: "UPCOMING", method: "CARD", paid: "none", notes: "Płatność na miejscu" },
  { id: "R-1053", rooms: [stay("204", 2)], guest: { firstName: "Natalia", lastName: "Pawlak", phone: "+48 692 333 111", email: "n.pawlak@gmail.com" }, checkIn: "2024-12-29", checkOut: "2024-12-31", source: "PHONE", status: "UPCOMING", method: "CASH", paid: "none", notes: "" },
  { id: "R-1054", rooms: [stay("312", 2, 0, 0, 1)], guest: { firstName: "Paweł", lastName: "Grabowski", phone: "+48 503 909 808", email: "pawel.grabowski@gmail.com" }, checkIn: "2024-12-30", checkOut: "2025-01-02", source: "WEBSITE", status: "UPCOMING", method: "CARD", paid: "full", notes: "Pies (beagle), prosi o pokój na parterze jeśli możliwe" },
  { id: "R-1055", rooms: [stay("309", 2)], guest: { firstName: "Zofia", lastName: "Krawczyk", phone: "+48 604 515 151", email: "z.krawczyk@wp.pl" }, checkIn: "2025-01-03", checkOut: "2025-01-06", source: "AGENCY", status: "UPCOMING", method: "TRANSFER", paid: "full", notes: "" },
  { id: "R-1056", rooms: [stay("207", 2, 1), stay("208", 2)], guest: { firstName: "Marcin", lastName: "Dąbrowski", phone: "+48 607 123 321", email: "m.dabrowski@outlook.com" }, checkIn: "2025-01-10", checkOut: "2025-01-12", source: "WEBSITE", status: "UPCOMING", method: "TRANSFER", paid: 400, notes: "Dwie rodziny, pokoje połączone. Zaliczka 400 zł" },

  // Cancelled
  { id: "R-1042", rooms: [stay("305", 2)], guest: { firstName: "Hanna", lastName: "Kurek", phone: "+48 698 765 432", email: "hanna.kurek@gmail.com" }, checkIn: "2024-12-29", checkOut: "2024-12-31", source: "WEBSITE", status: "CANCELLED", method: "CARD", paid: "full", notes: "", cancellation: { reason: "Zmiana planów gościa", note: "Zadzwoniła 27.12", refund: 500 } },
];

export const RESERVATIONS: Reservation[] = seeds.map((s) => {
  const total = reservationTotal(ROOMS, s.rooms, s.checkIn, s.checkOut);
  const paid = s.paid === "full" ? total : s.paid === "none" ? 0 : s.paid;
  // A refund lowers what the hotel actually holds.
  const net = s.cancellation ? paid - s.cancellation.refund : paid;
  return { ...s, total, paid: net, createdAt: s.checkIn };
});
