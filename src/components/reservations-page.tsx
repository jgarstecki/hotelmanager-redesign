import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Printer, RotateCw, Search, X } from "lucide-react";
import { parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PaymentBadge, StatusBadge } from "@/components/badges";
import { RoomHoverCard } from "@/components/room-hover-card";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  SOURCES,
  STATUSES,
  TODAY,
  formatDay,
  formatDayLong,
  formatPLN,
  isActive,
  nightsBetween,
  nightsLabel,
  toISO,
  type Reservation,
  type Source,
} from "@/lib/domain";
import { useStore } from "@/lib/store";

type View = "ACTIVE" | "ARRIVALS" | "DEPARTURES" | "IN_HOUSE" | "ARCHIVE" | "ALL";

const VIEWS: { id: View; label: string; test: (r: Reservation) => boolean }[] = [
  { id: "ACTIVE", label: "Aktywne", test: isActive },
  { id: "ARRIVALS", label: "Przyjazdy dziś", test: (r) => r.checkIn === TODAY && isActive(r) },
  { id: "DEPARTURES", label: "Wyjazdy dziś", test: (r) => r.checkOut === TODAY && (r.status === "CHECKED_IN" || r.status === "CHECKED_OUT") },
  { id: "IN_HOUSE", label: "W hotelu", test: (r) => r.status === "CHECKED_IN" },
  { id: "ARCHIVE", label: "Archiwum", test: (r) => !isActive(r) },
  { id: "ALL", label: "Wszystkie", test: () => true },
];

const PAGE_SIZE = 12;

type Props = { onNew: () => void; onOpen: (id: string) => void; onCancel: (id: string) => void };

