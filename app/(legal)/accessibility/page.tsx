import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
export const metadata: Metadata = { title: "Accessibility" };
export default function AccessibilityPage() {
  return (
    <LegalDocument
      title="Perspective for everyone."
      intro="Accessibility is part of the workspace, not an optional setting."
    >
      <section>
        <h2>Designed to be usable</h2>
        <p>
          Stillmark uses semantic page regions, descriptive headings, labeled
          form fields, visible keyboard focus, a skip-to-content link and
          accessible dialog controls. Market movements include arrows and signed
          values so colour is not the only indicator. Native sample charts
          include a data-table alternative. Decorative artwork is hidden from
          assistive technology.
        </p>
        <p>
          The interface adapts to small screens and respects reduced-motion
          preferences. Forms allow password managers, pasting and standard
          browser autocomplete. Search supports arrow keys, Enter and Escape;
          the main search shortcut is Control+K or Command+K.
        </p>
      </section>
      <section>
        <h2>Scope and limitations</h2>
        <p>
          The design targets WCAG 2.2 level AA. This is a target, not a claim of
          certified conformance. Automated checks cannot replace keyboard,
          screen-reader and assistive-technology testing. External TradingView
          charts are controlled by their provider and may have accessibility
          limitations. A native quote summary remains available without loading
          them.
        </p>
      </section>
      <section>
        <h2>Tell us what gets in the way</h2>
        <p>
          If something is difficult to use, share the affected page, what you
          were trying to do, and the browser or assistive technology involved.
          Do not include passwords or financial account details. Operator
          contact details will be published before launch.
        </p>
      </section>
    </LegalDocument>
  );
}
