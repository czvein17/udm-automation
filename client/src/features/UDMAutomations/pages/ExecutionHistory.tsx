export function ExecutionHistoryPage() {
  return (
    <div className="p-3 sm:p-5 lg:p-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-3 lg:h-[calc(100vh-160px)]">
        <div className="automation-deck">
          <div>
            <p className="automation-deck-kicker">UDM Execution History</p>
            <h1 className="automation-deck-title">Logging disabled for rewrite</h1>
            <p className="mt-1 text-sm text-slate-600">
              Reporter history and live run logs are temporarily disabled while
              the logging stack is being fully rewritten.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
