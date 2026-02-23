import { ChevronRight } from "lucide-react";

type SampleData = {
  taskId: string;
  fieldName: string;
  elementId: string;
  elementName: string;
  url: string;
  actionStatus?: "OK" | "SUCCESS" | "ERROR" | "RUNNING";
  actions: {
    type: "click" | "input" | "select" | "navigate" | "success" | "error";
    timestamp: string;
    details: string;
  }[];
};

type HeaderKey = "taskId" | "fieldName" | "elementId" | "elementName" | "url";

const headers: { key: HeaderKey; label: string }[] = [
  { key: "taskId", label: "Task ID" },
  { key: "fieldName", label: "Field Name" },
  { key: "elementId", label: "Element ID" },
  { key: "elementName", label: "Element Name" },
  { key: "url", label: "URL" },
];

export const LogsSection = () => {
  const sampleData: SampleData[] = [
    {
      taskId: "hlxRywqSklCDik89gdYTH",
      fieldName: "FC_EDIVERS_YON",
      elementId: "370",
      elementName:
        "Participating Entity Products/Services in Single/Related Industries",
      url: "https://axis.ehr.com/en-US/survey-setup/surveys/48/organization/370",
      actionStatus: "OK",
      actions: [
        {
          type: "navigate",
          timestamp: "2024-06-01T12:00:00Z",
          details:
            "Navigate: url: https://axis.ehr.com/en-US/survey-setup/surveys/48/organization/370",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:02Z",
          details: "Element status: Approved",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:03Z",
          details: "Automation action: Re-Approve",
        },
        {
          type: "click",
          timestamp: "2024-06-01T12:00:04Z",
          details: "Re-approve: focus tab: bring to front",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:05Z",
          details: "Re-approve: unlock check: ensure unlocked",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:06Z",
          details: "Re-approve: unlock status: unlocked",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:07Z",
          details: "Re-approve: wait: delayMs: 500",
        },
        {
          type: "click",
          timestamp: "2024-06-01T12:00:08Z",
          details: "Re-approve: refocus tab: bring to front",
        },
        {
          type: "click",
          timestamp: "2024-06-01T12:00:09Z",
          details: "Re-approve: click approve: toggle approve",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:10Z",
          details: "Re-approve: approve result: success: yes",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:11Z",
          details: "Re-approve: status after toggle: approved",
        },
      ],
    },

    {
      taskId: "rAQasMvKoYxQdXr91Lpwe",
      fieldName: "FC_EDIVERS_YON",
      elementId: "371",
      elementName:
        "Participating Entity Products/Services in Single/Related Industries",
      url: "https://axis.ehr.com/en-US/survey-setup/surveys/48/organization/371",
      actionStatus: "RUNNING",
      actions: [
        {
          type: "navigate",
          timestamp: "2024-06-01T12:00:00Z",
          details:
            "Navigate: url: https://axis.ehr.com/en-US/survey-setup/surveys/48/organization/371",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:05Z",
          details: "Element status: Approved",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:06Z",
          details: "Automation action: Re-Approve",
        },
        {
          type: "click",
          timestamp: "2024-06-01T12:00:07Z",
          details: "Re-approve: focus tab: bring to front",
        },
        {
          type: "success",
          timestamp: "2024-06-01T12:00:08Z",
          details: "Re-approve: unlock check: ensure unlocked",
        },
      ],
    },
  ];

  return (
    <section className="h-full min-h-0 flex flex-col gap-2 p-2">
      <div className="border flex-1 rounded-lg border-black bg-slate-900 text-white">
        {/* Logging i */}

        {sampleData.map((entry, index) => (
          <div
            key={entry.taskId}
            className="bg-slate-900 m-1 rounded border border-wtwPrimary p-2 text-sm text-[11px] space-y-0.5 relative"
          >
            {entry.actionStatus ? (
              <div className="absolute top-1 right-1 text-xs">
                <span>Row: {index + 1}</span>
                <span
                  className={`ml-2 px-1 py-0.5 rounded text-xs ${
                    entry.actionStatus === "SUCCESS"
                      ? "bg-green-700"
                      : entry.actionStatus === "FAILED"
                        ? "bg-red-700"
                        : "bg-yellow-700"
                  }`}
                >
                  {entry.actionStatus}
                </span>
              </div>
            ) : (
              ""
            )}

            <div className="flex flex-col">
              {headers.map(({ key, label }) => (
                <span key={key} className="text-[11px] tracking-wider">
                  <span className="text-blue-300">{label}:</span> {entry[key]}
                </span>
              ))}
            </div>

            <div>
              <ul className="mt-1 ml-4 list-none text-amber-200">
                {entry.actions.map((action, index) => (
                  <li key={index}>
                    <ChevronRight className="inline mr-1 w-3 h-3" />{" "}
                    {action.details}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
