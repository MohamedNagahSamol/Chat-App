Act as a Senior QA Automation and Full-Stack Quality Engineer. Your task is to inspect the codebase, launch the application in the browser, perform thorough end-to-end testing, and provide a structured QA report with actionable observations.

Execute the following workflow step-by-step:

1. Codebase & Architecture Analysis:
- Review the source code to map out the application's core features, user journeys, routing, and state management.
- Identify critical user paths, form inputs, edge cases, and API integration points that require validation.

2. Environment & Browser Execution:
- Verify that the local development server is active (Target URL: [INSERT_URL_HERE, e.g., http://localhost:3000]).
- Launch the browser using your browser automation / DevTools tool.
- Enable monitoring for browser console logs, uncaught runtime errors, and network traffic (failed HTTP requests).

3. Functional & UI/UX Testing:
- Navigate through all primary user flows (Happy Path) from start to finish.
- Stress-test input fields with invalid data, edge cases, rapid clicks, and empty submissions.
- Check responsive behavior across desktop (1440px), tablet (768px), and mobile (375px) viewports.
- Take screenshots of any visual anomalies, layout shifts, or broken components.

4. Comprehensive QA Report:
Deliver your evaluation using this structure:
- Summary: Overall stability status (Pass / Needs Fixes / Critical Failure).
- Console & Network Issues: Exact console errors, warnings, failed API requests (4xx/5xx), or hydration mismatches.
- Functional Bugs: For each bug, provide steps to reproduce, expected vs. actual behavior, and root-cause file references.
- UI/UX & Responsive Observations: Visual defects, misalignment, or broken responsiveness.
- Recommended Fixes: Precise code snippets addressing the root causes identified in the codebase.