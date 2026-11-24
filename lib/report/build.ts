import { countStems, countWords, matchesStem } from "@/lib/assessment/guide";
import type { PrivatePayload } from "@/lib/assessment/types";
import { dayInZone } from "@/lib/format";
import type { Report, Trait } from "./types";

/**
 * Builds the report as labeled sections. In the real product the model
 * returns these same fields from the owner's prompt; here they are filled by
 * rules, so the sample needs no model. Either way the layout never sees free
 * text: it fills one designed template from named fields.
 */
type Pole = {
  name: string;
  profile: string;
  stems: string[];
  line: string;
  clause: string;
  paragraph: string;
  step: { title: string; detail: string };
};

type Axis = {
  partId: string;
  partPrefix: string;
  axis: string;
  heading: string;
  /** Used when the answers for this part point neither way, or both ways equally. */
  neutral: string;
  a: Pole;
  b: Pole;
};

export const AXES: Axis[] = [
  {
    partId: "begin",
    partPrefix: "begin-",
    axis: "Begin",
    heading: "How you begin",
    neutral:
      "Your answers in this part did not lean clearly toward understanding the whole first or toward finding your way by starting. Many people do both, depending on the work. A fuller answer, about one real piece of work, would give this section more to say.",
    a: {
      name: "Deliberate starter",
      profile: "The Deliberate Starter",
      stems: ["plan", "outline", "list", "read", "understand", "question", "notebook", "sketch", "wrote down", "write down", "prepare"],
      line: "Wants the whole picture before the first step.",
      clause: "you can see the whole before you begin",
      paragraph:
        "You begin by understanding. Before the first real step you want to know what the work is for, who it is for and what finished looks like. This costs you a little time at the start and saves a great deal in the middle, when others are discovering what you already asked.",
      step: {
        title: "Give the first twenty minutes to the plan",
        detail: "Before opening messages, write the three things the day is for. You already do this on your best days; make it the rule.",
      },
    },
    b: {
      name: "Quick starter",
      profile: "The Quick Starter",
      stems: ["just start", "dive", "jump", "try the", "rough draft", "straight in", "find my way", "tidy up", "restless"],
      line: "Finds the way by starting.",
      clause: "you are free to start before everything is settled",
      paragraph:
        "You begin by beginning. A rough first attempt tells you more than an hour of planning would, and you are comfortable being wrong on the way to being right. The risk is the rework a ten-minute pause could have saved; the gift is that you are rarely stuck.",
      step: {
        title: "Pause for ten minutes before you dive in",
        detail: "Write one line on what finished looks like, then start. It keeps your speed and saves a round of rework.",
      },
    },
  },
  {
    partId: "focus",
    partPrefix: "focus-",
    axis: "Focus",
    heading: "Where your attention goes",
    neutral:
      "Your answers in this part did not lean clearly toward long, protected stretches or toward several threads and company. It may depend on the task. A fuller answer, about one real afternoon, would give this section more to say.",
    a: {
      name: "Deep focus",
      profile: "The Deep Worker",
      stems: ["quiet", "door", "alone", "headphone", "drawer", "hours went", "uninterrupted"],
      line: "Does the best work in long, protected stretches.",
      clause: "one thing has your full attention",
      paragraph:
        "Your best work happens in long, protected stretches. You describe attention as something that needs a closed door, and when you have one, hours pass without your noticing. The work that matters most to you is unlikely to get done in the gaps between meetings.",
      step: {
        title: "Protect two long stretches a week",
        detail: "Put them in your calendar as you would a meeting, and tell the people who need you when you will be back.",
      },
    },
    b: {
      name: "Wide attention",
      profile: "The Wide-Angle Worker",
      stems: ["together", "whiteboard", "workshop", "switch", "several", "three things", "on the go", "each other", "variety"],
      line: "Keeps several threads in view, and likes company.",
      clause: "there is more than one thread to follow",
      paragraph:
        "Your attention likes company and variety. You keep several threads in view and move between them, and other people sharpen your thinking instead of scattering it. Long solitary stretches are not where you do your best work, and you do not need to pretend they are.",
      step: {
        title: "Plan your switches",
        detail: "Choose the two or three threads for the day in the morning, so moving between them is a choice and not a drift.",
      },
    },
  },
  {
    partId: "others",
    partPrefix: "others-",
    axis: "Others",
    heading: "Working with others",
    neutral:
      "Your answers in this part did not lean clearly toward thinking first or toward thinking out loud. Many people change with the person in front of them. A fuller answer, about one real colleague, would give this section more to say.",
    a: {
      name: "Thinks before speaking",
      profile: "The Quiet Contributor",
      stems: ["wait", "overnight", "think about", "in writing", "apart", "space", "next day", "calmly", "notes", "write down"],
      line: "Thinks first, speaks second.",
      clause: "you have room to think before you speak",
      paragraph:
        "With other people you think first and speak second. You do well with colleagues who agree on the goal, give you room and then compare notes. In a disagreement you take the question away and come back with something considered, though sometimes after the moment has passed.",
      step: {
        title: "Name a time to come back",
        detail: "When you take a disagreement away, say when you will return to it. \"Let me think and come back tomorrow\" keeps the moment open.",
      },
    },
    b: {
      name: "Thinks out loud",
      profile: "The Open Collaborator",
      stems: ["talk it through", "talk", "discuss", "out loud", "aloud", "bounce", "conversation", "straight away", "there and then", "say so"],
      line: "Thinks by talking.",
      clause: "you can think out loud with someone",
      paragraph:
        "With other people you think by talking. A conversation is where your ideas take shape, and you would rather raise a disagreement early than carry it. Colleagues who need time to consider may experience you as fast; a short pause after you speak gives them room to join you.",
      step: {
        title: "Leave a pause after you speak",
        detail: "Ask one quiet colleague what they think, and wait. Their answer is often the one you needed.",
      },
    },
  },
  {
    partId: "pressure",
    partPrefix: "pressure-",
    axis: "Pressure",
    heading: "Under pressure",
    neutral:
      "Your answers in this part did not lean clearly toward steadying the pace or toward a sprint to the finish. A fuller answer, about one real deadline, would give this section more to say.",
    a: {
      name: "Steady under pressure",
      profile: "The Steady Hand",
      stems: ["list", "in order", "priorit", "steadily", "calm", "step by step", "schedule"],
      line: "Reaches for order when the week fills up.",
      clause: "the pace stays even",
      paragraph:
        "When too much lands at once, you reach for order. You list, you rank, you renegotiate what cannot fit, and you keep a pace you can sustain. People around you may not see how much effort that steadiness takes, so it is worth saying what you need.",
      step: {
        title: "Say what your steadiness needs",
        detail: "In the next busy week, ask for the one thing you named: clear priorities, and room to get on with them.",
      },
    },
    b: {
      name: "Sprints to the finish",
      profile: "The Strong Finisher",
      stems: ["late night", "all night", "pushed", "rush", "sprint", "last minute", "weekend", "adrenaline", "crunch"],
      line: "Finds another gear near the deadline.",
      clause: "a deadline gives the work an edge",
      paragraph:
        "A close deadline gives you another gear. You can work at an intensity that surprises people, and you often do your sharpest work late. The cost comes afterwards, so the question is less how to stop sprinting and more how to recover on purpose.",
      step: {
        title: "Book the recovery with the sprint",
        detail: "When you see a hard week coming, block a lighter day after it before it begins.",
      },
    },
  },
  {
    partId: "next",
    partPrefix: "next-",
    axis: "Next",
    heading: "What you want next",
    neutral:
      "Your answers in this part did not lean clearly toward doing less, better, or toward something new. That is a fair place to be. A fuller answer, about six months from now, would give this section more to say.",
    a: {
      name: "Refiner",
      profile: "The Refiner",
      stems: ["fewer", "less", "properly", "say no", "slow", "boundar", "simpl"],
      line: "Wants fewer things, done properly.",
      clause: "you are making something good a little better",
      paragraph:
        "What you want next is not more, it is better. You are asking for fewer commitments and more room to do them properly. That is a change made mostly by saying no, which is a skill, and one you can practice in small ways.",
      step: {
        title: "Practice one small no",
        detail: "This week, decline or defer one request, and give the reason plainly. Notice what the time makes room for.",
      },
    },
    b: {
      name: "Explorer",
      profile: "The Explorer",
      stems: ["something new", "learn", "bigger", "lead", "grow", "new role", "try something", "new skill", "different team"],
      line: "Wants something new to grow into.",
      clause: "there is something new to work out",
      paragraph:
        "What you want next is something new. You are looking for a larger problem, a skill you do not have yet or a different seat at the table. That is a change made by asking, so it helps to say it out loud to someone who can open a door.",
      step: {
        title: "Tell one person what you want next",
        detail: "Choose someone who could open a door and say it in one sentence. Then ask what they would try first.",
      },
    },
  },
];

