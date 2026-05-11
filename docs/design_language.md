# Design language

> Hardware aesthetic (TX-6-influenced precision instrument) carried over verbatim from `design_language_tx6.md` in the dev archive. Software aesthetic section (Drams/Rams visual language for the Electron operator app) is a **placeholder** to author from the live reference at `drams.framer.website` once the app implementation begins.

The flow chamber project has two visually-related but functionally-distinct design languages:

- **Hardware** — the machined chamber, controller enclosure, and culture-handling kit. Reference: Teenage Engineering TX-6 (satin metal slab, sparse warm orange accent, monochrome restraint).
- **Software** — the Electron operator app that drives the controller. Reference: the Drams/Rams visual system at `drams.framer.website` (sibling to TX-6; monochrome surfaces, generous whitespace, sparse orange for active/critical state, no decorative ornament).

Both systems share the same restraint, the same orange accent role, and the same "precision instrument, not consumer gadget" posture.

---

## Hardware aesthetic — TX-6-influenced precision instrument

This section defines the industrial design language for the flow chamber hardware. The primary reference is the Teenage Engineering TX-6, translated into a sterile, open-source biomedical instrument. It is an influence document, not permission to copy Teenage Engineering marks, exact layouts, or product trade dress.

Functional constraints outrank appearance:

- sterility and cleanability;
- optical clearance on the Zeiss LSM 880;
- seal reliability and channel-height control;
- machining cost and accessibility;
- clear assembly by a biology or undergraduate engineering lab.

### Local references

Reference images are at `docs/references/tx6_design_language/images/`. Use `tx6_reference_contact_sheet.jpg` for a quick visual scan. Source links and per-image notes are in `docs/references/tx6_design_language/source_manifest.md`.

The back-side leather/textile/bag language is explicitly out of scope. Those images are only useful for proportion, modular kit presentation, edge treatment, and compact system organization.

### Core impression

The chamber should read as a compact precision instrument, not a disposable lab jig and not a consumer gadget.

Target feel:

- small machined slab;
- dense but orderly functional layout;
- satin metal body;
- crisp black voids where the object opens into ports, slots, windows, or display areas;
- sparse warm orange used only as an active-state or critical-action accent;
- exposed precision hardware where touch or serviceability matters;
- quiet labels engraved or laser-marked directly onto the part;
- no decorative complexity that adds cleaning burden.

### Translation principles

| TX-6 cue | Flow chamber translation |
|---|---|
| Satin aluminum slab | Satin 316L stainless chamber body and clamp, with electropolished/passivated wetted surfaces |
| Tight grid of controls | Orthogonal grid for ports, fasteners, labels, and sensor/control elements |
| Small high-contrast display | Small OLED/status window on the controller, not on the sterile chamber body |
| Black fader slots and jack openings | Dark optical window, port openings, gasket shadows, and display recesses |
| Knurled metal adapter | External thumb screws, port plugs, and removable fittings can be knurled metal |
| Sparse orange controls | Orange only for flow active, prime/purge, emergency stop, or direction indicators |
| Low, compact side profile | Chamber must be low-profile around the objective and stage envelope |
| Precise packaging/system presentation | Culture holders and accessories should pack as a clean modular kit |

### Chamber body rules

- Main body and clamp should be simple rounded rectangles or rectilinear slabs with small corner radii.
- Exterior edges should have consistent shallow chamfers or radii. Do not round sealing lips unless the drawing explicitly calls it out.
- Fasteners should be counterbored, flush, or visually organized. Avoid random exposed screw clutter.
- The cover-glass window should be visually centered and treated as the main functional aperture.
- Ports should align to the channel centerline and use compact labels near the ports.
- The body may have a small serial/QR/data strip on a non-wetted side face or underside.
- Do not add cosmetic grooves, texture, pockets, or engraving on wetted surfaces, seal lands, gasket seats, or glass support surfaces.

### Controller rules

- A small OLED, one primary rotary encoder, and a few tactile buttons are enough.
- Use a quiet orthogonal layout: display top/right, encoder or main control adjacent, status/action buttons grouped below.
- Orange is reserved for flow active, recording/logging, or safety-critical control.
- Labels should be small and direct: `flow`, `prime`, `stop`, `temp`, `log`, `sync`.
- Avoid large explanatory text on the device. The device should be self-evident through layout and labels.

