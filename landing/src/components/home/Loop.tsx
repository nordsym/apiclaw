const STEPS = [
  {
    n: "01",
    title: "Discover",
    body: "Search by capability, not product name. Every result says whether it is callable now, so the agent never plans around an API it cannot reach.",
    detail: 'discover "exchange rates" --callable',
  },
  {
    n: "02",
    title: "Execute",
    body: "One call shape for every provider: provider, action, params. Managed credentials stay server-side. Idempotency keys make retries safe.",
    detail: "POST /v1/execute",
  },
  {
    n: "03",
    title: "Observe",
    body: "Each call lands in the workspace log tagged with workspace, provider, cost and latency. Missions keep the same trail per step.",
    detail: "workspace · provider · cost · latency",
  },
];

export function Loop() {
  return (
    <section id="how-it-works" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="py-20 sm:py-28">
          <div className="max-w-[36rem]">
            <p className="claw-eyebrow mb-4">The loop</p>
            <h2 className="claw-h2">Discover, execute, observe. Then again.</h2>
            <p className="claw-lede mt-4">
              APIClaw does the three things an agent needs from the API world, and nothing in between is left to guesswork.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t border-border-subtle pt-6">
                <div className="claw-mono text-[12px] text-accent">{s.n}</div>
                <h3 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">{s.body}</p>
                <p className="claw-mono mt-5 text-[12.5px] text-text-muted">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
