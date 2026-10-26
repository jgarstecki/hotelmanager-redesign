import { useId, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

type Props = { before: string; after: string; beforeAlt: string; afterAlt: string };

/**
 * Before/after comparison: both screenshots share one frame, the original is masked from the right.
 * A native range input sits on top, so dragging, clicking and the keyboard all work without custom handlers.
 */
export function CompareSlider({ before, after, beforeAlt, afterAlt }: Props) {
  const [pos, setPos] = useState(50);
  const id = useId();

  return (
    <figure>
      <div className="relative isolate overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-8px_rgb(0_0_0/0.12)] select-none">
        <img src={after} alt={afterAlt} width={1440} height={900} className="block h-auto w-full" draggable={false} />
        <img
          src={before}
          alt={beforeAlt}
          width={1440}
          height={900}
          draggable={false}
          className="absolute inset-0 block h-full w-full"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-foreground/80 px-2 py-1 text-xs font-medium text-background" style={{ opacity: pos > 12 ? 1 : 0 }}>
          Oryginał
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground" style={{ opacity: pos < 88 ? 1 : 0 }}>
          Po redesignie
        </span>

        {/* Divider and handle follow the input's value. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-background text-foreground shadow-md">
            <ChevronsLeftRight className="size-5" />
          </span>
        </div>

        <label htmlFor={id} className="sr-only">
          Porównanie: przesuń, żeby odsłonić oryginał albo redesign
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-valuetext={`${pos}% oryginału widoczne`}
          className="peer absolute inset-0 h-full w-full cursor-ew-resize touch-pan-y appearance-none opacity-0"
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl ring-ring/60 peer-focus-visible:ring-4" />
      </div>
      <figcaption className="mt-3 text-sm text-muted-foreground">Przeciągnij suwak, żeby porównać oryginał z nowym ekranem. Działa też strzałkami na klawiaturze.</figcaption>
    </figure>
  );
}
