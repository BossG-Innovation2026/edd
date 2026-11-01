# SRS v0.1 – Risk Profiling and Safety Analytics System

Oct 31, 2026 · @Erick

## 1 Introduction

This SRS is the initial requirements baseline (v0.1) for a web-based system that helps school heads of stand-alone senior high schools in Region III log hazards, rate asset vulnerability, compute risk scores, and act on safety data.

**Purpose.** It defines what the system must do and how well, so that Chapter 3, the validation instruments, and the code describe the same system.

**Scope.** Seven modules: hazard logging, asset vulnerability mapping, risk scoring, community sentiment and feeling analysis, dashboards and reports, incident and damage reporting, and report generation, all under role-based access and the user experience rules in Section 7.

**Mapping to SOP 4.** The approved SOP lists six components; the seven modules map onto them as follows, so Chapters 3 and 4 report against the SOP wording.

| SOP 4 component | SRS section |
| --- | --- |
| (a) Hazard logging | 3.1 Hazard Logging, with 3.6 Incident and Damage Reporting |
| (b) Asset vulnerability mapping | 3.2 Asset Vulnerability Mapping |
| (c) Risk scoring | 3.3 Risk Scoring |
| (d) Dashboards and reports | 3.5 Dashboards and 3.7 Report Generation |
| (e) Role-based access | 2 User Roles and Permissions, enforced in every module |
| (f) Community sentiment analysis | 3.4 Community Sentiment and Feeling Analysis |

**Baseline status.** This version was drafted before data collection. Under SOP 3, it will be revised from the requirements identified by school heads, DRRM coordinators, and school personnel, and refined in each iteration of the Agile development model. Chapter 4 reports what changed between this baseline and the final SRS.

**Constraint CON-01.** The system shall not exchange data with LIGTAS+, IMRS, or other DepEd platforms. It is a school-level system that complements them. Verifiers may consult LIGTAS+ or LGU hazard maps when rating likelihood.

**Key definitions** (RA 10121, Sec. 3; read from a scanned copy, check wording against the PDF before quoting)

| Term | Meaning in this SRS | Basis |
| --- | --- | --- |
| Hazard | A condition that could cause harm to people, assets, or school operations | RA 10121, Sec. 3(v) |
| Incident | An event that has already happened and caused or threatened harm | DO 21, s. 2015; DO 6, s. 2026 |
| Vulnerability | Characteristics of an asset that make it susceptible to a hazard's damaging effects | RA 10121, Sec. 3(nn) |
| Risk | The combination of the probability of an event and its negative consequences; computed here as R = L × I | RA 10121, Sec. 3(hh) |
| Vulnerability Index (VI) | Mean of an asset's five criterion ratings, 1.00 to 5.00 | Section 3.2 |
| Safety Perception Index (SPI) | Mean of survey rating items, 1.00 to 5.00 | Section 3.4 |
| Net Sentiment Score (NSS) | (Positive − Negative) ÷ all labeled comments, −1 to +1 | Section 3.4 |

## 2 User Roles and Permissions

Five roles share the system: the School Head decides, the DRRM Coordinator operates, and the System Administrator maintains without seeing safety data.

| Function | School Head | DRRM Coordinator | School Personnel | Community User (learners, parents, community) | System Administrator |
| --- | --- | --- | --- | --- | --- |
| Submit a hazard report | Yes | Yes | Yes | Yes | No |
| Verify or reject reports | Yes | Yes | No | No | No |
| Record assets and vulnerability ratings | View only | Yes | No | No | No |
| View risk scores and risk profile | Yes | Yes | Summary only | No | No |
| View dashboards and analytics | Full | Full | Summary only | No | No |
| Assign and track mitigation actions | Yes | Yes | View own tasks | No | No |
| Respond to sentiment surveys | Yes | Yes | Yes | Yes | No |
| View sentiment results | Yes | Yes | No | No | No |
| Generate and export reports | Yes | Yes | No | No | No |
| Track own submissions | Yes | Yes | Yes | Yes | No |
| Approve new accounts | Yes | No | No | No | No |
| Create, deactivate, reset accounts | No | No | No | No | Yes |
| Configure map, rooms, incident defaults, report layouts, and risk matrix | Approves risk-setting changes; views audit trail | Notified of zone changes | No | No | Yes, logged; risk settings only after School Head approval (FR-UR-07) |
| Run backups, view system logs | No | No | No | No | Yes |

School Personnel designated as **Child Protection and Discipline Officers** also see security and personal safety reports and learner protection incidents.

**Requirements**

