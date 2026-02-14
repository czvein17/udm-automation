import { getRun } from "@server/stores/run.store";
import type { Context } from "hono";
import type { ApiResponse } from "shared";

export async function getRunById(c: Context) {
  const runId = c.req.param("runId");
  const run = getRun(runId);

  if (!run)
    return c.json(
      {
        error: "Not found",
      },
      404,
    );

  return c.json(run, 200);
}

type TaskRuns = {
  id: string;
  rundId: string;
  fieldName: string;
  logs: {
    status: "success" | "failed" | "loading";
    action: string;
  }[];
};

export async function getAllRunByRunId(c: Context) {
  const tasksRuns: TaskRuns[] = [
    {
      id: "test-task-1",
      rundId: "test-run-1",
      fieldName: "test-field",
      logs: [
        {
          status: "success",
          action: "open yt tabs",
        },

        {
          status: "failed",
          action: "searching field name",
        },
      ],
    },

    {
      id: "test-task-2",
      rundId: "test-run-1",
      fieldName: "test-field-2",
      logs: [
        {
          status: "success",
          action: "open yt tabs",
        },

        {
          status: "failed",
          action: "searching field name",
        },
      ],
    },
  ];

  const data: ApiResponse<TaskRuns[]> = {
    message: "Runs retrieved successfully",
    success: true,
    data: tasksRuns,
  };

  return c.json(data, 200);
}
