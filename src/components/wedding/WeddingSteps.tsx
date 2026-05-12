interface Step {
  title: string;
  desc: string;
}

interface WeddingStepsProps {
  steps: Step[];
}

export function WeddingSteps({ steps }: WeddingStepsProps) {
  return (
    <section className="py-16 px-4" style={{ background: "#0a0a1a" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-12"
          style={{ color: "var(--cream)" }}
        >
          ¿Cómo funciona?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold"
                style={{ background: "var(--gold)", color: "#05051a" }}
              >
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--cream)" }}>
                {step.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