- **FR-UR-01.** The system shall provide five roles: School Head, DRRM Coordinator, School Personnel, Community User, and System Administrator.
- **FR-UR-02.** The system shall restrict each function to the roles in the table above.
- **FR-UR-03.** A new account shall stay inactive until the School Head approves it.
- **FR-UR-04.** A learner account shall not be activated until a parent or guardian gives specific, informed consent for the stated purposes, recorded in the system before activation (RA 10173, Sec. 3(b)).
- **FR-UR-05.** Community Users shall view only their own submissions and their status.
- **FR-UR-06.** The System Administrator shall manage accounts, settings, and backups; configure the school map (buildings, floors, zones, and rooms), incident dropdown options and default values, and report layouts; and has no access to the content of hazard reports, incident records, survey responses, or vulnerability ratings.
- **FR-UR-07.** Changes to hazard types, vulnerability criteria and anchors, likelihood and severity anchors, and risk bands shall take effect only after the School Head approves them; the System Administrator applies approved changes. Other configuration changes (map layout, rooms, incident defaults, and report layouts) apply directly. All configuration changes are recorded in the audit trail with the old and new values. A change to a zone that holds verified hazards shall notify the DRRM Coordinator to review the affected scores. Official report fields cannot be changed (FR-RP-02).
- **FR-UR-08.** The system shall keep an audit trail of who created, edited, verified, or approved each record.
- **FR-UR-09.** The School Head shall be able to designate School Personnel accounts as Child Protection and Discipline Officers.
- **FR-UR-10.** One account shall be able to hold more than one role (for example, School Head and DRRM Coordinator, as DO 21, s. 2015 allows), and the audit trail shall record which role was used.

Learner accounts collect only name, grade level, strand, and section. The Learner Reference Number is not stored unless a clear need is shown and the consent covers it (RA 10173, Sec. 13(a)). Learners and guardians receive notice of how their data is processed before entry (Sec. 16(b)) and may request access to their records (Sec. 16(c)).

## 3.1 Hazard Logging

Any active user can report a hazard; only verified reports enter risk scores and dashboards.

**Hazard categories (draft hazard indicators for SOP 5a)**

| Category | Types |
| --- | --- |
| Natural | Earthquake, flood, typhoon and strong winds, landslide, other |
| Facility and structural | Fire hazard, electrical hazard, structural damage, blocked exits, unsafe furniture or equipment, other |
| Health and sanitation | Unsafe drinking water, sanitation facility problems, disease outbreak, food safety, other |
| Security and personal safety | Unauthorized entry or intruder, bullying, violence or fighting, harassment, other |

**Record fields.** Report ID, category, type, school zone (from the school map), location description, date and time observed, description, photos (optional), reporter's initial severity (Low, Moderate, High), status, reporter, verified by, date verified.

**Status workflow.** Submitted → Under verification → Verified or Rejected (including duplicates) → Mitigation in progress → Resolved.

**Requirements**

- **FR-HL-01.** Any active user shall be able to submit a hazard report with the fields above.
- **FR-HL-02.** Reports shall be classified by category and type from a predefined list; "other" requires a description.
- **FR-HL-03.** The System Administrator shall set up the school map from the site plan and zone list provided by the DRRM Coordinator (FR-UR-06).
- **FR-HL-04.** The reporter shall select a zone on the map and describe the exact location in text.
- **FR-HL-05.** The system shall accept up to 3 photos per report, each up to 5 MB.
- **FR-HL-06.** Only verified reports shall be included in risk scores and dashboards.
- **FR-HL-07.** The verifier shall be able to mark a report as a duplicate and link it to the original.
- **FR-HL-08.** The system shall notify the reporter when the report's status changes.
- **FR-HL-09.** Every status change shall be kept with the user and date.
- **FR-HL-10.** Security and personal safety reports shall allow anonymous submission, even from a logged-in account.
- **FR-HL-11.** Security and personal safety reports shall be visible only to the School Head and designated Child Protection and Discipline Officers.
- **FR-HL-12.** The system shall record the date a security or personal safety report is referred to the proper authority and shall not replace the school's investigation process.

**Policy basis.** DO 6, s. 2026 requires secure anonymous reporting channels, which may include an online platform monitored by designated school authorities, and access limited to authorized personnel (FR-HL-10, FR-HL-11) \[VERIFY page numbers\].

## 3.2 Asset Vulnerability Mapping

Each asset is rated 1 to 5 on five criteria (higher = more vulnerable), and its Vulnerability Index (VI) is the mean. The structure follows the exposure, vulnerability, and adaptive capacity assessment in DM 64, s. 2026, Sec. 4.1.

**Asset categories**

| Category | Examples |
| --- | --- |
| Buildings and classrooms | Classrooms, laboratories, offices, stairways, covered courts, perimeter fence and gates |
| Utilities | Electrical system, water supply, sanitation facilities, generator or solar backup |
| Safety and emergency equipment | Fire extinguishers, alarms, first aid kits, emergency lights, evacuation signs |
| ICT and learning equipment | Computers, servers, projectors, laboratory equipment |

**Rating anchors (draft vulnerability criteria for SOP 5b)**

