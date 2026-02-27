import { db } from "@server/db/client";
import { tasks } from "@server/db/schema";

export const deleteAllTask = async () => {
  return await db.delete(tasks);
};
