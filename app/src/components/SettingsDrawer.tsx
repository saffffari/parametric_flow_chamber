/**
 * Settings drawer — modal for port selection, calibration, operator name,
 * study-folder picker, mock/serial mode toggle.
 *
 * v1 scope per HANDOFF: calibration, viscosity, port, operator name. Plus
 * (added for Ignacio v0): study-folder picker so RUN can persist to disk.
 */

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { useRuntimeStore } from "@/state/runtime";
import { DialSwitch } from "@/components/widgets/DialSwitch";
import type { PortInfo } from "@/lib/interface";

type PortInfoLocal = PortInfo;

export function SettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 w-[640px] max-w-[90vw] max-h-[85vh] -translate-x-1/2
            -translate-y-1/2 overflow-auto rounded-md border border-border
            bg-surface-raised shadow-2xl
          "
        >
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <Dialog.Title className="font-mono text-sm uppercase tracking-[0.2em] text-foreground">
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="font-mono text-xs uppercase tracking-wider text-muted hover:text-foreground"
              >
                close
              </button>
            </Dialog.Close>
          </header>
          <div className="space-y-6 px-6 py-5">
            <InterfaceSection />
            <ConnectionSection />
            <StudySection />
            <CalibrationSection />
            <OperatorSection />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// -------------------------------------------------------------------------
// Sections
// -------------------------------------------------------------------------

