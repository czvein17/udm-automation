import { Link } from "@tanstack/react-router";
import { History, Monitor, Settings } from "lucide-react";

export const Sidebar = () => {
  return (
    <aside className="flex flex-col border-r border-gray-200 bg-bgSecond">
      <div style={{ fontWeight: 700, marginBottom: 12 }} className="">
        Automation Tool
      </div>

      <nav className="flex-1 px-4  py-4 space-y-1 ">
        <Link
          to="/app"
          activeOptions={{ exact: true }}
          className="sidebar-link"
          activeProps={{
            className: "sidebar-link-active",
          }}
        >
          <Monitor className="w-5 h-5" />
          <span>UDM Automation</span>
        </Link>

        <Link
          to="/app/automate"
          className="sidebar-link"
          activeProps={{ className: "sidebar-link-active" }}
        >
          <History className="w-5 h-5" />
          <span>Execution History</span>
        </Link>

        <Link
          to="/app/settings"
          className="sidebar-link"
          activeProps={{
            className: "sidebar-link-active",
          }}
        >
          <Settings className="w-5 h-5" />
          <span>Setting</span>
        </Link>
      </nav>
    </aside>
  );
};
