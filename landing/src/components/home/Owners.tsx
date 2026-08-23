export function Owners() {
  return (
    <section id="api-owners" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="flex flex-col gap-4 py-14 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-text-secondary">
            <span className="font-semibold text-text-primary">Own an API?</span> List it free and agents can find it by capability.
          </p>
          <a href="/sign-in" className="claw-btn claw-btn-quiet">List your API</a>
        </div>
      </div>
    </section>
  );
}
