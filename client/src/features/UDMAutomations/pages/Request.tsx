import { useState } from "react";
import { ElementsTab } from "../components/ElementsTab";
import { AutomationConfigTab } from "../components/AutomationConfigTab";

type RequestProps = {
  onSubmittedRunId?: (runId: string) => void;
};

export const Request = ({ onSubmittedRunId }: RequestProps) => {
  const [activeTab, setActiveTab] = useState<string>("Elements");

  const configOptions = ["Elements", "Automation Config", "Auth"];
  const activeIndex = Math.max(0, configOptions.indexOf(activeTab));

  return (
    <section className="flex flex-col h-full min-h-0 overflow-hidden border shadow-sm card none">
      {/* Tabs header (fixed) */}
      <div className="relative flex border-b border-slate-200 shrink-0">
        {configOptions.map((option) => (
          <button
            key={option}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === option ? "text-wtwSecondary" : "text-slate-500"
            }`}
            onClick={() => setActiveTab(option)}
          >
            {option}
          </button>
        ))}

        <div
          className="absolute bottom-0 left-0 h-0.5 bg-wtwSecondary transition-transform duration-200 ease-in-out rounded-xl"
          style={{
            width: `${100 / configOptions.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      </div>

      {/* Tab content area (fills remaining height) */}
      <div className="flex-1 min-h-0">
        {/* Only THIS inner wrapper scrolls per tab */}
        {activeTab === "Elements" && (
          <div className="h-full min-h-0 bg-[#f8fafc] p-2">
            <ElementsTab onSubmittedRunId={onSubmittedRunId} />
          </div>
        )}

        {activeTab === "Automation Config" && (
          <div className="h-full min-h-0 p-2 overflow-auto">
            <AutomationConfigTab />
          </div>
        )}

        {activeTab === "Auth" && (
          <div className="h-full min-h-0 p-2 overflow-auto">
            <div>Auth</div>
          </div>
        )}
      </div>
    </section>
  );
};
