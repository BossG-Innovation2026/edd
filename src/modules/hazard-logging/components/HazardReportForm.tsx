"use client";

// FR-UX-01: a hazard report takes no more than four steps:
//   1 zone (and exact location, FR-HL-04), 2 type (FR-HL-02), 3 description, 4 review and submit.
// Photos (FR-HL-05) will join step 4 when that requirement is built.
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { ReportFormOptions, SubmitResult } from "../service";
import {
  checkHazardClassification,
  hazardReportInputSchema,
  SEVERITY_OPTIONS,
  zodFieldErrors,
  type FieldErrors,
  type HazardReportInput,
} from "../validation";

export const REPORT_STEPS = [
  { title: "Where is it?", fields: ["zoneId", "locationDescription"] },
  { title: "What kind of hazard?", fields: ["categoryId", "typeId", "otherTypeSpecified"] },
  { title: "What did you see?", fields: ["description", "observedAt", "initialSeverity"] },
  { title: "Check and send", fields: [] },
] as const satisfies readonly { title: string; fields: readonly (keyof HazardReportInput)[] }[];

type Draft = {
  zoneId: string;
  locationDescription: string;
  categoryId: string;
  typeId: string;
  otherTypeSpecified: string;
  description: string;
  observedAt: string; // value of <input type="datetime-local">, in the phone's local time
  initialSeverity: string;
  isAnonymous: boolean; // FR-UX-06: anonymous for security/safety reports
};