export function ReservationsPage({ onNew, onOpen, onCancel }: Props) {
  const { state } = useStore();
  const [view, setView] = useState<View>("ACTIVE");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source | "ALL">("ALL");
  const [range, setRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(0);

  const roomByNr = useMemo(() => new Map(state.rooms.map((r) => [r.nr, r])), [state.rooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = range?.from ? toISO(range.from) : undefined;
    const to = range?.to ? toISO(range.to) : from;
    const test = VIEWS.find((v) => v.id === view)!.test;
    return state.reservations
      .filter(test)
      .filter((r) => source === "ALL" || r.source === source)
      .filter((r) => !from || !to || (r.checkIn <= to && r.checkOut >= from))
      .filter(
        (r) =>
          !q ||
          [r.id, `${r.guest.firstName} ${r.guest.lastName}`, r.guest.email, r.notes, ...r.rooms.map((s) => s.roomNr)].some((v) => v.toLowerCase().includes(q)) ||
          // Phones are typed with or without spaces
          r.guest.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
      )
      .sort((a, b) => (view === "ARCHIVE" ? b.checkIn.localeCompare(a.checkIn) : a.checkIn.localeCompare(b.checkIn) || a.id.localeCompare(b.id)));
  }, [state.reservations, view, query, source, range]);

  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, state.reservations.filter(v.test).length])) as Record<View, number>, [state.reservations]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = query || source !== "ALL" || range;

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(0);
  };

  const clearFilters = () => {
    setQuery("");
    setSource("ALL");
    setRange(undefined);
    setPage(0);
  };

  const exportCsv = () => {
    const header = ["ID", "Pokoje", "Gość", "Telefon", "E-mail", "Przyjazd", "Wyjazd", "Noce", "Kwota", "Metoda", "Źródło", "Status", "Uwagi"];
    const rows = filtered.map((r) => [
      r.id,
      r.rooms.map((s) => s.roomNr).join(" "),
      `${r.guest.firstName} ${r.guest.lastName}`,
      r.guest.phone,
      r.guest.email,
      r.checkIn,
      r.checkOut,
      nightsBetween(r.checkIn, r.checkOut),
      r.total,
      PAYMENT_METHODS[r.method],
      SOURCES[r.source],
      STATUSES[r.status],
      r.notes,
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `rezerwacje-${TODAY}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Pobrano ${filtered.length} rezerwacji (CSV)`);
  };

  return (
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8" id="main">
      {/* Title row with actions aligned right */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDayLong(TODAY)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Rezerwacje</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Odśwież listę" onClick={() => toast("Lista jest aktualna", { description: "Ostatnia synchronizacja: przed chwilą" })}>
                <RotateCw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Odśwież</TooltipContent>
          </Tooltip>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Drukuj
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="size-4" /> Pobierz
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{filtered.length} rezerwacji wg filtrów</DropdownMenuLabel>
              <DropdownMenuItem onSelect={exportCsv}>CSV (Excel, Numbers)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => window.print()}>PDF (przez drukowanie)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nowa rezerwacja
          </Button>
        </div>
      </div>

      {/* Views = reservation status shortcuts with live counts */}
      <div role="tablist" aria-label="Widok" className="mt-6 flex gap-1 overflow-x-auto border-b print:hidden">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => resetPage(setView)(v.id)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
              view === v.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
            <span className={cn("tabular rounded-full px-1.5 text-xs", view === v.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{counts[v.id]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3 print:hidden">
        <div className="grid gap-1.5">
          <label htmlFor="search" className="text-xs font-medium text-muted-foreground">
            Szukaj
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="search" value={query} onChange={(e) => resetPage(setQuery)(e.target.value)} className="w-72 pl-8" placeholder="Gość, pokój, telefon, e-mail, nr rezerwacji" />
          </div>
        </div>

        <div className="grid gap-1.5">
          <span id="dates-label" className="text-xs font-medium text-muted-foreground">
            Termin pobytu
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" aria-labelledby="dates-label dates-value" className={cn("w-60 justify-start font-normal", !range && "text-muted-foreground")}>
                <CalendarDays className="size-4" />
                <span id="dates-value">
                  {range?.from ? (range.to && range.to.getTime() !== range.from.getTime() ? `${formatDay(toISO(range.from))} – ${formatDay(toISO(range.to))}` : formatDay(toISO(range.from))) : "Dowolny"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-wrap gap-2 border-b p-3">
                {[
                  ["Dziś", 0, 0],
                  ["Jutro", 1, 1],
                  ["Najbliższe 7 dni", 0, 6],
                ].map(([label, a, b]) => (
                  <Button
                    key={label as string}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const d = parseISO(TODAY);
                      resetPage(setRange)({ from: new Date(d.getTime() + (a as number) * 864e5), to: new Date(d.getTime() + (b as number) * 864e5) });
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Calendar mode="range" locale={pl} numberOfMonths={2} defaultMonth={range?.from ?? parseISO(TODAY)} selected={range} onSelect={resetPage(setRange)} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-1.5">
          <span id="source-label" className="text-xs font-medium text-muted-foreground">
            Źródło
          </span>
          <Select value={source} onValueChange={(v) => resetPage(setSource)(v as Source | "ALL")}>
            <SelectTrigger className="w-44" aria-labelledby="source-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie źródła</SelectItem>
              {(Object.keys(SOURCES) as Source[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SOURCES[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="size-4" /> Wyczyść filtry
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <Table className="text-sm">
          <TableHeader className="bg-muted/60">
            <TableRow>
              {["Nr", "Pokój", "Gość i uwagi", "Kontakt", "Pobyt", "Kwota", "Płatność", "Źródło", "Status"].map((h) => (
                <TableHead key={h} className={cn("h-10 text-xs font-medium whitespace-nowrap text-muted-foreground", h === "Kwota" && "text-right")}>
                  {h}
                </TableHead>
              ))}
              <TableHead className="h-10">
                <span className="sr-only">Akcje</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => {
              const nights = nightsBetween(r.checkIn, r.checkOut);
              const isNew = r.id === state.lastCreatedId;
              return (
                <TableRow key={r.id} className={cn("cursor-pointer", isNew && "bg-primary/5", !isActive(r) && "text-muted-foreground")} onClick={() => onOpen(r.id)}>
                  <TableCell className="tabular text-xs whitespace-nowrap text-muted-foreground">{r.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {r.rooms.map((s) => (
                        <RoomHoverCard key={s.roomNr} room={roomByNr.get(s.roomNr)!} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 min-w-44">
                    <div className="truncate font-medium text-foreground" title={`${r.guest.firstName} ${r.guest.lastName}`}>
                      {r.guest.firstName} {r.guest.lastName}
                      {isNew && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">Nowa</span>}
                    </div>
                    {r.notes && (
                      <div className="truncate text-xs text-muted-foreground" title={r.notes}>
                        {r.notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-44">
                    <div className="tabular whitespace-nowrap">{r.guest.phone || <span className="text-muted-foreground">brak telefonu</span>}</div>
                    <div className="truncate text-xs text-muted-foreground" title={r.guest.email}>
                      {r.guest.email || "brak e-maila"}
                    </div>
                  </TableCell>
                  <TableCell className="tabular whitespace-nowrap">
                    <div>
                      {formatDay(r.checkIn)} – {formatDay(r.checkOut)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {nights} {nightsLabel(nights)}
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-right font-medium whitespace-nowrap text-foreground">{formatPLN(r.total)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-muted-foreground">{PAYMENT_METHODS[r.method]}</span>
                      <PaymentBadge reservation={r} />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-28">{SOURCES[r.source]}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Akcje dla ${r.id}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onOpen(r.id)}>Szczegóły i edycja</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" disabled={!isActive(r)} onSelect={() => onCancel(r.id)}>
                          Anuluj rezerwację
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-16 text-center">
                  <p className="font-medium text-foreground">Brak rezerwacji dla tych filtrów</p>
                  <p className="mt-1 text-muted-foreground">Zmień widok albo wyczyść filtry.</p>
                  {hasFilters && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Wyczyść filtry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground print:hidden">
        <span className="tabular" aria-live="polite">
          {filtered.length === 0 ? "0 rezerwacji" : `${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + visible.length} z ${filtered.length}`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="size-4" /> Poprzednia
          </Button>
          <span className="tabular px-1">
            {current + 1} / {pages}
          </span>
          <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            Następna <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