| Rating | Physical condition | Exposure | Criticality | Adaptive capacity gap | Maintenance status |
| --- | --- | --- | --- | --- | --- |
| 5 | Unusable or unsafe; needs replacement | Directly in the path of a verified hazard in its zone | Loss stops classes or endangers lives | No safeguard or backup in place | Never inspected, or service overdue more than 1 year |
| 4 | Major damage; works only partly | Exposed to two or more hazards in its zone | Loss disrupts classes for several days | Safeguard exists but does not work | Service overdue up to 1 year |
| 3 | Visible wear or damage; still works | Exposed to one hazard in its zone | Loss disrupts classes for a day | Partial safeguard or backup | Inspected, with issues not yet fixed |
| 2 | Minor wear; works normally | Exposure possible but unlikely | Loss causes minor inconvenience | Safeguard works, no backup | Inspected on schedule with minor issues |
| 1 | Good or new condition | No known exposure | Loss has little effect | Working safeguard and backup | Inspected on schedule, no issues |

Exposure, criticality, and maintenance anchors are first drafts written for this SRS; experts should review them in the SOP 5b CVI round.

**Vulnerability Index**

```latex
VI = \frac{C_1 + C_2 + C_3 + C_4 + C_5}{5}
```

C1 to C5 are the five criterion ratings, with equal weights. VI ranges from 1.00 to 5.00.

**Interpretation scales**

| VI | 5-level descriptive equivalent (interval 0.80) | DepEd band (3 : 4 : 3, as in DM 64 Annex A) |
| --- | --- | --- |
| 4.21–5.00 | Very high vulnerability | High (3.81–5.00) |
| 3.41–4.20 | High vulnerability | High from 3.81; Medium below |
| 2.61–3.40 | Moderate vulnerability | Medium (2.21–3.80) |
| 1.81–2.60 | Low vulnerability | Medium from 2.21; Low below |
| 1.00–1.80 | Very low vulnerability | Low (1.00–2.20) |

DepEd bands keep the 10-point tool's proportions (3 points High, 4 Medium, 3 Low) over the 1–5 range: widths 1.20, 1.60, 1.20 (student decision; adviser review pending).

**Record fields.** Asset ID, category, name, zone, quantity, date acquired, last inspection date, next service or expiry date, five criterion ratings, safeguards in place, photos, responsible person.

**Requirements**

- **FR-AV-01.** The DRRM Coordinator shall add, edit, and retire asset records.
- **FR-AV-02.** Assets shall be importable from a spreadsheet, reusing the school's property inventory.
- **FR-AV-03.** The DRRM Coordinator shall rate each asset on the five criteria using the anchors, and the system shall compute VI.
- **FR-AV-04.** Every rating shall be kept with its date and rater.
- **FR-AV-05.** When a verified hazard or an incident is linked to an asset, the system shall prompt a re-rating.
- **FR-AV-06.** The system shall alert the DRRM Coordinator 14 days before an inspection, service, or expiry date.
- **FR-AV-07.** Assets shall be shown on the school map, colored by DepEd band.
- **FR-AV-08.** Vulnerability data shall be visible only to the DRRM Coordinator and School Head.
- **FR-AV-09.** Each VI shall be shown with its 5-level descriptive equivalent and its DepEd band.

## 3.3 Risk Scoring

Each verified hazard gets a risk score R = L × I, from 1.00 to 25.00, matching RA 10121's definition of risk as probability combined with consequences (draft risk scoring model for SOP 5c).

```latex
R = L \times I
```

- **L** = likelihood, 1 to 5, rated by the verifier.
- **I** = impact:
  - Natural, and facility and structural hazards: the mean VI of the rated assets in the hazard's zone.
  - Health and sanitation, and security and personal safety hazards: a severity rating S, 1 to 5, given by the verifier.
  - Fallback: if the zone has no rated assets, the verifier rates S and the score is labeled "fallback."

```latex
\overline{VI}_{zone} = \frac{\sum VI_{assets\ in\ zone}}{n}
```

**Anchors**

| Rating | Likelihood (L) | Severity (S), person-centered hazards |
| --- | --- | --- |
| 5 | Almost certain: happening now or expected within the school year | Death, serious injury, or threat to many learners or personnel |
| 4 | Likely: has happened before and conditions remain | Injury or harm needing medical or professional help |
| 3 | Possible under current conditions | Minor injury or harm; disrupts classes |
| 2 | Unlikely: only under unusual conditions | Discomfort or minor disruption |
| 1 | Rare | Negligible effect |

For natural hazards, verifiers base L on official sources such as LGU hazard maps or LIGTAS+ (consulted, not linked; CON-01).

**Risk bands** (3 : 4 : 3 proportions over a width of 24.00)

| R | DepEd band |
| --- | --- |
| 17.81–25.00 | High |
| 8.21–17.80 | Medium |
| 1.00–8.20 | Low |

**Worked example.** A cracked wall is reported on the second floor of Building B; L = 4. The zone holds a classroom (VI 3.60), an electrical panel (VI 2.40), and a fire extinguisher (VI 1.80). Zone VI = (3.60 + 2.40 + 1.80) ÷ 3 = 2.60, so R = 4 × 2.60 = 10.40, Medium. If the classroom is re-rated to 4.80, zone VI becomes 3.00 and R becomes 12.00.