function localNow(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toInput(draft: Draft) {
  return {
    ...draft,
    otherTypeSpecified: draft.otherTypeSpecified || undefined,
    observedAt: draft.observedAt ? new Date(draft.observedAt) : undefined,
  };
}

type Props = {
  options: ReportFormOptions;
  onSubmit: (input: unknown) => Promise<SubmitResult>;
};

export function HazardReportForm({ options, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => ({
    zoneId: "",
    locationDescription: "",
    categoryId: "",
    typeId: "",
    otherTypeSpecified: "",
    description: "",
    observedAt: localNow(),
    initialSeverity: "",
    isAnonymous: false,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentReportId, setSentReportId] = useState<string | null>(null);

  const zonesByBuilding = useMemo(() => {
    const groups = new Map<string, ReportFormOptions["zones"]>();
    for (const zone of options.zones) {
      const key = `${zone.building} - ${zone.floor}`;
      groups.set(key, [...(groups.get(key) ?? []), zone]);
    }
    return [...groups.entries()];
  }, [options.zones]);

  const category = options.categories.find((c) => c.id === draft.categoryId);
  const type = category?.types.find((t) => t.id === draft.typeId);
  const zone = options.zones.find((z) => z.id === draft.zoneId);

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((d) => {
      const next = { ...d, [field]: value };
      // A new category clears the type, so a type can never belong to the wrong category (FR-HL-02).
      if (field === "categoryId" && value !== d.categoryId) next.typeId = "";
      if (field === "categoryId" || field === "typeId") next.otherTypeSpecified = "";
      return next;
    });
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateStep(index: number): FieldErrors {
    const fields = REPORT_STEPS[index].fields;
    if (fields.length === 0) return {};
    const mask = Object.fromEntries(fields.map((f) => [f, true])) as Partial<Record<keyof HazardReportInput, true>>;
    const parsed = hazardReportInputSchema.pick(mask).safeParse(toInput(draft));
    const stepErrors = parsed.success ? {} : zodFieldErrors(parsed.error);
    if (index === 1 && !stepErrors.categoryId && !stepErrors.typeId) {
      const found = type ? { id: type.id, categoryId: draft.categoryId, isOther: type.isOther } : null;
      Object.assign(stepErrors, checkHazardClassification(draft, found));
    }
    return stepErrors;
  }

  function goNext(event: FormEvent) {
    event.preventDefault();
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep((s) => s + 1);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setFormMessage(null);
    try {
      const result = await onSubmit(toInput(draft));
      if (result.ok) {
        setSentReportId(result.reportId);
      } else if (result.reason === "invalid") {
        setErrors(result.errors);
        const firstBad = REPORT_STEPS.findIndex((s) => s.fields.some((f) => f in result.errors));
        if (firstBad >= 0) setStep(firstBad);
        setFormMessage("Please fix the highlighted answer.");
      } else {
        setFormMessage(result.message);
      }
    } catch {
      setFormMessage("The report could not be sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sentReportId) {
    return (
      <section className="card" aria-live="polite">
        <h2>Report sent</h2>
        <p>
          Your report number is <strong data-testid="report-id">{sentReportId}</strong>. The school will check it.
        </p>
      </section>
    );
  }

  const isLast = step === REPORT_STEPS.length - 1;

  return (
    <form className="card" onSubmit={isLast ? send : goNext} noValidate aria-label="Hazard report">
      <p className="step-count">
        Step {step + 1} of {REPORT_STEPS.length}
      </p>
      <ol className="progress" aria-hidden="true">
        {REPORT_STEPS.map((s, i) => (
          <li key={s.title} className={i <= step ? "done" : undefined} />
        ))}
      </ol>
      <h2>{REPORT_STEPS[step].title}</h2>

      {step === 0 && (
        <>
          <Field id="zoneId" label="Zone" error={errors.zoneId}>
            <select id="zoneId" value={draft.zoneId} onChange={(e) => update("zoneId", e.target.value)}>
              <option value="">Choose a zone</option>
              {zonesByBuilding.map(([group, zones]) => (
                <optgroup key={group} label={group}>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field id="locationDescription" label="Exact location" error={errors.locationDescription}>
            <textarea
              id="locationDescription"
              rows={2}
              placeholder="For example: beside the back door of Room 102"
              value={draft.locationDescription}
              onChange={(e) => update("locationDescription", e.target.value)}
            />
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <fieldset aria-describedby={errors.categoryId ? "categoryId-error" : undefined}>
            <legend className="field-label">
              Category
              <HelpIcon title="What type of hazard?" text="Choose the category that best describes the hazard. Categories help the school prioritize response." />
              <span className="depedterm">(Hazard Classification, FR-HL-02)</span>
            </legend>
            <div className="choices">
              {options.categories.map((c) => (
                <label key={c.id} className="choice">
                  <input
                    type="radio"
                    name="categoryId"
                    value={c.id}
                    checked={draft.categoryId === c.id}
                    onChange={() => update("categoryId", c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <ErrorText id="categoryId-error" message={errors.categoryId} />
          </fieldset>
          {category && (
            <fieldset aria-describedby={errors.typeId ? "typeId-error" : undefined}>
              <legend>Type</legend>
              <div className="choices">
                {category.types.map((t) => (
                  <label key={t.id} className="choice">
                    <input
                      type="radio"
                      name="typeId"
                      value={t.id}
                      checked={draft.typeId === t.id}
                      onChange={() => update("typeId", t.id)}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
              <ErrorText id="typeId-error" message={errors.typeId} />
            </fieldset>
          )}
          {type?.isOther && (
            <Field id="otherTypeSpecified" label="What kind of hazard is it?" error={errors.otherTypeSpecified}>
              <input
                id="otherTypeSpecified"
                type="text"
                placeholder="For example: snake sighting"
                value={draft.otherTypeSpecified}
                onChange={(e) => update("otherTypeSpecified", e.target.value)}
              />
            </Field>
          )}

          {/* FR-UX-06: Anonymous option visible on step 1 for security/personal safety reports */}
          {(draft.categoryId === options.categories.find(c => c.name === "Security and personal safety")?.id) && (
            <div className="field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.isAnonymous}
                  onChange={(e) => update("isAnonymous", e.target.checked)}
                />
                <span>
                  Submit this report anonymously
                  <HelpIcon title="Why anonymous?" text="Anonymous reports help us address security issues without fear of retaliation. Your identity is not recorded." />
                </span>
              </label>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <Field id="description" label="What did you see?" error={errors.description}>
            <textarea
              id="description"
              rows={4}
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field id="observedAt" label="When did you see it?" error={errors.observedAt}>
            <input
              id="observedAt"
              type="datetime-local"
              value={draft.observedAt}
              max={localNow()}
              onChange={(e) => update("observedAt", e.target.value)}
            />
          </Field>
          <fieldset aria-describedby={errors.initialSeverity ? "initialSeverity-error" : undefined}>
            <legend>How serious does it look?</legend>
            <div className="choices choices-row">
              {SEVERITY_OPTIONS.map((s) => (
                <label key={s.value} className="choice">
                  <input
                    type="radio"
                    name="initialSeverity"
                    value={s.value}
                    checked={draft.initialSeverity === s.value}
                    onChange={() => update("initialSeverity", s.value)}
                  />
                  {s.label}
                </label>
              ))}
            </div>
            <ErrorText id="initialSeverity-error" message={errors.initialSeverity} />
          </fieldset>
        </>
      )}

      {step === 3 && (
        <dl className="summary">
          <dt>Zone</dt>
          <dd>{zone ? `${zone.building}, ${zone.floor}: ${zone.name}` : ""}</dd>
          <dt>Exact location</dt>
          <dd>{draft.locationDescription}</dd>
          <dt>Hazard</dt>
          <dd>
            {category?.name}: {type?.isOther ? `Other (${draft.otherTypeSpecified})` : type?.name}
          </dd>
          <dt>What you saw</dt>
          <dd>{draft.description}</dd>
          <dt>When</dt>
          <dd>{draft.observedAt ? new Date(draft.observedAt).toLocaleString() : ""}</dd>
          <dt>How serious</dt>
          <dd>{SEVERITY_OPTIONS.find((s) => s.value === draft.initialSeverity)?.label}</dd>
        </dl>
      )}

      {formMessage && (
        <p className="error" role="alert">
          {formMessage}
        </p>
      )}

      <div className="actions">
        {step > 0 && (
          <button type="button" className="secondary" onClick={() => setStep((s) => s - 1)} disabled={sending}>
            Back
          </button>
        )}
        <button type="submit" disabled={sending}>
          {isLast ? (sending ? "Sending..." : "Send report") : "Next"}
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className={error ? "field has-error" : "field"}>
      <label htmlFor={id}>{label}</label>
      {children}
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="error" role="alert">
      {message}
    </p>
  );
}

// FR-UX-09: Help icon for form fields (FR-HL-01).
function HelpIcon({ title, text }: { title: string; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="help-icon-container">
      <button
        type="button"
        className="help-icon"
        onClick={() => setShow(!show)}
        title={title}
        aria-label={title}
      >
        ?
      </button>
      {show && (
        <div className="help-popup" role="tooltip">
          <strong>{title}</strong>
          <p>{text}</p>
          <button
            type="button"
            className="help-close"
            onClick={() => setShow(false)}
            aria-label="Close help"
          >
            ✕
          </button>
        </div>
      )}
    </span>
  );
}
