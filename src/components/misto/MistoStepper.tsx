import type { MistoStep } from "@/pages/misto/MistoMode";

const steps: { key: MistoStep[]; label: string }[] = [
  { key: ["input"], label: "Ideia" },
  { key: ["distributing", "refining"], label: "Prompt" },
  { key: ["generating-spec"], label: "Spec" },
  { key: ["results"], label: "Resultado" },
];

const stepOrder: MistoStep[] = ["input", "distributing", "refining", "generating-spec", "results"];

function getStepIndex(step: MistoStep) {
  if (step === "input") return 0;
  if (step === "distributing" || step === "refining") return 1;
  if (step === "generating-spec") return 2;
  return 3;
}

interface MistoStepperProps {
  currentStep: MistoStep;
}

export function MistoStepper({ currentStep }: MistoStepperProps) {
  const activeIdx = getStepIndex(currentStep);

  return (
    <div className="misto-stepper">
      <div className="step-track">
        {steps.map((s, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx;
          const nodeClass = isDone ? "done" : isActive ? "active" : "future";
          const circleClass = isDone ? "sc-done" : isActive ? "sc-active" : "sc-future";
          const labelClass = isDone ? "sl-done" : isActive ? "sl-active" : "sl-future";

          return (
            <div key={i} className={`step-node ${nodeClass}`}>
              <div className={`step-circle ${circleClass}`}>
                {isDone ? "✓" : i + 1}
              </div>
              <div className={`step-label ${labelClass}`}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
