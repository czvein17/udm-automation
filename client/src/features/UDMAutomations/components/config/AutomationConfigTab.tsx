import { useEffect, useMemo, useState } from "react";
import { useGetConfig, useConfigMutations } from "@features/UDMAutomations/hooks/useConfigServices";
import type { CreateConfig } from "shared";
import { configForValues } from "shared/dist/schema/config.schema";
type ConfigWithId = CreateConfig & { id?: string; name?: string };

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
      name: "",
      surveyline: "",
      automationType: automationTypes[0],
      translation: "English",
      autoCloseBrowser: false,
      autoCloseTaskPage: false,
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
        name: cfg.name ?? "",
        surveyline: cfg.surveyline ?? "",
        automationType: cfg.automationType ?? automationTypes[0],
        translation: cfg.translation ?? "English",
        autoCloseBrowser: cfg.autoCloseBrowser ?? false,
        autoCloseTaskPage: cfg.autoCloseTaskPage ?? false,
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
      autoCloseBrowser: form.autoCloseBrowser ?? false,
      autoCloseTaskPage: form.autoCloseTaskPage ?? false,
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

  const fieldDefs: Array<{
    key: keyof ConfigWithId;
    label: string;
    type: "input" | "select" | "boolean";
    placeholder?: string;
    options?: readonly string[] | string[];
    optionLabel?: (o: string) => string;
    readonly?: boolean;
  }> = [
    { key: "id", label: "ID", type: "input", readonly: true },
    { key: "name", label: "Name", type: "input", placeholder: "optional" },
    {
      key: "baseUrl",
      label: "Base URL",
      type: "input",
      placeholder: "https://...",
    },
    {
      key: "surveyline",
      label: "Surveyline",
      type: "input",
      placeholder: "optional",
    },
    {
      key: "automationType",
      label: "Automation Type",
      type: "select",
      options: automationTypes as unknown as string[],
      optionLabel: (t: string) => automationTypeLabels[t] ?? t,
    },
    { key: "translation", label: "Translation", type: "input" },
    {
      key: "autoCloseTaskPage",
      label: "Auto-close Task Page",
      type: "boolean",
    },
    {
      key: "autoCloseBrowser",
      label: "Auto-close Browser",
      type: "boolean",
    },
  ];

  return (
    <div className="h-full min-h-0 p-3">
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-slate-600">Config for</label>
        <select
          id="configFor"
          name="configFor"
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

      {fieldDefs.map((f) => (
        <div className="form-row" key={String(f.key)}>
          <label className="form-label">{f.label}</label>
          {f.type === "input" ? (
            <input
              id={`field-${String(f.key)}`}
              name={String(f.key)}
              className="form-input"
              value={
                (form as unknown as Record<string, string | undefined>)[
                  f.key as string
                ] ?? (f.key === "translation" ? "English" : "")
              }
              onChange={(e) =>
                onChange(
                  f.key,
                  e.target.value as unknown as ConfigWithId[keyof ConfigWithId],
                )
              }
              disabled={!!f.readonly}
              readOnly={!!f.readonly}
              placeholder={f.placeholder}
            />
          ) : f.type === "select" ? (
            <select
              id={`field-${String(f.key)}`}
              name={String(f.key)}
              className="form-input"
              value={
                (form as unknown as Record<string, string | undefined>)[
                  f.key as string
                ] ?? automationTypes[0]
              }
              onChange={(e) =>
                onChange(
                  f.key,
                  e.target.value as unknown as ConfigWithId[keyof ConfigWithId],
                )
              }
            >
              {f.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {f.optionLabel ? f.optionLabel(opt) : opt}
                </option>
              ))}
            </select>
          ) : (
            <select
              id={`field-${String(f.key)}`}
              name={String(f.key)}
              className="form-input"
              value={
                ((form as unknown as Record<string, unknown>)[f.key as string] ??
                false)
                  ? "true"
                  : "false"
              }
              onChange={(e) =>
                onChange(
                  f.key,
                  (e.target.value === "true") as ConfigWithId[keyof ConfigWithId],
                )
              }
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          )}
        </div>
      ))}

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
