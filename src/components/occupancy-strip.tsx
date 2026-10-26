import { useMemo } from "react";
import { TODAY, blocksRoom, formatDay, shiftDay } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Owner's glance at occupancy. Deliberately quiet: one muted line, no colour alarms,
 * no interaction – it informs without competing with the reservation list.
 */
export function OccupancyStrip() {
  const { state } = useStore();

  const days = useMemo(() => {
    const total = state.rooms.length;
    return Array.from({ length: 7 }, (_, i) => {
      const day = shiftDay(TODAY, i);
      const occupied = new Set(
        state.reservations.filter((r) => blocksRoom(r) && r.checkIn <= day && r.checkOut > day).flatMap((r) => r.rooms.map((s) => s.roomNr)),
      ).size;
      return { day, occupied, total, pct: Math.round((occupied / total) * 100) };
    });
  }, [state]);

  const outOfOrder = state.rooms.filter((r) => r.housekeeping.state === "OUT_OF_ORDER" && r.housekeeping.until > TODAY).length;
  const cleaning = state.rooms.filter((r) => r.housekeeping.state === "DIRTY").length;
  const today = days[0];

  return (
    <section aria-label="Obłożenie hotelu" className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground print:hidden">
      <div className="flex items-center gap-2">
        <span>Obłożenie dziś</span>
        <span className="tabular font-medium text-foreground/80">
          {today.occupied}/{today.total} · {today.pct}%
        </span>
        <span aria-hidden className="h-1 w-20 overflow-hidden rounded-full bg-border">
          <span className="block h-full rounded-full bg-foreground/35" style={{ width: `${today.pct}%` }} />
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span>Najbliższe 7 dni</span>
        <ol className="flex h-4 items-end gap-0.5" aria-label="Obłożenie w kolejnych dniach">
          {days.map((d, i) => (
            <li key={d.day} title={`${formatDay(d.day)}: ${d.occupied}/${d.total} (${d.pct}%)`} className="flex h-full w-2 items-end rounded-sm bg-border">
              <span className={cn("block w-full rounded-sm", i === 0 ? "bg-foreground/50" : "bg-foreground/30")} style={{ height: `${Math.max(d.pct, 4)}%` }} />
              <span className="sr-only">
                {formatDay(d.day)}: {d.pct}%
              </span>
            </li>
          ))}
        </ol>
      </div>

      <span className="tabular">
        {outOfOrder} w naprawie · {cleaning} w sprzątaniu
      </span>
    </section>
  );
}
