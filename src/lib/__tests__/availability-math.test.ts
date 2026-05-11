import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeAvailableUnits, intervalsOverlap } from "@/lib/availability";

// ── computeAvailableUnits ────────────────────────────────────────────────────

describe("computeAvailableUnits", () => {
  const totalUnits    = fc.integer({ min: 1, max: 1000 });
  const reservedUnits = (total: number) => fc.integer({ min: 0, max: total });

  it("nunca devuelve un valor negativo", () => {
    fc.assert(
      fc.property(
        totalUnits.chain((t) =>
          fc.tuple(
            fc.constant(t),
            fc.integer({ min: 0, max: t * 2 }), // reserva puede superar el total
            fc.boolean()
          )
        ),
        ([total, reserved, blocked]) => {
          expect(computeAvailableUnits(total, reserved, blocked)).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  it("nunca supera totalUnits", () => {
    fc.assert(
      fc.property(
        totalUnits.chain((t) =>
          fc.tuple(fc.constant(t), reservedUnits(t), fc.boolean())
        ),
        ([total, reserved, blocked]) => {
          expect(computeAvailableUnits(total, reserved, blocked)).toBeLessThanOrEqual(total);
        }
      )
    );
  });

  it("sin reservas ni bloqueos, devuelve totalUnits completo", () => {
    fc.assert(
      fc.property(totalUnits, (total) => {
        expect(computeAvailableUnits(total, 0, false)).toBe(total);
      })
    );
  });

  it("con bloqueo manual, devuelve 0 independientemente de las reservas", () => {
    fc.assert(
      fc.property(
        totalUnits.chain((t) =>
          fc.tuple(fc.constant(t), reservedUnits(t))
        ),
        ([total, reserved]) => {
          expect(computeAvailableUnits(total, reserved, true)).toBe(0);
        }
      )
    );
  });

  it("con reservas que agotan el stock, devuelve 0", () => {
    fc.assert(
      fc.property(totalUnits, (total) => {
        expect(computeAvailableUnits(total, total, false)).toBe(0);
      })
    );
  });

  it("disponibilidad = total - reservado cuando no hay bloqueo manual", () => {
    fc.assert(
      fc.property(
        totalUnits.chain((t) => fc.tuple(fc.constant(t), reservedUnits(t))),
        ([total, reserved]) => {
          expect(computeAvailableUnits(total, reserved, false)).toBe(total - reserved);
        }
      )
    );
  });
});

// ── intervalsOverlap ─────────────────────────────────────────────────────────

// Genera un par de fechas ordenadas (start < end) a partir de un timestamp base
const dateInterval = fc
  .tuple(
    fc.integer({ min: 0, max: 1_000_000 }),
    fc.integer({ min: 1, max: 86_400 })  // duración mínima 1 s
  )
  .map(([base, duration]) => {
    const start = new Date(base * 1000);
    const end   = new Date((base + duration) * 1000);
    return { start, end };
  });

describe("intervalsOverlap", () => {
  it("un intervalo siempre se solapa con sí mismo", () => {
    fc.assert(
      fc.property(dateInterval, ({ start, end }) => {
        expect(intervalsOverlap(start, end, start, end)).toBe(true);
      })
    );
  });

  it("es conmutativo: A∩B == B∩A", () => {
    fc.assert(
      fc.property(dateInterval, dateInterval, (a, b) => {
        expect(intervalsOverlap(a.start, a.end, b.start, b.end)).toBe(
          intervalsOverlap(b.start, b.end, a.start, a.end)
        );
      })
    );
  });

  it("sin solapamiento cuando un intervalo termina antes de que el otro empiece", () => {
    fc.assert(
      fc.property(
        dateInterval,
        fc.integer({ min: 1, max: 3600 }),
        ({ start, end }, gap) => {
          // [start, end) ... [end+gap, end+gap+1s)
          const laterStart = new Date(end.getTime() + gap * 1000);
          const laterEnd   = new Date(laterStart.getTime() + 1000);
          expect(intervalsOverlap(start, end, laterStart, laterEnd)).toBe(false);
        }
      )
    );
  });

  it("hay solapamiento cuando B empieza dentro de A", () => {
    fc.assert(
      fc.property(
        dateInterval,
        fc.integer({ min: 1, max: 3600 }),
        ({ start, end }, offset) => {
          // B empieza a mitad de A
          const midA = new Date(start.getTime() + offset * 1000);
          if (midA >= end) return; // descartar si offset excede la duración
          const bEnd = new Date(end.getTime() + 1000);
          expect(intervalsOverlap(start, end, midA, bEnd)).toBe(true);
        }
      )
    );
  });

  it("sin solapamiento cuando los intervalos solo se tocan en el extremo (end == start del otro)", () => {
    fc.assert(
      fc.property(dateInterval, ({ start, end }) => {
        // [start, end) y [end, end+1s) son adyacentes — no se solapan
        const nextStart = end;
        const nextEnd   = new Date(end.getTime() + 1000);
        expect(intervalsOverlap(start, end, nextStart, nextEnd)).toBe(false);
      })
    );
  });
});
