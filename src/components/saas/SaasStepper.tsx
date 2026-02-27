const steps = [
  { num: 1, label: "Problema" },
  { num: 2, label: "Público" },
  { num: 3, label: "Features" },
  { num: 4, label: "Modelo" },
  { num: 5, label: "Stack" },
  { num: 6, label: "Integrações" },
  { num: 7, label: "Prazo" },
];

interface SaasStepperProps {
  currentStep: number;
}

export function SaasStepper({ currentStep }: SaasStepperProps) {
  return (
    <div className="misto-stepper" style={{ maxWidth: 900 }}>
      <div className="step-track">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isActive = s.num === currentStep;
          return (
            <div key={s.num} className={`step-node ${isDone ? "done" : isActive ? "active" : "future"}`}>
              <div className={`step-circle ${isDone ? "sc-done" : isActive ? "sc-active" : "sc-future"}`}>
                {isDone ? "✓" : s.num}
              </div>
              <div className={`step-label ${isDone ? "sl-done" : isActive ? "sl-active" : "sl-future"}`}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
