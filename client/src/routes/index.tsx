import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, History, PlayCircle, ShieldCheck } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useDocumentTitle("Home");

  const highlights = [
    {
      icon: <PlayCircle className="w-4 h-4" />,
      title: "Run automation jobs",
      description: "Submit rows, start runs, and track execution flow in one place.",
    },
    {
      icon: <Activity className="w-4 h-4" />,
      title: "Live reporter stream",
      description: "Observe run lifecycle updates as row-by-row events in real time.",
    },
    {
      icon: <History className="w-4 h-4" />,
      title: "Execution history",
      description: "Review grouped runs and inspect past results without noisy logs.",
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      title: "Internal-safe workflow",
      description: "Built for maintainability, handoff, and operational transparency.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fcf8ff] via-white to-[#f4fbff]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm p-8">
          <p className="automation-deck-kicker">UDM Internal Platform</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Automation workspace for execution, visibility, and handoff
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            This tool helps the team automate repetitive UDM operations, monitor
            run behavior through reporter events, and audit historical execution
            outcomes in a clean grouped view.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/app" className="btn-primary inline-flex items-center gap-2">
              Open Automation Workspace
            </Link>
            <Link
              to="/app/udm-execution-history"
              className="btn inline-flex items-center gap-2"
            >
              View Execution History
            </Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="inline-flex rounded-full bg-wtwSecondary/10 text-wtwPrimary p-2">
                {item.icon}
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-800">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Index;
