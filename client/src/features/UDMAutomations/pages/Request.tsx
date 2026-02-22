import { ElementsTab } from "@features/UDMAutomations/components/ElementsTab";
import { AutomationConfigTab } from "@features/UDMAutomations/components/AutomationConfigTab";
import { useShallow } from "zustand/react/shallow";
import {
  type AutomationTab,
  useAutomationSessionStore,
} from "@features/UDMAutomations/store/automationUi.store";
import { selectSessionTabSlice } from "@features/UDMAutomations/store/automationUi.selectors";

const CONFIG_OPTIONS: readonly AutomationTab[] = [
  "Elements",
  "Automation Config",
  "Auth",
];

export const Request = () => {
  const { activeTab, setActiveTab } = useAutomationSessionStore(
    useShallow(selectSessionTabSlice),
  );

  const activeIndex = Math.max(0, CONFIG_OPTIONS.indexOf(activeTab));

  return (
    <section className="request-panel">
      {/* Tabs header (fixed) */}
      <div className="request-tabs">
        {CONFIG_OPTIONS.map((option) => (
          <button
            key={option}
            className={`request-tab-btn ${
              activeTab === option ? "request-tab-btn-active" : ""
            }`}
            onClick={() => setActiveTab(option)}
          >
            {option}
          </button>
        ))}

        <div
          className="request-tab-indicator"
          style={{
            width: `${100 / CONFIG_OPTIONS.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      </div>

      {/* Tab content area (fills remaining height) */}
      <div className="request-tab-content">
        {/* Only THIS inner wrapper scrolls per tab */}
        {activeTab === "Elements" && (
          <div className="request-elements-pane">
            <ElementsTab />
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
