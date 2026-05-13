# Cleaning Protocol (Clean-In-Place)

This document is the bench procedure for cleaning the chamber + controller flow loop between experiments. Sterilization of the chamber alone (autoclave) is handled separately in `protocol.md`; this doc covers the **wetted loop running through the controller** — pump head, in-line SLF3S-1300F flow sensor, tubing, fittings — which cannot be autoclaved as a unit.

Related docs: `protocol.md` (cell culture and stimulus), `architecture.md` (system topology, controller-side instrumentation), `theory.md` (flow + shear math).

## Scope

The closed loop being cleaned, in flow order: **reservoir → pump (Kamoer KCS peristaltic) → SLF3S-1300F inline flow sensor → chamber inlet → channel (24 × 50 × 0.25 mm) → chamber outlet → return tubing → reservoir**.

The chamber body (316L stainless, cover glass, neutral-cure silicone seals) is autoclavable on its own and is normally broken out of the loop, autoclaved, and reassembled between experimental blocks. The controller-side loop (everything except the chamber) is cleaned in place by recirculation through the same pump that drives experiments. This protocol covers the in-place loop clean; it can also be run with a re-assembled, autoclaved chamber in-line as part of the pre-experiment prime.

## When to run each cycle

| Cycle | Trigger | Duration | Lead reagent |
|---|---|---|---|
| Standard end-of-run CIP | After every cell-experiment block | ~45 min | 70 % IPA |
| Weekly deep clean | Once per active week, or before a new biological condition | ~90 min | Peracetic acid (Minncare, 1:100) |
| Pre-shipment / long storage | Before transit or > 2-week idle | ~30 min | 70 % IPA fill |
| Pre-experiment prime | Before each experiment | ~10 min | Sterile experimental medium |

The SLF3S-1300F sensor is the rate-limiting wetted component: it is rated for routine disinfection with 70 % isopropanol per Sensirion's application note, but it is **not autoclavable** (max operating temperature ~65 °C; the housing and thermal flow-measurement element fail above that). The protocols below stay within its limits.

## Reagents

- **Enzymatic detergent.** Tergazyme (Alconox) at 1 % w/v in DI water, prepared fresh per cycle. Alternative: Alconox at 0.5 %.
- **70 % isopropanol** (IPA), USP grade, in DI water. Routine disinfectant.
- **Peracetic acid solution.** Minncare HD at 1:100 dilution in DI water, prepared within 24 h of use. Spore-killing tier; replaces IPA in the weekly deep clean.
- **DI water**, deionized or Milli-Q quality. Plain rinses.
- **Sterile DI water.** Autoclaved or 0.22 µm-filtered, in single-use sealed bottles. Final rinses and storage.
- **Compatibility note.** All four reagents above are compatible with PEEK (SLF3S wetted material), 316L stainless (chamber), borosilicate (cover glass), and medical-grade silicone (seals, tubing). Avoid concentrated acids (>1 M HCl, H₂SO₄), strong bases (>1 M NaOH), chlorinated organics (chloroform, dichloromethane), and DMSO at >10 % — these attack PEEK or the silicone seals.

## Standard end-of-run CIP cycle

About 45 min wall time. Operator presence is needed at phase transitions to swap the reservoir contents; the pump handles flow during each phase.

| Phase | Reservoir contents | Volume | Pump rate | Duration | Direction |
|---|---|---|---|---|---|
| 1. Drain | empty (waste line) | — | 100 mL/min | until empty | forward |
| 2. Water flush | DI water | 250 mL | 100 mL/min | 3 min fwd + 1 min rev | both |
| 3. Detergent | 1 % Tergazyme in 30–37 °C DI water | 200 mL | 50 mL/min | 10 min fwd + 5 min rev | both |
| 4. Water rinse ×2 | fresh DI water each pass | 500 mL ×2 | 100 mL/min | 3 min each | forward |
| 5. Disinfect | 70 % IPA | 200 mL | 50 mL/min | 10 min fwd + 5 min rev | both |
| 6. Final rinse | sterile DI water | 500 mL | 100 mL/min | 5 min | forward |
| 7. Storage fill | sterile DI water (≤ 1 week) or 70 % IPA (longer) | 100 mL | leave filled, pump off | — | — |

### Why each step

- **Drain (1)** clears bulk media so detergent contacts surface residue, not a diluted media slurry.
- **Initial water flush (2)** dislodges loose particulates before any chemical contact. The brief reverse segment clears the discharge side of any one-way features inside the pump head and the fittings on the back of the SLF3S.
- **Detergent (3)** is the protein-removal step. Serum proteins from α-MEM + FBS/CS bind to PEEK and stainless surfaces over time and won't budge with water or alcohol alone; an enzymatic detergent at 30–37 °C unfolds and lifts them. Forward + reverse ensures the chamber fittings and any T-junctions get reagent from both sides.
- **Water rinses (4)** clear residual detergent. Two passes; running once can leave foaming residue that re-contaminates downstream phases.
- **Disinfectant (5)** kills vegetative cells; 70 % IPA is broad-spectrum for the contamination types relevant to mammalian cell culture (bacteria, yeast, most molds). The reverse segment is again for fitting dead zones.
- **Final sterile-water rinse (6)** clears the alcohol so the next experiment's media isn't diluted by residual IPA in the line. Skipping this step is a common source of "the cells looked OK and then died at 30 min" failures.
- **Storage (7)** keeps the SLF3S wet. The thermal flow-measurement element should never be stored dry; dry storage causes calibration drift and accelerates internal contamination.

