import { Hono } from "hono";
import {
  createConfig,
  deleteConfig,
  getConfigFor,
  updateConfig,
} from "./config.handler";
import { zodThrow } from "@server/middleware/zodThrow";

import {
  createConfigSchema,
  createTaskSchema,
  updateConfigSchema,
} from "shared";

export const configRoute = new Hono()
  .post("/", zodThrow(createConfigSchema), createConfig)
  .get("/:configFor", getConfigFor)
  .patch("/:id", zodThrow(updateConfigSchema), updateConfig)
  .delete("/:id", deleteConfig);
