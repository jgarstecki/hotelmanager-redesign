import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

/** Labelled stepper – reads as one control to screen readers ("Dorośli, 2"). */
export function Counter({ label, hint, value, min = 0, max = 10, onChange }: Props) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div id={id} className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div role="group" aria-labelledby={id} className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" className="size-9" aria-label={`${label}: mniej`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus className="size-4" />
        </Button>
        <output aria-live="polite" className="tabular w-8 text-center text-base font-semibold">
          {value}
        </output>
        <Button type="button" variant="outline" size="icon" className="size-9" aria-label={`${label}: więcej`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
