import { Link } from "@tanstack/react-router";

export const Sidebar = () => {
  return (
    <aside style={{ borderRight: "1px solid #eee", padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Automation Tool</div>

      <nav style={{ display: "grid", gap: 8 }}>
        <Link
          to="/app"
          activeOptions={{ exact: true }}
          activeProps={{
            className: "sidebar-link-active",
          }}
          inactiveProps={{
            className: "sidebar-link",
          }}
        >
          Preview
        </Link>

        <Link
          to="/app/automate"
          activeProps={{ className: "sidebar-link-active" }}
          inactiveProps={{
            className: "sidebar-link",
          }}
        >
          Automations
        </Link>

        <Link
          to="/app/settings"
          activeProps={{
            className: "sidebar-link-active",
          }}
          inactiveProps={{
            className: "sidebar-link",
          }}
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
};
