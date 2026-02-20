import { useQuery, useMutation } from "@tanstack/react-query";
import type { CreateConfig } from "shared";
type ConfigWithId = CreateConfig & { id?: string };
import {
  getConfigForService,
  createConfigService,
  updateConfigService,
  deleteConfigService,
} from "../services/config.services";

export const useGetConfig = (configFor: string | null) => {
  const query = useQuery<ConfigWithId | null>({
    queryKey: ["config", configFor],
    queryFn: async () => {
      if (!configFor) return null;
      return (await getConfigForService(configFor)) as ConfigWithId | null;
    },

    enabled: !!configFor,
  });

  return query;
};

export const useConfigMutations = () => {
  const create = useMutation({
    mutationFn: async (payload: CreateConfig) => createConfigService(payload),
    onSuccess: (data) => console.log("created", data),
    onError: (err) => console.error(err),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateConfig;
    }) => updateConfigService(id, payload),
    onSuccess: (data) => console.log("updated", data),
    onError: (err) => console.error(err),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteConfigService(id),
    onSuccess: (data) => console.log("deleted", data),
    onError: (err) => console.error(err),
  });

  return {
    create: {
      mutate: create.mutate,
      isLoading: create.isPending,
    },
    update: {
      mutate: update.mutate,
      isLoading: update.isPending,
    },
    remove: {
      mutate: remove.mutate,
      isLoading: remove.isPending,
    },
  };
};