## Weekly deep clean

Same protocol as the standard cycle, with phase 5 replaced by:

| Phase 5 (weekly) | Reservoir contents | Volume | Pump rate | Duration | Direction |
|---|---|---|---|---|---|
| 5W. Sporicide | Minncare HD at 1:100 in DI water | 200 mL | 50 mL/min | 30 min fwd + 5 min rev | both |

Then proceed to phase 6 with a more thorough sterile-water rinse: **three passes of 500 mL sterile DI water at 100 mL/min, 5 min each, forward.** Peracetic acid decomposes to acetic acid + water + O₂, but residual concentrations even in the low ppm range will inhibit MLO-Y4 attachment and growth. The triple rinse is non-negotiable for the deep clean.

Trigger for the deep clean:
- Once per active experimental week.
- Before any new cell line introduction or new biological condition.
- After any suspected contamination (cloudy reservoir, off-color flush water, unexpected biofilm visible in transparent tubing).

## Pre-shipment / long storage

Drain the loop, then fill with 70 % IPA via phase 5 of the standard cycle. After 10 min recirculation, pause the pump with IPA still in the line and seal the reservoir ends. The loop ships full; alcohol evaporates cleanly if a fitting leaks. Drain and run two passes of sterile DI water before priming with experimental medium at the destination.

## Pre-experiment prime

After storage, immediately before an experiment:

1. Drain storage water or IPA (whatever was used) into the waste line.
2. Connect the autoclaved chamber to the loop using sterile fittings.
3. Pour 100 mL sterile experimental medium (α-MEM with the day's serum and supplement formulation, equilibrated at 37 °C, pH set per `protocol.md`) into the reservoir.
4. Run the pump at 50 mL/min forward for 5 min to prime the loop. Watch for bubbles at the SLF3S inlet; if any persist, briefly increase to 100 mL/min for 30 s to clear them.
5. Stop the pump and observe the SLF3S reading for 30 s. It should drift to within ±0.05 mL/min of zero — this is the zero-point verification.
6. Verify the reading at a known setpoint: restart pump at 16.7 mL/min (1 Pa shear setpoint per `protocol.md`'s Q-vs-τ table). SLF3S should read within ±5 % of commanded rate.
7. Begin experiment.

If the zero-point drift exceeds ±0.1 mL/min after a clean cycle, repeat phase 6 of the standard CIP — residual chemical in the channel is most likely.

## SLF3S compatibility — critical limits

- **Maximum reagent temperature: ~50 °C.** Stay well below the 65 °C max operating spec for safety margin. The warm Tergazyme step at 30–37 °C is fine; do not flush with steam or hot water above ~50 °C.
- **No autoclave, no dry heat, no chlorinated solvents.** Any one of these will damage the sensor permanently.
- **No dry running.** Pump must never run with the SLF3S channel empty. When swapping reservoirs, ensure the previous fluid is still in the loop until the new bottle is connected, or stop the pump cleanly with fluid in the line.
- **Bubble intolerance.** Persistent air slugs through the sensor can mechanically damage the membrane over time and will throw the calibration off mid-experiment. The 100 mL/min bubble-clearing flush in phase 6 / step 4 of the prime is the workaround when bubbles do appear.
- **Recommended disinfectant per manufacturer: 70 % IPA.** Higher concentrations (95 %, anhydrous IPA) are less effective and dry too fast; lower concentrations (50 %, water-heavy mixes) don't reliably kill.

## Logging

Every CIP cycle is logged in the operator notebook with:
- Date and operator initials
- Cycle type (standard / weekly / pre-ship)
- Any reagent substitutions or shortened phases (with reason)
- SLF3S zero-drift reading at the end of the cycle
- Any anomalies (foaming, biofilm, unexpected resistance)

For the preprint methods section, the standard end-of-run CIP cycle (phases 1–7 above, with stated reagents and durations) is the canonical between-runs procedure. The weekly deep clean is referenced as the deeper sterilization tier used between experimental conditions.

## Consumables stock (yearly)

- Tergazyme powder, 1 lb jar (~$50): lasts a full year at 1–2 cycles per active week.
- 70 % IPA, 4 L bottle (~$20): a few months at active use; keep two on hand.
- Minncare HD, 250 mL concentrate (~$70): months of weekly deep cleans.
- Sterile DI water, 1 L bottles ×12: replace as used; budget one bottle per cycle.

Total: ~$250 per year of active use, well under the cost of any single component in the loop.
