import { Link } from "@tanstack/react-router";
import { History, Monitor, Settings, Zap } from "lucide-react";

export const Sidebar = () => {
  const navLink = [
    {
      linkTo: "/app",
      label: "UDM Automation",
      icon: Monitor,
    },
    {
      linkTo: "/app/automate",
      label: "Execution History",
      icon: History,
    },
    {
      linkTo: "/app/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="flex flex-col border-r border-gray-200 bg-bgSecond">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-wtwPrimary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-wtwPrimary">
          <Zap fill="white" className="w-6 h-6" stroke="white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight bg-linear-to-r from-wtwPrimary to-wtwSecondary bg-clip-text text-transparent">
            Automation Suite
          </span>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            DM-Config Tool
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4  py-4 space-y-1 ">
        {navLink.map((item) => (
          <Link
            key={item.linkTo}
            to={item.linkTo}
            activeOptions={{
              exact: item.linkTo === "/app",
            }}
            className="sidebar-link"
            activeProps={{
              className: "sidebar-link-active",
            }}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