### Culture holder and kit rules

- The culture/sample holder should feel like a precision accessory tray, not a plate hacked into a chamber.
- Use clear, frosted, white, or light gray polymer where biology visibility matters.
- If a transport/storage box is designed, use a molded-tray logic: exact recesses, finger reliefs, protected glass, and labeled positions.
- No leather, textile, foam, porous grips, or soft decorative materials in the cell-culture path.

### Materials and finishes

| Element | Preferred design finish |
|---|---|
| Reusable chamber body | 316L stainless, satin exterior, electropolished/passivated wetted surfaces |
| Clamp / retainer | 316L stainless or anodized aluminum if non-wetted and isolated |
| Controller enclosure | clear / silver anodized aluminum or light gray machined polymer |
| Culture / sample holder | clear / frosted polycarbonate, COC/COP, or white autoclavable polymer where appropriate |
| External fittings | stainless or PEEK/ETFE, visually compact and aligned |
| Tubing | clear FEP/PTFE at chamber, black/neutral external cable-style routing if useful |
| Accent color | small orange marks only; never a dominant theme |

### Prohibited moves

- Do not use Teenage Engineering logos, `TX-6` marks, or exact copied graphic layouts on this device.
- Do not use leather, PU leather, textile, or porous decorative materials.
- Do not style wetted or cleanable areas with ornamental knurling, grooves, stippling, or unnecessary recesses.
- Do not let industrial design invade the optical clearance envelope.
- Do not make the chamber look like a consumer audio device if the geometry no longer serves microscopy, sealing, or sterile assembly.
- Do not use large branding, bright color palettes, or oversized rounded consumer controls.

### Vendor-CAD implications

For the steel parts we send out:

- use a restrained satin-metal exterior with explicit passivation/electropolish notes where relevant;
- keep all visible radii / chamfers consistent across body and clamp;
- make the underside objective window clean and unobstructed;
- align port centerlines, screw patterns, and labels on a simple grid;
- reserve knurled hardware for removable external handling only;
- include no purely decorative machining operations that increase cost or cleaning risk.

### Acceptance check

Before sending CAD:

- The chamber should look like a compact precision instrument from the first render.
- Every visible detail should have a mechanical, optical, assembly, or labeling role.
- Cleaning and cell-culture handling should be simpler because of the design, not harder.
- The device should evoke TX-6 restraint, density, and material confidence without copying its product identity.

---

## Software aesthetic — Drams/Rams visual language

> **Placeholder.** This section is to be authored once the Electron operator app implementation begins. Source: `drams.framer.website` — a sibling visual system to TX-6, applied to a software surface. The following bullets capture the intended principles; the live reference is the source of truth.

Intended principles (subject to confirmation against the live reference):

- Monochrome surfaces (deep neutrals, near-black to off-white);
- Generous whitespace; dense functional layout in the working zones, breathing room around them;
- Sparse warm orange (`accent`) used only for active-state, critical-action, or "live data" cues — never as a dominant color;
- No decorative ornament: gradients, drop shadows, colored backgrounds, illustrative iconography are all minimized;
- Restrained typography: a single neutral typeface with a constrained weight palette; numerical readouts in monospace;
- Synth-style metaphor in the operator UI: control panel divides into named blocks (OSC / SHEAR / ENV / DISPLAY / SYNC / TRANSPORT / MASTER) that mirror Korg Minilogue groupings;
- Custom widgets read as physical instrument controls: knobs (SVG/Canvas + `motion` for inertia), waveform selectors, 7-segment readouts, the rotating wheel.

To author when starting `app/`:

1. Pull the Figma file at `https://www.figma.com/design/J3aZzdLaJmidPQcOxphPdE/flow_chamber?node-id=2004-140` (file key `J3aZzdLaJmidPQcOxphPdE`, root frame node `2004-140`) via the Figma MCP.
2. Use `get_variable_defs` to extract design tokens; write to `app/src/styles/globals.css`.
3. Use `get_design_context` for node `2004-140` and adjacent frames to seed the component palette.
4. Capture per-component principles (knob anatomy, readout typography, panel block divisions, accent-color triggers) here in this section, replacing this placeholder.
5. Cross-reference TX-6 hardware language above where the same rule applies to both surfaces (orange semantics, monochrome restraint, instrument-not-gadget posture).
