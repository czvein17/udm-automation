import type { Context } from "hono";
import type { ApiResponse, CreateConfig } from "shared";
import {
  createConfigService,
  deleteConfigByIdService,
  getConfigForService,
  updateConfigService,
} from "./config.service";

export const createConfig = async (c: Context) => {
  const payload = (await c.req.json()) as CreateConfig;

  const result = await createConfigService(payload);

  const data: ApiResponse<typeof result> = {
    message: "Config created successfully",
    success: true,
    data: result,
  };

  return c.json(data, { status: 200 });
};

export const getConfigFor = async (c: Context) => {
  const configFor = c.req.param("configFor") as string;

  const result = await getConfigForService(configFor);

  const data: ApiResponse<typeof result> = {
    message: "Config retrieved successfully",
    success: true,
    data: result,
  };

  return c.json(data, { status: 200 });
};

export const updateConfig = async (c: Context) => {
  const payload = (await c.req.json()) as CreateConfig;
  const id = c.req.param("id") as string;

  const result = await updateConfigService(payload, id);

  const data: ApiResponse<typeof result> = {
    message: "Config updated successfully",
    success: true,
    data: result,
  };

  return c.json(data, { status: 200 });
};

export const deleteConfig = async (c: Context) => {
  const id = c.req.param("id") as string;

  const result = await deleteConfigByIdService(id);

  const data: ApiResponse<null> = {
    message: "Config deleted successfully",
    success: result,
    data: null,
  };

  return c.json(data, { status: 200 });
};
