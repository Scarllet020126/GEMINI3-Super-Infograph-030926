HI please create a agentic ai system that user paste or upload a article (text, markdown). Then system will select 30 topics from the article and using infograph creation skill to create a wow interactive webpage that containing 30 infograph created by the agent. Then user can download (markdown, pdf, html) or modify the results. Please create a WOW ui that user can select light/dark themes, english/traditioanl chinese and 20 styles based on famous painters. Ending with 20 comprehensive follow up questions. Skill for infograph creation:---
name: infographic-code-factory-30
description: >
Use this skill whenever the user provides (or references) an article and wants you to (1) extract/select ~30 topics/entities/concepts from it and (2) generate a complete, ready-to-render set of 30 infographic specs AND a code-based infographic webpage plan/bundle (HTML/CSS/JS and optional Python build steps). This includes: topic ranking, mapping each topic to an infographic template (timeline/flowchart/comparison/etc.), producing structured data for each infographic, and producing a build manifest and file tree so the system can render all 30 infographics on one webpage. Trigger this skill even if the user only says “make infographics,” “turn my article into visuals,” “create a infographic webpage,” “30 visuals,” “圖像化,” “圖解,” “generate charts by code,” or asks for a War-on-Truth/圖解真相戰 style presentation. This skill is especially relevant for regulatory/compliance articles (e.g., medical device regulations) and bilingual (English/Traditional Chinese) deliverables.
compatibility:
required:
- LLM access (OpenAI/Gemini/Anthropic/Grok)
- File read/write capability OR ability to output a complete artifact manifest in-text
optional:
- Streamlit (for preview integration)
- A JS charting library (e.g., D3/Plotly/ECharts) chosen by the host app
- Python chart/render pipeline (optional) chosen by the host app
Infographic Code Factory (30) — SKILL.md
0) What this skill does (high-level)
Given a user-provided article (typically long-form), produce a complete infographic production package consisting of:
A ranked list of 30 topics/entities derived from the article, each with bilingual titles and concise summaries.
For each topic, an infographic specification: the intended visual template, required data fields, annotations/captions, takeaways, and source anchors back to the article.
A code-based rendering plan to generate a single webpage containing all 30 infographics using code artifacts (HTML/CSS/JS and optionally Python for preprocessing/build).
A build manifest and file tree so the host agentic system can implement rendering deterministically.
Important constraint: This skill describes what code to generate and how to structure it, but it should not output full executable code unless the calling system explicitly requests code output. Prefer producing structured “code stubs plan” and file manifests over raw code.
1) When to use (trigger guidance)
Use this skill when the user asks for any combination of:
Extracting “key concepts,” “topics,” “entities,” “themes,” “30 ideas,” “核心概念” from an article
Producing infographics, 圖解, 圖像化, diagram-first presentation
Generating a webpage that displays multiple visuals (especially “30 infographics on one page”)
“Generate by code” requirements (HTML/JS/CSS/Python pipeline)
Bilingual outputs (English + Traditional Chinese)
Compliance/regulatory communication that benefits from timelines/flows/comparisons/checklists
2) Inputs (what you should request/expect from the calling agent)
The calling agent/system should provide:
Article content (plain text or markdown), and if available:
Section headings
Tables/bullets preserved
Any citations/URLs the user included
Optional configuration:
Output language mode: EN / 繁中 / dual
Visual style token pack (e.g., “painter style” theme)
Preferred charting stack (if predetermined by the host app)
Strictness mode:
Strict: only claims explicitly supported by article text
Suggestive: may propose “missing but relevant” topics labeled clearly as “not in article”
3) Outputs (deliverables you must produce)
Produce the following artifacts as structured markdown + JSON-like blocks (no executable code by default):
3.1 TopicList30 (required)
A list of exactly 30 topic objects:
topic_id (01–30)
title_en, title_zh
summary_en, summary_zh (1–2 sentences)
why_it_matters (3 bullets, bilingual if dual mode)
source_anchors (references to article excerpts; at minimum: section name + short quote or chunk index)
suggested_infographic_type (one primary template)
tags (region, theme, lifecycle stage)
confidence (High/Med/Low)
3.2 InfographicSpec (required, one per topic)
For each topic_id, produce an infographic specification with:
Narrative goal: what the reader should understand in <15 seconds
Template: timeline/flowchart/comparison matrix/decision tree/checklist/swimlane/etc.
Data schema: the fields required to render the chart (labels, nodes/edges, series, categories)
Copy deck: title, subtitle, callouts, footnotes, key takeaways
Accessibility: alt text, non-color encoding notes
Evidence: which anchors support which claims (“anchor mapping”)
3.3 WebpageBundlePlan (required)
A code bundle plan that describes:
File tree (e.g., index.html, styles.css, app.js, data/infographics.json, assets/, manifest.json)
Runtime behavior:
Language toggle (EN/繁中/dual)
Theme tokens application (light/dark + painter style)
Filtering/search across 30 topics
Per-infographic expand/collapse details
Rendering contract:
How each InfographicSpec becomes a rendered visual
How failures are handled (fallback to “text-only card”)
3.4 QAReport (required)
A checklist-style QA report:
Coverage: 30/30 complete
Bilingual parity checks (numbers/dates consistent)
Anchor coverage % (how many takeaways have anchors)
Consistency issues (terminology, region naming, repeated concepts)
4) Workflow (step-by-step method you must follow)
Step A — Parse and structure the article
Identify major sections and sub-sections.
Extract candidate entities/concepts:
Regulatory frameworks (FDA QMSR, EU MDR/IVDR, IMDRF, etc.)
Lifecycle phases (design, clinical, post-market, vigilance)
Emerging areas (AI/ML, cybersecurity, RWE, UDI)
Preserve “hard facts” from the article:
Dates, transition periods, enforcement timelines
Named regulations/guidances/standards
Region-specific requirements
Output of Step A (internal): a candidate concept pool (50–120 candidates) with frequency/importance notes.
Step B — Select and rank 30 topics
Select exactly 30 topics using these ranking heuristics:
Impact: compliance or market access consequences
Novelty: what changed in 2025/2026
Cross-region value: comparisons readers care about
Visualizability: can be shown as a diagram/data visualization
Non-overlap: avoid near-duplicates; merge where necessary
Then produce TopicList30.
Step C — Map each topic to an infographic template
Assign one primary template per topic:
Timeline: “what happens when”
Flowchart/decision tree: “how to decide / route”
Comparison matrix: “differences by region”
Checklist: “what to do next”
Swimlane: “who does what”
Layered model: “hierarchy or maturity levels”
Myth vs fact (use sparingly; ensure neutral and evidence-backed)
Step D — Create InfographicSpec with renderable data schemas
For each topic:
Define the data structure needed (nodes/edges, table rows, series, etc.).
Write bilingual copy for:
Title/subtitle
Labels/callouts
Takeaways (3–6)
Provide anchor mapping:
Each takeaway references at least one anchor, or is labeled “needs verification”.
Step E — Produce WebpageBundlePlan (code-by-structure)
Define how the host system should generate code artifacts:
A single “infographics.json” (or equivalent) that contains:
metadata (language, style tokens, generation timestamp)
array of 30 infographic objects (spec + data + copy)
A renderer strategy:
“template renderers” keyed by infographic_type
fallback renderer for unsupported templates
Do not emit full code unless asked. Instead provide:
File tree
Responsibilities per file
Data contracts
Interactivity requirements
Step F — Quality gates (must pass before finalizing)
Run these checks and report them in QAReport:
Exactly 30 topics produced (IDs contiguous 01–30)
Every topic has:
at least one anchor
a template type
bilingual title/summary (if dual mode)
Numeric/date consistency across bilingual text
Terminology consistency (FDA/EU/UK naming)
No definitive legal advice language; include verification cues
5) Output format (MUST follow)
Return results in this exact order:
# TopicList30 (table + structured list)
# InfographicSpecs (01–30, consistent headings)
# WebpageBundlePlan (file tree + contracts)
# QAReport (checklist + issues)
If the calling system needs machine readability, also include a final section:
# MachineReadableArtifacts
topics_30.json (JSON-like)
infographics_30.json (JSON-like)
manifest.json (JSON-like)
6) Style and tone guidelines (圖解真相戰-inspired, but neutral)
Prioritize clarity, contrast, and “fast comprehension.”
Use short sentences and structured bullets.
Prefer “What changed / Why it matters / What to do” framing.
Avoid sensationalism; keep a factual, helpful tone.
If using “myth vs fact,” ensure:
“myth” is phrased as a common misunderstanding
“fact” is directly supported by anchors
no ridicule; maintain professional tone
7) Regulatory-domain safety rules
Never claim legal certainty beyond the provided article.
Flag any missing official citations as “needs verification.”
Preserve region-specific nuance (avoid conflating FDA vs EU MDR).
Treat dates carefully; if uncertain, mark as approximate.
8) Failure modes and how to handle them
Article too short / lacks 30 concepts: propose a reduced list (e.g., 12–20) AND a set of clearly labeled “Suggested additional topics (not in article).”
Conflicting statements in the article: surface a “Conflict note” infographic or add a callout that the source is inconsistent.
Too many overlapping topics: merge and elevate umbrella topics; keep 30 by increasing granularity in sub-areas that are well-supported.
9) Test prompts (for evaluation; do not execute here)
Use these prompts to test the skill in the host agentic system:
Test Prompt 1 — Long bilingual regulatory article
“Here is a 25,000-word article about 2025/2026 medical device regulation updates across FDA, EU MDR/IVDR, UK, and IMDRF. Extract 30 topics and generate a plan for a single webpage with 30 code-generated infographics. Output bilingual EN/繁中.”
Test Prompt 2 — Article with heavy timelines and dates
“This article focuses on transition timelines and enforcement dates. Select 30 infographic topics emphasizing timelines/roadmaps. Generate infographic specs and a webpage bundle plan.”
Test Prompt 3 — Messy notes + mixed languages
“I pasted a messy markdown document with some English and Traditional Chinese sections and repeated content. Still produce 30 non-overlapping topics and infographic specs; ensure terminology consistency.”
10) Evaluation plan (qualitative + lightweight quantitative)
When reviewing outputs, check:
Qualitative review checklist
Do the 30 topics feel representative and non-duplicative?
Are templates well-chosen (timeline vs flow vs matrix)?
Are takeaways readable and action-oriented?
Is bilingual output faithful and consistent?
Quantitative signals (easy-to-measure)
topic_count == 30
%topics_with_anchor >= 90%
%takeaways_with_anchor >= 80%
bilingual_numeric_consistency_errors == 0 (dates/numbers)
template_diversity: at least 4 template types used across 30 (unless user requested uniformity)
(Host system can implement these checks; this skill only defines them.)
11) Integration notes for agentic pipelines (agents.yaml)
This skill works best when called by agents in this order:
Ingestion/Chunking Agent
Topic Extraction Agent (uses this skill for TopicList30)
Topic Feedback/Revision Agent (optional)
Infographic Planner Agent (uses this skill for InfographicSpecs)
Webpage Composer Agent (uses this skill for WebpageBundlePlan)
QA Agent (uses this skill for QAReport)
End of SKILL.md

Super, please improve the previous design by show results for each step of agentic pipeline active (ingestions and chunking, topic extraction, planning and composing infograph, qa and finalizing). please also let user to modify prompt and select models (gemini-2.5-flash, gemini-3-flash-preview) for each agent. Please also add 3 additional ai features (create by you). Ending with 20 follow up questions.




