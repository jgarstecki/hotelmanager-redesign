import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { CancelDialog } from "@/components/cancel-dialog";
import { CaseStudy } from "@/components/case-study";
import { NewReservationDialog } from "@/components/new-reservation-dialog";
import { ReservationSheet } from "@/components/reservation-sheet";
import { ReservationsPage, type View } from "@/components/reservations-page";
import type { Occupancy } from "@/lib/domain";
import { StoreProvider } from "@/lib/store";

// Hash routes keep GitHub Pages happy: #/?s=<section> = case study, #/prototyp?s=<scenario> = the app.
type Route = { page: "case" | "app"; scenario: string | null };

function readRoute(): Route {
  const [path, query = ""] = window.location.hash.replace(/^#/, "").split("?");
  return { page: path.startsWith("/prototyp") ? "app" : "case", scenario: new URLSearchParams(query).get("s") };
}

/** Deep links from the case study straight into a flow, so a reviewer sees the exact solution. */
const SCENARIOS: Record<string, { party?: Occupancy; walkIn?: boolean; view?: View; open?: string; cancel?: string }> = {
  walkin: { walkIn: true },
  "walkin-group": { walkIn: true, party: { adults: 4, children: 2, infants: 0, pets: 0 } },
  "walkin-pet": { walkIn: true, party: { adults: 2, children: 0, infants: 0, pets: 1 } },
  checkout: { view: "DEPARTURES", open: "R-1040" },
  edit: { open: "R-1045" },
  group: { open: "R-1046" },
  cancel: { cancel: "R-1047" },
};

export default function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title = route.page === "app" ? "Prototyp – HotelManager PRO" : "HotelManager PRO – redesign listy rezerwacji · Jan Garstecki";
  }, [route.page]);

  // The store lives above both pages, so going back to the case study keeps the prototype's state.
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={300}>
        {route.page === "case" ? <CaseStudy section={route.scenario} /> : <Prototype scenario={route.scenario} />}
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </StoreProvider>
  );
}

function Prototype({ scenario }: { scenario: string | null }) {
  const [creating, setCreating] = useState(false);
  const [party, setParty] = useState<Occupancy | undefined>();
  const [dialogKey, setDialogKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [viewRequest, setViewRequest] = useState<{ view: View; nonce: number }>();

  const startWalkIn = (p?: Occupancy) => {
    setParty(p);
    setDialogKey((k) => k + 1);
    setCreating(true);
  };

  useEffect(() => {
    const s = scenario ? SCENARIOS[scenario] : undefined;
    if (!s) return;
    setOpenId(null);
    setCancelId(null);
    setCreating(false);
    if (s.view) setViewRequest({ view: s.view, nonce: Date.now() });
    // Let the page settle before an overlay opens on top of it.
    const t = window.setTimeout(() => {
      if (s.walkIn) startWalkIn(s.party);
      if (s.open) setOpenId(s.open);
      if (s.cancel) setCancelId(s.cancel);
    }, 150);
    // Drop the scenario from the URL so a refresh doesn't replay it.
    history.replaceState(null, "", "#/prototyp");
    return () => window.clearTimeout(t);
  }, [scenario]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-12 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow">
        Przejdź do treści
      </a>
      <PresentationBar />
      <div className="flex min-h-[calc(100svh-2.5rem)]">
        <div className="print:hidden">
          <AppSidebar />
        </div>
        <ReservationsPage onNew={() => startWalkIn()} onOpen={setOpenId} onCancel={setCancelId} viewRequest={viewRequest} />
      </div>
      <NewReservationDialog key={dialogKey} open={creating} onOpenChange={setCreating} onShow={setOpenId} initialParty={party} />
      <ReservationSheet id={openId} onClose={() => setOpenId(null)} onCancel={setCancelId} />
      <CancelDialog id={cancelId} onClose={() => setCancelId(null)} />
    </>
  );
}

/** Meta bar that belongs to the presentation, not to the product – visually separate from the app. */
function PresentationBar() {
  return (
    <div className="sticky top-0 z-40 flex h-10 items-center justify-between gap-4 bg-foreground px-4 text-xs text-background/80 print:hidden">
      <a href="#/" className="inline-flex items-center gap-1.5 rounded-sm font-medium text-background hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background">
        <ArrowLeft className="size-3.5" aria-hidden /> Opis projektu
      </a>
      <span className="hidden sm:inline">Prototyp · redesign listy rezerwacji · Jan Garstecki</span>
      <a href="#/?s=co-zmienilem" className="rounded-sm hover:text-background hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background">
        Scenariusze do sprawdzenia
      </a>
    </div>
  );
}