const RESOURCES = [
  { title: "The Two-Morning Planner", kind: "One-page worksheet" },
  { title: "Saying No, Kindly", kind: "Short guide" },
  { title: "A Weekly Review in Fifteen Minutes", kind: "Checklist" },
];

const GENERAL_STEP = {
  title: "Write for ten minutes about one real working day",
  detail: "Note what you reached for first, what pulled you away and what you would change. Patterns show in the detail.",
};

/** A quote has to carry something: a few words at least. */
const MIN_QUOTE_WORDS = 4;

/** The first sentence of an answer, shortened at a word if it runs long. */
export function firstSentence(text: string, max = 170): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const end = clean.search(/[.!?](\s|$)/);
  let sentence = end === -1 ? clean : clean.slice(0, end + 1);
  if (sentence.length > max) {
    sentence = sentence.slice(0, max).replace(/\s+\S*$/, "").replace(/[,;:]$/, "") + "…";
  }
  return sentence;
}

function sentences(text: string): string[] {
  return (text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean);
}

/**
 * The person's own sentence that shows the pattern: the first one, in the
 * order they wrote, that contains one of the words the pattern was read from.
 */
export function supportingQuote(answers: string[], stems: string[]): string | null {
  for (const answer of answers) {
    for (const sentence of sentences(answer)) {
      if (countWords(sentence) >= MIN_QUOTE_WORDS && stems.some((stem) => matchesStem(sentence, stem))) {
        return firstSentence(sentence);
      }
    }
  }
  return null;
}

