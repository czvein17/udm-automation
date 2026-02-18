import { db } from "@server/db/client";
import { config as configTb, type Config } from "@server/db/schema";
import { eq } from "drizzle-orm";

export const createConfig = async (data: Config): Promise<Config | null> => {
  const result = await db.insert(configTb).values(data).returning();

  const createdArr = result as Config[] | undefined;
  if (!createdArr || createdArr.length === 0) return null;

  return createdArr[0] ?? null;
};

export const getConfigFor = async (
  configFor: string,
): Promise<Config | null> => {
  if (!configFor) return null;
  const result = await db
    .select()
    .from(configTb)
    .where(eq(configTb.configFor, configFor))
    .limit(1);

  return result[0] ?? null;
};

export const getConfigById = async (id: string): Promise<Config | null> => {
  const result = await db
    .select()
    .from(configTb)
    .where(eq(configTb.id, id))
    .limit(1);

  return result[0] ?? null;
};

export const updateConfig = async (data: Config): Promise<Config | null> => {
  const result = await db
    .update(configTb)
    .set(data)
    .where(eq(configTb.id, data.id))
    .returning();

  const updatedArr = result as Config[] | undefined;
  if (!updatedArr || updatedArr.length === 0) return null;

  return updatedArr[0] ?? null;
};

export const deleteConfig = async (id: string): Promise<boolean> => {
  const result = await db.delete(configTb).where(eq(configTb.id, id));

  return result.rowsAffected > 0;
};
