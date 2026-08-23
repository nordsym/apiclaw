const STEPS = [
  { n: "01", title: "Discover", body: "Search by capability. Results say what is callable now." },
  { n: "02", title: "Execute", body: "One call shape for every provider. Keys stay server-side." },
  { n: "03", title: "Observe", body: "Every call logged with provider, cost and latency." },
];

export function Loop() {
  return (
    <section id="how-it-works" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="py-20 sm:py-28">
          <h2 className="claw-h2 max-w-[30rem]">Discover, execute, observe.</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t border-border-subtle pt-5">
                <div className="claw-mono text-[12px] text-accent">{s.n}</div>
                <h3 className="mt-2 text-[1.15rem] font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-text-secondary">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