export function buildReport(priv: PrivatePayload, now: number): Report {
  const scored = AXES.map((axis, index) => {
    const answers = priv.turns
      .filter((t) => t.questionId.startsWith(axis.partPrefix) && t.answer !== null)
      .map((t) => t.answer!);
    const text = answers.join(" ");
    const a = countStems(text, axis.a.stems);
    const b = countStems(text, axis.b.stems);
    // No words found, or as many one way as the other: the part does not lean, and the report says so.
    const pole = a === b ? null : b > a ? axis.b : axis.a;
    const hits = Math.max(a, b);
    const score = !pole ? 2 : hits <= 2 ? 3 : hits <= 4 ? 4 : 5;
    return { axis, index, pole, score, quote: pole ? supportingQuote(answers, pole.stems) : null };
  });
  type Leaning = (typeof scored)[number] & { pole: Pole };

  const traits: Trait[] = scored.map((s) => ({
    partId: s.axis.partId,
    axis: s.axis.axis,
    name: s.pole ? s.pole.name : `${s.axis.axis}: no clear lean`,
    score: s.score,
    line: s.pole ? s.pole.line : "Your answers did not lean strongly either way here.",
  }));

  const leaning = scored.filter((s): s is Leaning => s.pole !== null);
  const ranked = [...leaning].sort((x, y) => y.score - x.score || x.index - y.index);
  const [top, second] = ranked;
  const last = scored[scored.length - 1]!;
  const next = last.pole ? (last as Leaning) : null;
  const wish = next ? (next.pole === next.axis.a ? "less, done better" : "something new to grow into") : null;

  const clauses = [top, second].filter((s) => s !== undefined).map((s) => s.pole.clause);
  const keyStatement =
    clauses.length === 0
      ? "Your answers did not point strongly in one direction, so this report stays general. Fuller answers, in your own words, give it more to say."
      : `You do your best work when ${clauses.join(", and ")}.${wish ? ` What you are asking for next is ${wish}.` : ""}`;

  const summary = !top
    ? "Across the five parts your answers did not lean strongly in any one direction. That is common with short answers; the sections below say where a fuller answer would help."
    : !second
      ? `Across the five parts, one pattern came through clearly in your own words: ${top.pole.name.toLowerCase()}.`
      : `Across the five parts, two patterns came through most clearly in your own words: ${top.pole.name.toLowerCase()} and ${second.pole.name.toLowerCase()}.`;

  // Steps come only from parts that leaned: the two clearest, then what the person wants next, then the rest.
  const stepSources = [top, second, next, ...ranked].filter((s, i, all): s is Leaning => !!s && all.indexOf(s) === i);
  const nextSteps = stepSources.slice(0, 3).map((s) => s.pole.step);

  return {
    title: "Your Working Style Reflection",
    firstName: priv.firstName,
    dateISO: dayInZone(now),
    keyStatement,
    profile: { name: top ? top.pole.profile : "No Clear Pattern Yet", summary, traits },
    sections: scored.map((s) => ({
      heading: s.axis.heading,
      paragraphs: [s.pole ? s.pole.paragraph : s.axis.neutral],
      quote: s.quote,
    })),
    nextSteps: nextSteps.length > 0 ? nextSteps : [GENERAL_STEP],
    resources: RESOURCES,
    note: "This report is a reflection drawn from your own words. It is not a diagnosis, and it does not measure ability.",
  };
}
