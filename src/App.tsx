import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { CancelDialog } from "@/components/cancel-dialog";
import { NewReservationDialog } from "@/components/new-reservation-dialog";
import { ReservationSheet } from "@/components/reservation-sheet";
import { ReservationsPage } from "@/components/reservations-page";
import { StoreProvider } from "@/lib/store";

export default function App() {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  return (
    <StoreProvider>
      <TooltipProvider delayDuration={300}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow">
          Przejdź do treści
        </a>
        <div className="flex min-h-svh">
          <div className="print:hidden">
            <AppSidebar />
          </div>
          <ReservationsPage onNew={() => setCreating(true)} onOpen={setOpenId} onCancel={setCancelId} />
        </div>
        <NewReservationDialog open={creating} onOpenChange={setCreating} onShow={setOpenId} />
        <ReservationSheet id={openId} onClose={() => setOpenId(null)} onCancel={setCancelId} />
        <CancelDialog id={cancelId} onClose={() => setCancelId(null)} />
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </StoreProvider>
  );
}
