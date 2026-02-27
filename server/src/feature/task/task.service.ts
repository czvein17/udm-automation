import * as TaskRepo from "./task.repo";

export const deleteTask = async () => {
  await TaskRepo.deleteAllTask();
};
