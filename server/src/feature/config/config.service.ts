import { nanoid } from "nanoid";

import { config as configTb, type Config } from "@server/db/schema";
import type { CreateConfig } from "shared";

import * as configRepo from "./config.repo";

const DEFAULT_UDM_CONFIG = {
  configFor: "udm",
  baseUrl: "https://axis.ehr.com/en-US/survey-setup/surveys",
  surveyline: "48",
  automationType: "udm:open_elem",
  translation: "English",
} as const;

export const createConfigService = async (
  payload: CreateConfig,
): Promise<Config | null> => {
  const configFor = payload?.configFor ?? DEFAULT_UDM_CONFIG.configFor;

  const existingConfig = await configRepo.getConfigFor(configFor);
  if (existingConfig) {
    throw new Error("Config already exists");
  }

  const newData: Config = {
    id: nanoid(),
    configFor: configFor as unknown as Config["configFor"],
    baseUrl: payload.baseUrl ?? DEFAULT_UDM_CONFIG.baseUrl,
    surveyline: payload.surveyline ?? DEFAULT_UDM_CONFIG.surveyline,

    automationType: (payload.automationType ??
      DEFAULT_UDM_CONFIG.automationType) as unknown as Config["automationType"],
    translation: payload.translation ?? DEFAULT_UDM_CONFIG.translation,
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
