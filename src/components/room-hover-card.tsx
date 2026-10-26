import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ROOM_TYPES, formatPLN, type Room } from "@/lib/domain";

/** Room details at a glance for questions at the desk. Opens on hover and on keyboard focus. */
export function RoomHoverCard({ room }: { room: Room }) {
  const type = ROOM_TYPES[room.type];
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="tabular rounded-sm font-medium underline decoration-dotted decoration-muted-foreground underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={`Pokój ${room.nr}: ${type.label}, piętro ${room.floor}`}
          onClick={(e) => e.stopPropagation()}
        >
          {room.nr}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Pokój {room.nr}</span>
          <span className="text-muted-foreground">Piętro {room.floor}</span>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Typ</dt>
          <dd>{type.label}</dd>
          <dt className="text-muted-foreground">Miejsca</dt>
          <dd>
            {type.beds} {type.maxPersons > type.beds ? `+ ${type.maxPersons - type.beds} dostawka` : ""}
          </dd>
          <dt className="text-muted-foreground">Cena bazowa</dt>
          <dd className="tabular">{formatPLN(room.basePrice)} / noc</dd>
          <dt className="text-muted-foreground">Zwierzęta</dt>
          <dd>{room.petsAllowed ? "Tak" : "Nie"}</dd>
        </dl>
        {room.features.length > 0 && <p className="mt-3 text-muted-foreground">{room.features.join(" · ")}</p>}
      </HoverCardContent>
    </HoverCard>
  );
}
