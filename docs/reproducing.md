# Reproducing a paper figure

> **Status:** TBD. To be authored once paper figures are finalized.

## Intended structure

Each paper figure that depends on this repository will get its own subsection here, with:

1. **Inputs** — which study folder under `examples/` (or a separately-distributed dataset) the figure draws from.
2. **Software** — exact firmware revision and app build that produced the data, plus any analysis scripts under `examples/figures/`.
3. **Hardware** — the chamber, pump, microscope, and objective configuration used.
4. **Walkthrough** — step-by-step commands to regenerate the figure from the input data on a fresh checkout.
5. **Expected output** — what the figure should look like (rendered PNG/SVG), with tolerance bounds for any quantitative measurements.

## Typical recipe (will be filled in per-figure)

1. Clone the repository.
2. Install firmware tooling (`pip install platformio`) and app dependencies (`cd app && npm ci`).
3. Optionally rebuild artifacts (`cd firmware && pio run`; `cd app && npm run build`).
4. Run the figure-regeneration script:
   ```bash
   cd examples/figures
   python figure_<n>.py --study ../demo_study --out figure_<n>.png
   ```
5. Compare against the published figure (canonical version under `docs/figures/`).

## Software / data versioning

- Each release tag (`v2.0.0`, etc.) corresponds to a specific commit. Reproducing a figure should pin to the tag the paper cites.
- Sample data in `examples/demo_study/` is for format demonstration only — **not** the paper's experimental data. The paper data is distributed separately (see paper acknowledgements for archive location).

## See also

- `docs/protocol.md` — the wet-lab procedure that produces the input data.
- `examples/demo_study/` — folder-based study format showing protocol and run schemas.