**School risk profile.** Counts of active verified hazards per band, highest R, mean R, and R by category and by zone. High-band assets are flagged separately, because a zone mean can hide one badly damaged asset.

**Requirements**

- **FR-RS-01.** The system shall compute R = L × I for each verified hazard.
- **FR-RS-02.** For natural and facility hazards, I shall be the mean VI of rated assets in the zone.
- **FR-RS-03.** For health, sanitation, security, and personal safety hazards, I shall be the verifier's severity rating S.
- **FR-RS-04.** If a zone has no rated assets, the verifier shall rate S and the score shall be labeled "fallback."
- **FR-RS-05.** R shall be recomputed whenever L, S, or any VI in the zone changes, with history kept.
- **FR-RS-06.** Each R shall be classified as Low, Medium, or High.
- **FR-RS-07.** Resolved hazards shall leave active scores but stay in the records.
- **FR-RS-08.** The system shall generate the school risk profile above.
- **FR-RS-09.** Anchors and band ranges shall be configurable by the System Administrator after School Head approval, with every change logged (FR-UR-07).

If pilot data place nearly all hazards in Medium, the bands may be revised; any change is reported in Chapter 4.

## 3.4 Community Sentiment and Feeling Analysis

Survey ratings (SPI) are the main measure because they work in any language; comment labels are supporting evidence, analyzed automatically for English, Filipino, and Taglish and reviewed manually for Kapampangan, Ilocano, and Sambal.

**Data sources.** Safety perception surveys (1–5 items, Strongly Disagree to Strongly Agree, plus one comment box), scheduled by the DRRM Coordinator with School Head approval; and the free-text description of each hazard report.

**Safety Perception Index**, after reverse-scoring negatively worded items (5→1, 4→2, 3→3, 2→4, 1→5):

```latex
SPI = \frac{\sum x}{n}
```

| SPI | Descriptive equivalent |
| --- | --- |
| 4.21–5.00 | Very safe |
| 3.41–4.20 | Safe |
| 2.61–3.40 | Moderately safe |
| 1.81–2.60 | Unsafe |
| 1.00–1.80 | Very unsafe |

**Comment labels.** Sentiment: Positive, Neutral, Negative. Feeling: Fear or anxiety, Anger or frustration, Sadness, Trust or safety, Neutral \[final set for expert review\].

**Built-in method (English, Filipino, Taglish).** A bilingual lexicon gives each matched word a polarity weight and, where relevant, a feeling tag. Negators ("not," "hindi," "di") flip the next word's polarity.

```latex
Score = \sum w_i
```

Score above 0 is Positive, below 0 Negative, 0 Neutral. The feeling label is the category with the most matched words; a tie goes to manual review.

**Net Sentiment Score**

```latex
NSS = \frac{P - N}{P + Neu + N}
```

P, Neu, and N are counts of positive, neutral, and negative comments; NSS runs from −1 to +1.

**Accuracy check (for SOP 4 or SOP 6).** Two human coders label a sample independently; their agreement is checked with Cohen's kappa, then system labels are compared with the agreed labels, by language group. Kappa interpretation follows Landis and Koch (1977) \[VERIFY\].

```latex
\kappa = \frac{p_o - p_e}{1 - p_e}
```

```latex
Precision = \frac{TP}{TP + FP} \qquad Recall = \frac{TP}{TP + FN} \qquad F_1 = \frac{2 \cdot Precision \cdot Recall}{Precision + Recall}
```

**Privacy and protection.** Responses are stored apart from identities and analyzed de-identified. Respondents are informed of the purposes and processing before they answer (RA 10173, Sec. 16(b)). Sensitive personal information relies on purpose-specific consent (Sec. 13(a)) or, for urgent safety referrals, on protecting life and health (Sec. 13(c)). Results for groups under 5 respondents are hidden. Comments indicating danger to a person go to the designated Child Protection and Discipline Officer, and the survey tells respondents this beforehand.

**Requirements**

- **FR-SA-01.** The DRRM Coordinator shall schedule surveys at any time, with School Head approval.
- **FR-SA-02.** The system shall compute SPI by item, group, and period, reverse-scoring negative items.
- **FR-SA-03.** The system shall label English, Filipino, and Taglish comments with the built-in bilingual lexicon, handling negation.
- **FR-SA-04.** The system shall record each comment's detected language.
- **FR-SA-05.** The DRRM Coordinator shall confirm or correct any label; original and corrected labels are both kept.
- **FR-SA-06.** The system shall compute NSS by group and period.
- **FR-SA-07.** Dashboards shall show SPI and NSS trends and update as responses arrive.
- **FR-SA-08.** Survey responses shall be stored separately from respondent identities.
- **FR-SA-09.** Results for groups with fewer than 5 responses shall be hidden.
- **FR-SA-10.** Comments indicating danger to a person shall be routed to the designated Child Protection and Discipline Officer.
- **FR-SA-11.** Each survey shall show a notice on how responses are used and when a comment may be reviewed for safety.
- **FR-SA-12.** Regional-language comments, and comments with fewer than 2 matched words, shall go to a manual review queue.
- **FR-SA-13.** Queued comments shall be reviewed for danger within 48 hours, with overdue alerts to the coordinator and School Head.

