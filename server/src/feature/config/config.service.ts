import { nanoid } from "nanoid";

import { config as configTb, type Config } from "@server/db/schema";
import type { CreateConfig } from "shared";

import * as configRepo from "./config.repo";

export const createConfigService = async (
  payload: CreateConfig,
): Promise<Config | null> => {
  if (!payload?.configFor) {
    throw new Error("configFor is required");
  }

  const existingConfig = await configRepo.getConfigFor(payload.configFor);
  if (existingConfig) {
    throw new Error("Config already exists");
  }

  const newData: Config = {
    id: nanoid(),
    configFor: payload.configFor as unknown as Config["configFor"],
    baseUrl: payload.baseUrl ?? undefined,
    surveyline: payload.surveyline ?? undefined,

    automationType:
      payload.automationType as unknown as Config["automationType"],
    translation: payload.translation ?? undefined,
  };

  return await configRepo.createConfig(newData);
};

export const getConfigForService = async (
  configFor: string,
): Promise<Config> => {
  const config = await configRepo.getConfigFor(configFor);

  if (!config) {
    throw new Error("Config not found");
  }

  return config;
};

export const updateConfigService = async (
  payload: CreateConfig,
  id: string,
): Promise<Config | null> => {
  const existingConfig = await configRepo.getConfigById(id);

  if (!existingConfig) {
    throw new Error("Config not found");
  }

  const updatedData: Config = {
    ...existingConfig,
    configFor: (payload.configFor ??
      existingConfig.configFor) as Config["configFor"],
    baseUrl: payload.baseUrl ?? existingConfig.baseUrl ?? undefined,
    surveyline: payload.surveyline ?? existingConfig.surveyline ?? undefined,
    automationType: (payload.automationType ??
      existingConfig.automationType) as Config["automationType"],
    translation: payload.translation ?? existingConfig.translation ?? undefined,
  };

  return await configRepo.updateConfig(updatedData);
};

export const deleteConfigByIdService = async (id: string): Promise<boolean> => {
  const config = await configRepo.deleteConfig(id);

  if (!config) {
    throw new Error("Config not deleted");
  }

  return config;
};