function InterfaceSection() {
  const interfaceMode = useRuntimeStore((s) => s.interfaceMode);
  const setInterfaceMode = useRuntimeStore((s) => s.setInterfaceMode);
  const activeRun = useRuntimeStore((s) => s.activeRun);

  return (
    <Section title="Interface">
      <div className="flex items-start gap-6">
        <DialSwitch
          checked={interfaceMode === "serial"}
          onChange={(checked) =>
            void setInterfaceMode(checked ? "serial" : "mock")
          }
          size={84}
          label="live hw"
          disabled={!!activeRun}
        />
        <div className="flex-1 pt-2">
          <div className="font-mono text-xs uppercase tracking-wider text-foreground">
            {interfaceMode === "serial" ? "Serial (Teensy)" : "Mock"}
          </div>
          <div className="mt-1 font-mono text-[14px] text-muted">
            {interfaceMode === "serial"
              ? "Real Teensy 4.1 over USB. Pick a port below to connect."
              : "Synthetic firmware. Auto-connected. No hardware required."}
          </div>
          {!!activeRun && (
            <div className="mt-2 font-mono text-[13px] uppercase tracking-wider text-accent">
              stop the active run before switching modes
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function ConnectionSection() {
  const interfaceMode = useRuntimeStore((s) => s.interfaceMode);
  const selectedPort = useRuntimeStore((s) => s.selectedPort);
  const connectionState = useRuntimeStore((s) => s.connectionState);
  const connectToPort = useRuntimeStore((s) => s.connectToPort);
  const disconnect = useRuntimeStore((s) => s.disconnect);

  const [ports, setPorts] = useState<PortInfoLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await window.flowChamber.serial.listPorts();
      setPorts(list);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interfaceMode === "serial") void refresh();
  }, [interfaceMode]);

  if (interfaceMode !== "serial") return null;

  const handleConnect = async (port: string) => {
    setPending(true);
    setErrorMsg(null);
    const ok = await connectToPort(port);
    if (!ok) setErrorMsg(`Failed to connect to ${port}`);
    setPending(false);
  };

  return (
    <Section title="Serial port">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="
              rounded-sm border border-border bg-surface-overlay px-3 py-1.5
              font-mono text-xs uppercase tracking-wider text-foreground
              hover:border-muted-strong disabled:cursor-not-allowed disabled:text-muted
            "
          >
            {loading ? "scanning…" : "refresh"}
          </button>
          {connectionState === "connected" && (
            <button
              type="button"
              onClick={() => void disconnect()}
              className="
                rounded-sm border border-border bg-surface-overlay px-3 py-1.5
                font-mono text-xs uppercase tracking-wider text-status-fault
                hover:border-status-fault
              "
            >
              disconnect
            </button>
          )}
          <span className="ml-auto font-mono text-[14px] uppercase tracking-wider text-muted">
            {connectionState}
          </span>
        </div>

        {ports.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border px-3 py-4 text-center font-mono text-xs text-muted/60">
            {loading ? "scanning…" : "No serial ports detected. Plug in the Teensy and refresh."}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-sm border border-border bg-surface-overlay">
            {ports.map((p) => (
              <li
                key={p.path}
                className="flex items-center justify-between px-3 py-2 font-mono text-xs"
              >
                <div>
                  <div className="text-foreground">{p.path}</div>
                  <div className="text-[13px] text-muted/60">
                    {[p.manufacturer, p.serialNumber, p.vendorId && `vid:${p.vendorId}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending || (selectedPort === p.path && connectionState === "connected")}
                  onClick={() => void handleConnect(p.path)}
                  className="
                    rounded-sm border border-border bg-surface-raised px-3 py-1
                    font-mono uppercase tracking-wider text-foreground
                    hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:text-muted
                  "
                >
                  {selectedPort === p.path && connectionState === "connected"
                    ? "connected"
                    : "connect"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {errorMsg && (
          <p className="font-mono text-xs text-status-fault">{errorMsg}</p>
        )}
      </div>
    </Section>
  );
}

function StudySection() {
  const studyFolder = useRuntimeStore((s) => s.studyFolder);
  const setStudyFolder = useRuntimeStore((s) => s.setStudyFolder);
  const [pending, setPending] = useState(false);

  const pickFolder = async () => {
    setPending(true);
    try {
      const folder = await window.flowChamber.studies.pickFolder();
      if (folder) {
        // Open if exists, else create
        let study = await window.flowChamber.studies.open(folder);
        if (!study) {
          study = await window.flowChamber.studies.create(folder, "Untitled Study");
        }
        await setStudyFolder(folder);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Section title="Study folder">
      <div className="space-y-2">
        <p className="font-mono text-[14px] text-muted/70">
          Runs are saved to <code className="text-muted-strong">&lt;study&gt;/runs/</code> as
          one folder each (metadata, system, protocol, telemetry.csv, events.csv).
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void pickFolder()}
            disabled={pending}
            className="
              rounded-sm border border-border bg-surface-overlay px-3 py-1.5
              font-mono text-xs uppercase tracking-wider text-foreground
              hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:text-muted
            "
          >
            {pending ? "…" : studyFolder ? "change study" : "open / create study"}
          </button>
          <span className="ml-auto font-mono text-[14px] text-muted/70 truncate">
            {studyFolder ?? "no study selected"}
          </span>
        </div>
      </div>
    </Section>
  );
}

function CalibrationSection() {
  const calibration = useRuntimeStore((s) => s.calibration);
  const setCalibration = useRuntimeStore((s) => s.setCalibration);

  return (
    <Section title="Calibration">
      <div className="grid grid-cols-2 gap-3">
        <NumField
          label="channel width (mm)"
          value={calibration.channelWidthMm}
          step={0.1}
          onChange={(v) => void setCalibration({ channelWidthMm: v })}
        />
        <NumField
          label="channel height (mm)"
          value={calibration.channelHeightMm}
          step={0.01}
          onChange={(v) => void setCalibration({ channelHeightMm: v })}
        />
        <NumField
          label="channel length (mm)"
          value={calibration.channelLengthMm}
          step={1}
          onChange={(v) => void setCalibration({ channelLengthMm: v })}
        />
        <NumField
          label="viscosity (mPa·s)"
          value={calibration.viscosityPaS * 1000}
          step={0.05}
          onChange={(v) => void setCalibration({ viscosityPaS: v / 1000 })}
        />
        <NumField
          label="steps / mL"
          value={calibration.stepsPerMl}
          step={100}
          onChange={(v) => void setCalibration({ stepsPerMl: v })}
        />
        <NumField
          label="pump max RPM"
          value={calibration.pumpMaxRpm}
          step={10}
          onChange={(v) => void setCalibration({ pumpMaxRpm: v })}
        />
        <NumField
          label="motor steps / rev"
          value={calibration.motorStepsPerRev}
          step={1}
          onChange={(v) => void setCalibration({ motorStepsPerRev: v })}
        />
        <NumField
          label="microstepping"
          value={calibration.microstepping}
          step={1}
          onChange={(v) => void setCalibration({ microstepping: v })}
        />
      </div>
      <p className="mt-3 font-rmono text-[13px] text-muted/50">
        steps/mL is set by gravimetric calibration day (run pump at known rate, weigh outlet, derive).
      </p>
    </Section>
  );
}

function OperatorSection() {
  const operatorName = useRuntimeStore((s) => s.operatorName);
  const setOperatorName = useRuntimeStore((s) => s.setOperatorName);
  return (
    <Section title="Operator">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[13px] uppercase tracking-wider text-muted/60">
          name / initials (stamped into run metadata)
        </span>
        <input
          type="text"
          value={operatorName}
          onChange={(e) => void setOperatorName(e.target.value)}
          className="
            rounded-sm border border-border bg-surface-overlay px-2 py-1.5
            font-mono text-sm text-foreground focus:border-accent focus:outline-none
          "
        />
      </label>
    </Section>
  );
}

// -------------------------------------------------------------------------
// Reusable widgets
// -------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 font-mono text-[13px] uppercase tracking-[0.25em] text-muted/60">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function NumField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[13px] uppercase tracking-wider text-muted/60">
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        data-readout
        className="
          w-full rounded-sm border border-border bg-surface-overlay px-2 py-1.5
          font-mono text-sm text-foreground focus:border-accent focus:outline-none
        "
      />
    </label>
  );
}
