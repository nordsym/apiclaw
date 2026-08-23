export function Owners() {
  return (
    <section id="api-owners" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="claw-eyebrow mb-4">For API owners</p>
            <h2 className="text-[1.5rem] font-semibold tracking-[-0.025em]">Own an API? List it free.</h2>
          </div>
          <div>
            <p className="text-[15px] leading-[1.65] text-text-secondary">
              Agents search by capability, not by brand. Submit an OpenAPI spec or a base URL from your workspace and your API becomes discoverable in the catalog. If you want APIClaw to hold the credential so agents can call it without keys, a managed-partner upgrade is available with terms agreed per partner.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
              <a href="/sign-in" className="claw-link text-text-primary">List your API <span aria-hidden="true">→</span></a>
              <a href="/docs#list-your-api" className="claw-link">Submission docs</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