Plan at least two survey rounds during the pilot so Chapter 4 can show change, and report the share of comments sent to manual review.

## 3.5 Dashboards and Reports

The system produces the reports DepEd already requires, filled from logged data, because DM 64, s. 2026 warns against parallel plans or reports when existing mechanisms serve the purpose.

**Dashboards by role**

| Role | Contents |
| --- | --- |
| School Head | Risk profile (counts by band, highest R, mean R); school map shaded by risk; hazard trends; open and overdue mitigation actions; High-band assets; SPI and NSS trends; security incident counts only |
| DRRM Coordinator | Verification queue; inspection and expiry alerts; manual review queue; the School Head's risk and asset views |
| Child Protection and Discipline Officer | Security and personal safety cases; referral and report deadlines |
| School Personnel | Own tasks; school risk summary |
| Community User | Own submissions and status |

**Reports: the full catalogue, with each report's legal basis, trigger, deadline, and recipient, is in Section 3.7.**

**Conversion to DepEd's 1–10 scale** (10 = lowest risk), rounded to a whole number (student decision; adviser review pending):

```latex
D = 10 - \frac{9\,(VI - 1)}{4}
```

**Requirements**

- **FR-DR-01.** Each role shall have the dashboard listed above.
- **FR-DR-02.** The system shall generate IMRS damage and impact data fields, including the classroom, personnel, and learning-resource fields previously reported through RADaR, from incident and damage records.
- **FR-DR-03.** The system shall generate the El Niño Risk Assessment Tool layout using the conversion above.
- **FR-DR-04.** The system shall export the security incident register with the fields required by DO 6, s. 2026.
- **FR-DR-05.** The system shall generate a school risk profile report for school improvement planning.
- **FR-DR-06.** All reports shall export as PDF and Excel.
- **FR-DR-07.** Dashboards shall update when new verified data is saved.

## 3.6 Incident and Damage Reporting

Incidents are events that already happened; the system records two types because DO 21, s. 2015 and DO 6, s. 2026 treat them differently, and it prepares data and tracks deadlines without replacing DepEd's official channels.

**A. Disaster and facility incidents (DO 21, s. 2015; IMRS replaces RADaR, 2026 \[VERIFY\]).** Incident ID; name of incident; date and time; linked hazard reports; zones affected; classrooms totally damaged, with major damage, with minor damage; temporary learning spaces needed; personnel deceased, injured, missing, displaced (counts only); classrooms used for evacuation; evacuees remaining after three days; damaged armchairs, learning materials, computer sets; actions taken.

**B. Learner protection incidents (DO 6, s. 2026).** Incident number; nature; learners involved; setting (date, time, location); actions taken; preventive measures; case status; dates of referral, fact-finding report, and report to the SDS and RD.

**Deadlines tracked** (from scanned copies; check against the PDFs \[VERIFY\])

| Incident type | Deadline | Basis |
| --- | --- | --- |
| Disaster or facility | IMRS encoding within 8 hours of occurrence \[VERIFY against the DRRMS advisory\] | DO 21, s. 2015 |
| Learner protection | Referral to the Disciplining Authority within 48 hours | DO 6, s. 2026 |
| Learner protection | Fact-finding report within 10 calendar days | DO 6, s. 2026 |
| Learner protection | Report to the SDS and RD within 30 calendar days | DO 6, s. 2026 |

**Requirements**

- **FR-IN-01.** The School Head and DRRM Coordinator shall record disaster and facility incidents with the fields in A.
- **FR-IN-02.** The School Head and designated Child Protection and Discipline Officers shall record learner protection incidents with the fields in B.
- **FR-IN-03.** An incident shall be linkable to one or more hazard reports.
- **FR-IN-04.** When an incident lists a damaged asset, the system shall prompt the DRRM Coordinator to re-rate it.
- **FR-IN-05.** Personnel casualties shall be recorded as counts only.
- **FR-IN-06.** Learner details in learner protection incidents shall be visible only to the School Head and designated officers.
- **FR-IN-07.** The system shall alert the responsible user before each deadline in the table.
- **FR-IN-08.** The system shall support, not replace, IMRS submission through DepEd's prescribed channel and the investigation process under DO 6.

## 3.7 Report Generation

The system generates the reports that the uploaded issuances already require, from data the school has logged and verified. Each report has one legal basis, one trigger, one deadline, and one recipient. The system prepares each report; the school head reviews it and submits it through the channel the issuance names. No report is sent without School Head approval (FR-RP-05), in line with DM 64, s. 2026, which warns against parallel reporting.

**Report catalogue**

