// @vitest-environment jsdom
// FR-UX-01. A hazard report shall require no more than four steps (zone, type, description,
// optional photos and submit). Step 4 is "review and submit" until photos (FR-HL-05) are built.
// The 3-minute first-time-user target (NFR-IC-01) needs a human timing test; see the Playwright test
// for an end-to-end run in a real browser.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HazardReportForm, REPORT_STEPS } from "@/modules/hazard-logging/components/HazardReportForm";
import type { ReportFormOptions, SubmitResult } from "@/modules/hazard-logging/service";

const options: ReportFormOptions = {
  zones: [
    { id: "z1", building: "Building A", floor: "Ground floor", name: "Classrooms 101-104" },
    { id: "z2", building: "Building B", floor: "Ground floor", name: "Canteen" },
  ],
  categories: [
    {
      id: "c-nat",
      name: "Natural",
      types: [
        { id: "t-flood", name: "Flood", isOther: false },
        { id: "t-nat-other", name: "Other", isOther: true },
      ],
    },
    {
      id: "c-fac",
      name: "Facility and structural",
      types: [{ id: "t-fire", name: "Fire hazard", isOther: false }],
    },
  ],
};

function setup(
  onSubmit = vi.fn(async (_input: unknown): Promise<SubmitResult> => ({ ok: true, id: "x", reportId: "HZ-2026-00007" })),
) {
  const user = userEvent.setup();
  render(<HazardReportForm options={options} onSubmit={onSubmit} />);
  return { user, onSubmit };
}

const next = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Next" }));

async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Zone"), "z2");
  await user.type(screen.getByLabelText("Exact location"), "Behind the canteen sink");
}
async function fillStep2(user: ReturnType<typeof userEvent.setup>, typeName = "Flood") {
  await user.click(screen.getByLabelText("Natural"));
  await user.click(screen.getByLabelText(typeName));
}
async function fillStep3(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("What did you see?"), "Water pooling on the floor");
  await user.click(screen.getByLabelText("High"));
}

describe("FR-UX-01 four-step hazard report", () => {
  it("FR-UX-01: the form has exactly four steps, in the SRS order", () => {
    expect(REPORT_STEPS).toHaveLength(4);
    expect(REPORT_STEPS.map((s) => s.fields)).toEqual([
      ["zoneId", "locationDescription"], // zone (with exact location, FR-HL-04)
      ["categoryId", "typeId", "otherTypeSpecified"], // type (FR-HL-02)
      ["description", "observedAt", "initialSeverity"], // description
      [], // review and submit
    ]);
  });

  it("FR-UX-01: a complete report is sent in four steps and the reporter sees the Report ID", async () => {
    const { user, onSubmit } = setup();

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    await fillStep1(user);
    await next(user);

    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    await fillStep2(user);
    await next(user);

    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    await fillStep3(user);
    await next(user);

    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
    expect(screen.getByText("Building B, Ground floor: Canteen")).toBeInTheDocument();
    expect(screen.getByText("Natural: Flood")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const sent = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(sent).toMatchObject({
      zoneId: "z2",
      locationDescription: "Behind the canteen sink",
      categoryId: "c-nat",
      typeId: "t-flood",
      description: "Water pooling on the floor",
      initialSeverity: "HIGH",
    });
    expect(sent.observedAt).toBeInstanceOf(Date);
    expect(await screen.findByTestId("report-id")).toHaveTextContent("HZ-2026-00007");
  });

  it("FR-UX-01: the date observed is pre-filled, so the reporter does not have to type it", async () => {
    const { user } = setup();
    await fillStep1(user);
    await next(user);
    await fillStep2(user);
    await next(user);

    expect((screen.getByLabelText("When did you see it?") as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("FR-UX-01 with NFR-IC-02: a step with missing answers shows clear messages and does not advance", async () => {
    const { user } = setup();

    await next(user);

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Choose the zone where you saw the hazard.")).toBeInTheDocument();
    expect(screen.getByText(/Describe the exact spot/)).toBeInTheDocument();
  });

  it("FR-UX-01 with FR-HL-02: choosing 'Other' asks what the hazard is and requires it", async () => {
    const { user } = setup();
    await fillStep1(user);
    await next(user);
    await fillStep2(user, "Other");

    const specify = screen.getByLabelText("What kind of hazard is it?");
    await next(user);
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByText(/Say what kind of hazard it is/)).toBeInTheDocument();

    await user.type(specify, "Snake sighting");
    await next(user);
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });

  it("FR-UX-01: types are shown only for the chosen category, and changing category clears the type", async () => {
    const { user } = setup();
    await fillStep1(user);
    await next(user);

    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    await fillStep2(user);
    await user.click(screen.getByLabelText("Facility and structural"));

    const typeGroup = screen.getByRole("group", { name: "Type" });
    expect(within(typeGroup).getByLabelText("Fire hazard")).not.toBeChecked();
    expect(within(typeGroup).queryByLabelText("Flood")).not.toBeInTheDocument();
  });

  it("FR-UX-01: Back keeps the answers already given", async () => {
    const { user } = setup();
    await fillStep1(user);
    await next(user);
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByLabelText("Zone")).toHaveValue("z2");
    expect(screen.getByLabelText("Exact location")).toHaveValue("Behind the canteen sink");
  });

  it("FR-UX-01: if the server rejects an answer, the form returns to that step with the message", async () => {
    const onSubmit = vi.fn(
      async (_input: unknown): Promise<SubmitResult> => ({
        ok: false,
        reason: "invalid",
        errors: { zoneId: "Choose a zone from the list." },
      }),
    );
    const { user } = setup(onSubmit);
    await fillStep1(user);
    await next(user);
    await fillStep2(user);
    await next(user);
    await fillStep3(user);
    await next(user);
    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(await screen.findByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Choose a zone from the list.")).toBeInTheDocument();
  });
});
