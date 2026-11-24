/**
 * The report as labeled sections. The model returns these fields; the page,
 * the PDF and the email all fill the same template from them.
 */
export type Trait = {
  partId: string;
  axis: string;
  name: string;
  score: number; // 1 to 5
  line: string;
};

export type Report = {
  title: string;
  firstName: string;
  dateISO: string;
  keyStatement: string;
  profile: { name: string; summary: string; traits: Trait[] };
  sections: { heading: string; paragraphs: string[]; quote: string | null }[];
  nextSteps: { title: string; detail: string }[];
  resources: { title: string; kind: string }[];
  note: string;
};
