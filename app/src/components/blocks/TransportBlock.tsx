import { useRuntimeStore } from "@/state/runtime";
import { Switch } from "@/components/widgets/Switch";
import { shearToStepRate } from "@/domain/shear";

export function TransportBlock() {
  const runState = useRuntimeStore((s) => s.runState);
  const activeRun = useRuntimeStore((s) => s.activeRun);
  const startRun = useRuntimeStore((s) => s.startRun);
  const stopRun = useRuntimeStore((s) => s.stopRun);
  const prime = useRuntimeStore((s) => s.prime);
  const spinAt = useRuntimeStore((s) => s.spinAt);
  const studyFolder = useRuntimeStore((s) => s.studyFolder);
  const connectionState = useRuntimeStore((s) => s.connectionState);
  const dialed = useRuntimeStore((s) => s.dialed);
  const calibration = useRuntimeStore((s) => s.calibration);

  const isRunning = runState !== "IDLE" && runState !== "FAULT";
  const isProtocolRun = !!activeRun;
  // Continuous-spin mode: pump is running but no protocol-run is active.
  const isSpinning = isRunning && !isProtocolRun;
  const noStudy = !studyFolder;
  const notConnected = connectionState !== "connected";

  // RUN: disabled while anything's running, or no study, or no connection.
  const cannotRun = isRunning || noStudy || notConnected;
  // SPIN: clickable while spinning (to stop). Blocked while a protocol run owns the pump.
  const cannotSpin = isProtocolRun || notConnected;
  // PRIME: blocked while anything's running.
  const cannotPrime = isRunning || notConnected;

  let hint: string | null = null;
  if (notConnected) hint = "not connected — see Settings";
  else if (noStudy && !isSpinning) hint = "pick a study folder for RUN";

  const handleRun = () => {
    if (cannotRun) return;
    void startRun();
  };
  const handleStop = () => {
    if (!isRunning) return;
    void stopRun();
  };
  const handleSpin = () => {
    if (cannotSpin) return;
    if (isSpinning) {
      void stopRun();
    } else {
      const stepRateHz = Math.round(shearToStepRate(dialed.meanPa, calibration));
      void spinAt(stepRateHz);
    }
  };
  const handlePrime = () => {
    if (cannotPrime) return;
    void prime(10);
  };

  // Matches the minor-knob diameter so buttons and knobs sit at one scale.
  const SIZE = 60;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-1 items-center justify-around gap-1">
        <div className="flex flex-col items-center gap-2">
          <Switch
            checked={isProtocolRun}
            onChange={handleRun}
            disabled={cannotRun}
            size={SIZE}
            capColor="#d73534"
          />
          <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
            run
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Switch
            checked={false}
            onChange={handleStop}
            disabled={!isRunning}
            onColor="#d73534"
            size={SIZE}
          />
          <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
            stop
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Switch
            checked={isSpinning}
            onChange={handleSpin}
            disabled={cannotSpin}
            size={SIZE}
          />
          <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
            spin
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Switch
            checked={false}
            onChange={handlePrime}
            disabled={cannotPrime}
            momentary
            size={SIZE}
          />
          <span className="font-mono text-[12px] uppercase tracking-wider text-muted">
            prime
          </span>
        </div>
      </div>
      {hint && (
        <div className="font-mono text-[13px] uppercase tracking-wider text-accent/80">
          {hint}
        </div>
      )}
    </div>
  );
}
