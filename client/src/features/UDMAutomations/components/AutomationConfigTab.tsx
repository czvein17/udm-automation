import { useEffect, useMemo, useState } from "react";
import { useGetConfig, useConfigMutations } from "../hooks/useConfigServices";
import type { CreateConfig } from "shared";
import { configForValues } from "shared/dist/schema/config.schema";
type ConfigWithId = CreateConfig & { id?: string };

const automationTypes = [
  "udm:open_elem",
  "udm:re-approve",
  "udm:edit_attributes",
  "udm:edit_applicabilities",
] as const;

const automationTypeLabels: Record<string, string> = {
  "udm:open_elem": "Open Elements",
  "udm:re-approve": "Re-Approve Elements",
  "udm:edit_attributes": "Edit Attributes (Element Name)",
  "udm:edit_applicabilities": "Edit Applicabilities (Display Name)",
};

export const AutomationConfigTab = () => {
  const [configFor, setConfigFor] = useState<string>("udm");
  const { data, isLoading, refetch } = useGetConfig(configFor);

  const { create, update, remove } = useConfigMutations();

  const initialForm = useMemo<ConfigWithId>(
    () => ({
      configFor: configFor as CreateConfig["configFor"],
      baseUrl: "",
      surveyline: "",
      automationType: automationTypes[0],
      translation: "English",
    }),
    [configFor],
  );

  const [form, setForm] = useState<ConfigWithId>(initialForm);

  useEffect(() => {
    if (data) {
      const cfg = data as unknown as ConfigWithId;
      setForm({
        configFor: cfg.configFor,
        baseUrl: cfg.baseUrl ?? "",
        surveyline: cfg.surveyline ?? "",
        automationType: cfg.automationType ?? automationTypes[0],
        translation: cfg.translation ?? "English",
        id: cfg.id,
      });
    } else {
      setForm(initialForm);
    }
  }, [data, initialForm]);

  const onChange = <K extends keyof ConfigWithId>(k: K, v: ConfigWithId[K]) =>
    setForm((s) => ({ ...(s ?? {}), [k]: v }) as ConfigWithId);

  const onSave = async () => {
    const payload: CreateConfig = {
      configFor: (form.configFor ?? configFor) as CreateConfig["configFor"],
      baseUrl: form.baseUrl ?? undefined,
      surveyline: form.surveyline ?? undefined,
      automationType: (form.automationType ??
        automationTypes[0]) as CreateConfig["automationType"],
      translation: form.translation ?? "English",
    };

    try {
      if (form.id) {
        await new Promise((res, rej) =>
          update.mutate(
            { id: form.id as string, payload },
            { onSuccess: res, onError: rej },
          ),
        );
      } else {
        await new Promise((res, rej) =>
          create.mutate(payload, { onSuccess: res, onError: rej }),
        );
      }
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = async () => {
    if (!form.id) return;
    try {
      await new Promise((res, rej) =>
        remove.mutate(form.id as string, { onSuccess: res, onError: rej }),
      );
      setForm(initialForm);
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full min-h-0 p-3">
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-slate-600">Config for</label>
        <select
          value={configFor}
          onChange={(e) => setConfigFor(e.target.value)}
          className="form-input"
        >
          {configForValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <button
          className="btn"
          onClick={() => refetch()}
          aria-label="Load config"
        >
          {isLoading ? "Loading..." : "Load"}
        </button>

        <div className="ml-auto text-xs text-slate-500">
          Current:{" "}
          <span className="font-semibold text-slate-700">{configFor}</span>
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">Base URL</label>
        <input
          className="form-input"
          value={form.baseUrl ?? ""}
          onChange={(e) => onChange("baseUrl", e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="form-row">
        <label className="form-label">Surveyline</label>
        <input
          className="form-input"
          value={form.surveyline ?? ""}
          onChange={(e) => onChange("surveyline", e.target.value)}
          placeholder="optional"
        />
      </div>

      <div className="form-row">
        <label className="form-label">Automation Type</label>
        <select
          className="form-input"
          value={(form.automationType as string) ?? automationTypes[0]}
          onChange={(e) =>
            onChange(
              "automationType",
              e.target.value as CreateConfig["automationType"],
            )
          }
        >
          {automationTypes.map((t) => (
            <option key={t} value={t}>
              {automationTypeLabels[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label className="form-label">Translation</label>
        <input
          className="form-input"
          value={form.translation ?? "English"}
          onChange={(e) => onChange("translation", e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={onSave}>
          Save
        </button>
        <button
          className="btn btn-danger"
          onClick={onDelete}
          disabled={!form.id}
        >
          Delete
        </button>
        <button
          className="btn"
          onClick={() => setForm(initialForm)}
          title="Reset form"
        >
          New
        </button>
      </div>
    </div>
  );
};
