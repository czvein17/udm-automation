import type { AutomationTerminalTask } from "../../types/automationTerminal.types";

type AutomationTaskHeaderProps = {
  task: AutomationTerminalTask;
};

const fields: Array<{ key: keyof AutomationTerminalTask; label: string }> = [
  { key: "id", label: "Task ID" },
  { key: "fieldName", label: "Field" },
  { key: "elementId", label: "Element ID" },
  { key: "elementName", label: "Element Name" },
  { key: "url", label: "URL" },
];

export function AutomationTaskHeader({ task }: AutomationTaskHeaderProps) {
  return (
    <div className="terminal-task-header">
      {fields.map((field) => (
        <p key={field.key} className="terminal-task-meta-row">
          <span className="terminal-task-meta-label">{field.label}:</span>{" "}
          {field.key === "url" && typeof task.url === "string" && task.url ? (
            <a
              className="terminal-task-meta-link"
              href={task.url}
              target="_blank"
              rel="noreferrer"
              title={task.url}
            >
              {task.url}
            </a>
          ) : (
            <span className="terminal-task-meta-value">{task[field.key] || "-"}</span>
          )}
        </p>
      ))}
    </div>
  );
}
