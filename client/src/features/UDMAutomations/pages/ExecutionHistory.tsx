export function ExecutionHistoryPage() {
  return (
    <div className="p-8">
      <section className="mx-auto h-[calc(100vh-160px)] flex flex-col gap-3 max-w-6xl">
        <div className="automation-deck">
          <div>
          <p className="automation-deck-kicker">UDM Execution History</p>
          <h1 className="automation-deck-title">Logging disabled for rewrite</h1>
          <p className="text-sm text-slate-600 mt-1">
            Reporter history and live run logs are temporarily disabled while the
            logging stack is being fully rewritten.
          </p>
          </div>
        </div>
      </section>
    </div>
  );
}