| Report | Legal basis | Trigger | Main data | Deadline | Recipient |
| --- | --- | --- | --- | --- | --- |
| Damage and impact report (IMRS; replaces RADaR) | DO 21, s. 2015, Sec. B and Annexes A and B; IMRS memoranda, 2026 \[VERIFY Region III\] | Any hazard affecting the school | Classrooms damaged, temporary learning spaces, personnel affected, learners affected, evacuation use, furniture, learning materials, computers | Encoded in IMRS within 8 hours of occurrence (DRRMS Advisory, 8 January 2026, as cited in a regional school memorandum) \[VERIFY\] | DepEd platform via the school head |
| Certification of no damage | DO 21, s. 2015, Sec. B | Hazard with no damage and no evacuation use | Confirmation that no classroom, furniture, material, or computer was damaged, no personnel casualty, and no evacuation use | Same window as the damage report | Schools Division Office (division-level) |
| Class suspension and resumption record | DO 37, s. 2022; DO 22, s. 2024 \[VERIFY current\] | Suspension or resumption of classes or work | Date and time, trigger (signal, warning, or earthquake intensity), decision maker, return-to-building clearance | Recorded at the time of decision | DRRMS through the division situation report |
| Initial risk assessment | DO 6, s. 2026, Annex H | Each verified hazard | Identify, risk, probability, impact, action | Per hazard, when verified | School file; supports Section 3.3 scores |
| El Niño risk assessment | DM 64, s. 2026, Sec. 4.1 and Annex A | Seasonal advisory | Exposure, vulnerability, and adaptive capacity ratings, converted to the 1–10 scale (Section 3.5) | Within 5 calendar days of the assessment start | Division DRRM office |
| Classroom heat index log | DM 64, s. 2026, Annex B | Daily during the advisory | Readings at 0800, 1200, and 1400 | Daily | DRRMS |
| School watching and hazard map | DO 23, s. 2015, Secs. IV to VI and Annex 1 | Start of each school year (first month) | Checklist items marked, hazard map by building and room | Annual, first month | School Planning Team; posted in buildings; division ocular visits |
| Incident intake sheet (learner protection) | DO 6, s. 2026 | Bullying, abuse, violence, or harassment report | Incident number, nature, learners involved (protected), setting, actions taken, case status | Referral within 48 hours; fact-finding within 10 calendar days | Disciplining Authority |
| Learner protection status report | DO 6, s. 2026 | Each case | Dates of referral, fact-finding, and report | Report to SDS and RD within 30 calendar days | SDS and Regional Director |
| Annual bullying report | DO 6, s. 2026 | Annual | Aggregated counts by type and setting (no learner identities) | Annual | SDO |
| School risk profile | RA 9155, Ch. 1, Sec. E (school head as manager of resources) | Monthly or on request | Counts by band, highest R, mean R, assets in the High band | Monthly \[CONFIRM\] | School Head; School Improvement Plan |

**Requirements**

- **FR-RP-01.** The system shall maintain a report catalogue, listing each report with its legal basis, trigger, deadline, and recipient.
- **FR-RP-02.** Each report template shall match the current official form (Annexes and fields). Templates shall be versioned and shall be updated when a new memorandum changes a form.
- **FR-RP-03.** Reports shall be generated only from verified records. Unverified reports shall be marked as draft.
- **FR-RP-04.** The system shall show a deadline countdown for each report, with alerts at 24 hours and at the deadline.
- **FR-RP-05.** The School Head shall approve each report before it is marked as submitted. The system shall record who approved it and when.
- **FR-RP-06.** The system shall export each report as PDF and Excel, and shall store a copy with its generation date and data version.
- **FR-RP-07.** The system shall not include learner identities in reports sent to the division or DepEd unless the recipient is authorized under DO 6, s. 2026. Aggregated reports shall use counts only.
- **FR-RP-08.** The class suspension record shall capture the trigger and decision maker, so that the school's decision can be traced to the threshold it met.
- **FR-RP-09.** The system shall warn the DRRM Coordinator when a threshold from DO 37, s. 2022 is reached (for example, a PAGASA signal or warning), as a decision-support alert only. The School Head and local officials make the decision.
- **FR-RP-10.** The school watching checklist (DO 23, s. 2015, Annex 1) shall be available as a digital form, and its items shall map to the hazard categories in Section 3.1.

**Points to verify before the report design is final**

- The IMRS form fields and the reporting window (8 hours, per the DRRMS advisory of 8 January 2026) must come from the Region III IMRS memorandum, not the RADaR Annexes. The RADaR Annex fields are a starting point only.
- DO 37, s. 2022 may have been superseded by DO 22, s. 2024. Check DM 64's citation before using its thresholds as current.
- DO 23, s. 2015's checklist should be checked against the full PDF, since the scanned copy's Annex 1 items were read through the text layer.

