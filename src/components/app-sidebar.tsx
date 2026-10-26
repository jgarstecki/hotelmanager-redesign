import { BarChart3, BedDouble, CalendarRange, CircleHelp, CreditCard, Home, Mail, Settings, Users, UtensilsCrossed, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Start", icon: Home },
  { label: "Rezerwacje", icon: CalendarRange, active: true },
  { label: "Pokoje", icon: BedDouble },
  { label: "Goście", icon: Users },
  { label: "Płatności", icon: CreditCard },
  { label: "Raporty", icon: BarChart3 },
  { label: "Wiadomości", icon: Mail, badge: 12 },
  { label: "Personel", icon: BriefcaseBusiness },
  { label: "Restauracja", icon: UtensilsCrossed },
];

const outOfScope = (label: string) => () => toast(`${label} – poza zakresem zadania`, { description: "Redesign obejmuje tylko ekran rezerwacji." });

function NavItem({ label, icon: Icon, active, badge }: { label: string; icon: typeof Home; active?: boolean; badge?: number }) {
  return (
    <a
      href={active ? "#" : undefined}
      role={active ? undefined : "button"}
      tabIndex={0}
      aria-current={active ? "page" : undefined}
      onClick={active ? undefined : outOfScope(label)}
      onKeyDown={(e) => {
        if (!active && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          outOfScope(label)();
        }
      }}
      className={cn(
        "flex h-9 cursor-pointer items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="tabular rounded-full bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground" aria-label={`${badge} nieprzeczytanych`}>
          {badge}
        </span>
      ) : null}
    </a>
  );
}

export function AppSidebar() {
  return (
    <aside className="sticky top-10 hidden h-[calc(100svh-2.5rem)] w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex" aria-label="Nawigacja główna">
      <div className="flex items-center gap-3 px-5 pt-5 pb-6">
        <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground" aria-hidden>
          H
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-accent-foreground">HotelManager PRO</div>
          <div className="text-xs">ACME Corp Hotel</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 px-3 pb-3">
        <NavItem label="Ustawienia" icon={Settings} />
        <NavItem label="Pomoc" icon={CircleHelp} />
      </div>

      <div className="border-t border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground" aria-hidden>
            AD
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium text-sidebar-accent-foreground">admin@hotel.pl</div>
            <div className="text-xs">Recepcja · zalogowano 09:15</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span>v2.3.1a</span>
          <span>
            <span className="font-semibold text-sidebar-accent-foreground">PL</span> · EN
          </span>
        </div>
      </div>
    </aside>
  );
}