**Traceability.** Section 3.7 maps to SOP 4d (dashboards and reports), SOP 3 (school heads' current reporting practice), and the policy bases listed in each row.

## 4 Quality Requirements (ISO/IEC 25010:2023)

IT experts (SOP 6) rate all nine characteristics; school users (SOP 7) rate six: functional suitability, interaction capability, reliability, security, maintainability, and flexibility. The 2023 edition replaced usability and portability with interaction capability and flexibility and added safety ([ISO preview](https://webstore.ansi.org/preview-pages/ISO/preview_ISO+IEC+25010-2023.pdf)).

| ID | Characteristic | Requirement | Evaluated in |
| --- | --- | --- | --- |
| NFR-FS-01 | Functional suitability | Every functional requirement passes its test cases | SOP 4, 6, 7 |
| NFR-FS-02 | Functional suitability | VI, R, SPI, and NSS match manual computation in 100% of test cases | SOP 4, 6, 7 |
| NFR-PE-01 | Performance efficiency | Pages load within 3 seconds on a typical mobile data connection | SOP 6 |
| NFR-PE-02 | Performance efficiency | Dashboards load within 5 seconds with one school year of records | SOP 6 |
| NFR-CO-01 | Compatibility | Works on current Chrome, Edge, Firefox, and Safari, on computers and Android and iOS phones | SOP 6 |
| NFR-CO-02 | Compatibility | Exports reports as PDF and Excel (no direct data link, CON-01) | SOP 6 |
| NFR-IC-01 | Interaction capability | A first-time user submits a hazard report within 3 minutes without training | SOP 6, 7 |
| NFR-IC-02 | Interaction capability | Screens are readable on small phones; forms show clear error messages | SOP 6, 7 |
| NFR-IC-03 | Interaction capability | Interface language: English only. | SOP 6, 7 |
| NFR-RE-01 | Reliability | Available at least 99% of school hours | SOP 6, 7 |
| NFR-RE-02 | Reliability | Unsent reports are saved on the device and sent when the connection returns | SOP 6, 7 |
| NFR-RE-03 | Reliability | Daily backups; restore within 24 hours | SOP 6 |
| NFR-SE-01 | Security | HTTPS for all connections; passwords stored hashed | SOP 6, 7 |
| NFR-SE-02 | Security | Role permissions enforced on the server, not only in the interface | SOP 6, 7 |
| NFR-SE-03 | Security | Lockout after 5 failed logins; sessions end after 15 idle minutes | SOP 6, 7 |
| NFR-SE-04 | Security | Personal data handled per RA 10173: purpose-specific consent for sensitive data (Sec. 13), notice (Sec. 16), and secure disposal of records (Sec. 27) | SOP 6, 7 |
| NFR-MA-01 | Maintainability | Code organized into modules matching Sections 3.1 to 3.6, with automated tests for every formula | SOP 6, 7 |
| NFR-MA-02 | Maintainability | Reported system problems can be diagnosed and fixed without disrupting school use | SOP 6, 7 |
| NFR-FL-01 | Flexibility | Hazard types, criteria, anchors, and bands change through settings, without code changes | SOP 6, 7 |
| NFR-FL-02 | Flexibility | Supports at least \[number\] users per school without slowing down | SOP 6 |
| NFR-SF-01 | Safety | High-band hazards alert the School Head and DRRM Coordinator within 5 minutes of verification | SOP 6 |
| NFR-SF-02 | Safety | A score that can't be computed shows "Not computed," never a default Low | SOP 6 |

**SOP 7 items for maintainability and flexibility must describe what users can observe**, since school users can't see the code. Draft examples for the questionnaire:

- Maintainability: "Problems I report about the system are fixed promptly." "System updates do not interrupt my work."
- Flexibility: "The school can add new hazard types or change settings without technical help." "The system works on the devices I use."

Chapter 3 should state this limitation and why school users still rate these two characteristics.

## 5 Traceability

Every module traces to an SOP and a policy basis, so each requirement can be followed from the problem to the instrument and the Chapter 4 result.

| SRS section | Requirement IDs | SOP | Policy basis |
| --- | --- | --- | --- |
| 2 User roles | FR-UR-01 to 10 | SOP 3, 4e | RA 9155 (school head authority); DO 21, s. 2015 (DRRM coordinator); DO 6, s. 2026 (restricted access) |
| 3.1 Hazard logging | FR-HL-01 to 12 | SOP 3, 4a, 5a | RA 10121, Sec. 3; DO 6, s. 2026 (anonymous reporting); DO 23, s. 2015 (school watching) |
| 3.2 Asset vulnerability | FR-AV-01 to 09 | SOP 3, 4b, 5b | RA 10121, Sec. 3(nn); RA 9155 (physical resources); DM 64, s. 2026, Sec. 4.1 |
| 3.3 Risk scoring | FR-RS-01 to 09 | SOP 3, 4c, 5c | RA 10121, Sec. 3(hh); DO 6, s. 2026, Annex H (probability and impact) |
| 3.4 Sentiment analysis | FR-SA-01 to 13 | SOP 3, 4f (and 6 for accuracy) | DO 6, s. 2026 (feedback channels); PPSSH Indicator 1.6.2 (learner voice), DO 24, s. 2020 |
| 3.5 Dashboards and reports | FR-DR-01 to 07 | SOP 3, 4d | DO 21, s. 2015; IMRS memoranda, 2026, which replace RADaR \[VERIFY\]; DM 64, s. 2026 (no parallel reports, Annex A); DO 6, s. 2026 |
| 3.6 Incidents | FR-IN-01 to 08 | SOP 3, 4a | DO 21, s. 2015; DO 6, s. 2026; IMRS \[VERIFY\] |
| 3.7 Report generation | FR-RP-01 to 10 | SOP 2c, 3, 4d | DO 21, s. 2015; IMRS \[VERIFY\]; DO 6, s. 2026; DM 64, s. 2026; DO 23, s. 2015; DO 37, s. 2022 \[VERIFY currency\]; RA 9155; RA 10173 |
| 4 Quality | NFR-FS to NFR-SF | SOP 6, 7 | ISO/IEC 25010:2023; RA 10173, Secs. 13, 16, 27 |
| 7 User experience | FR-UX-01 to 11 | SOP 6, 7 (interaction capability) | ISO/IEC 25010:2023 |
| Whole system | All | SOP 8, 9 | PPSSH Domain 1 (Leading Strategically), DO 24, s. 2020 |

## 6 Open Items

These must be settled before the SRS moves from baseline to final.

**Documents to upload or verify**

- [ ] Confirm FR-UR-04, FR-SA-08, and NFR-SE-04 against the uploaded RA 10173 text (Secs. 3(b), 13, 16, 27)
- [ ] PPSSH strand 1.6 (learner voice) and Indicator 1.6.2 confirmed from DO 24, s. 2020 per the source digest; "NASH Domain 1" replaced with PPSSH Domain 1
- [ ] Cite the Comprehensive School Safety Framework 2022–2030 as DM 64, s. 2026 refers to it; the DO 008, s. 2023 citation is removed because no such issuance could be verified
- [ ] Cite DM 64, s. 2026 for the LIGTAS+ mention; keep news reports only for its features and flag them as press-sourced
- [ ] Check RA 10121 definitions and the DO 6 and DO 21 deadlines against the scanned PDFs before quoting; obtain the IMRS field list and the Region III memorandum; confirm that the 8-hour encoding deadline replaces the 72-hour RADaR window; field-level compliance of Section 3.7 is not yet verified
- [ ] Confirm the DO 6 page numbers for anonymous reporting
- [ ] Verify Landis and Koch (1977), Lynn (1986), and Polit and Beck (2006)

**Decisions made by the student (not yet reviewed by the adviser)**

- [ ] DepEd band conversion (3 : 4 : 3) kept; 1–10 conversion formula kept (linear, rounded)
- [ ] Safety perception survey items join the CVI round
- [ ] Comment-label accuracy reported under SOP 6
- [ ] School users rate maintainability and flexibility in SOP 7, using observable wording
- [ ] Queued-comment review deadline set at 48 hours
- [ ] Interface language set to English only (NFR-IC-03); NFR-FL-02 user capacity still to set

**Placeholder values to set**

- [ ] Photo limits, alert lead time, group size, and matched-word threshold set (FR-HL-05, FR-AV-06, FR-SA-09, FR-SA-12)
- [ ] Performance, availability, backup, lockout, and alert targets set in Section 4

## 7 User Experience Requirements

The system is designed for busy school staff, often on phones and sometimes during emergencies. These requirements turn the user-friendliness principles into testable statements; they are measured with the interaction capability items in SOP 6 and SOP 7.

**Requirements**

- **FR-UX-01.** A hazard report shall require no more than four steps (zone, type, description, optional photos and submit), and a first-time user shall complete one within 3 minutes (NFR-IC-01).
- **FR-UX-02.** Labels shall use plain language. Official DepEd terms shall appear in smaller text beside the plain label.
- **FR-UX-03.** The School Head's first screen shall be the school map, with zones shaded by risk band (High, Medium, Low), and tables and numbers shall be one tap away.
- **FR-UX-04.** After each report, the reporter shall see its status in plain steps: Sent, Being checked, Confirmed, Fixed.
- **FR-UX-05.** When a verified hazard is in the High band, the screen shall show a single action to notify the School Head immediately.
- **FR-UX-06.** The anonymous option for security and personal safety reports shall be visible on the first step of that form, without extra menus.
- **FR-UX-07.** Each risk score shall appear with a short plain-language meaning (for example, "Medium risk: needs attention this month") and the numeric value shown on request.
- **FR-UX-08.** Each role shall see only the menu items it can use (FR-UR-02).
- **FR-UX-09.** Every form field shall state why it is needed when the user taps its help icon.
- **FR-UX-10.** The interface shall be designed for small phone screens first, with large touch targets, and shall have a full layout for computers (NFR-CO-01).
- **FR-UX-11.** Hazard reports started without a connection shall be saved on the device and sent when the connection returns (NFR-RE-02). Dashboards shall require a connection.

**Usability checks for Chapter 4.** A first-time user timing test (FR-UX-01), and the SOP 6 and SOP 7 interaction capability items, measure whether these requirements are met.
