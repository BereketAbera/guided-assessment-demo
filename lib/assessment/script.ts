/**
 * The scripted guide. In the real product a language model writes each
 * reflection and chooses each question from the owner's prompt. Here the same
 * job is done by rules, so the sample runs without a model or an API key.
 */
export type Rule = { stems: string[]; line: string };

export type ScriptQuestion = {
  id: string;
  partIndex: number;
  text: string;
  /** Asked once when the answer is very short. */
  followUp: string;
  /** Said after this question is answered, chosen by the first rule that matches. */
  reflections: Rule[];
  fallback: string;
};

export const SHORT_ANSWER_WORDS = 10;

export const SCRIPT: ScriptQuestion[] = [
  {
    id: "begin-1",
    partIndex: 0,
    text: "Think about a recent working day that started well. What did the first hour look like?",
    followUp: "Take your time with this one. What was one small thing in that first hour that made the difference?",
    reflections: [
      { stems: ["notebook", "list", "plan", "calendar", "wrote", "write"], line: "You like to see the shape of the day before you step into it." },
      { stems: ["early", "quiet", "coffee", "before most", "morning"], line: "A quiet, early start seems to set the tone for you." },
      { stems: ["email", "message", "inbox", "chat"], line: "Messages find you early, and that colors the first hour." },
    ],
    fallback: "Thank you. That gives a clear picture of how your day begins.",
  },
  {
    id: "begin-2",
    partIndex: 0,
    text: "When a new piece of work lands on your desk, what do you do before you start?",
    followUp: "Could you walk me through the last time that happened?",
    reflections: [
      { stems: ["read", "outline", "question", "understand", "plan", "sketch", "list"], line: "You want to understand the whole before you touch a part." },
      { stems: ["start", "dive", "jump", "try", "draft", "straight", "just begin"], line: "You find your way by starting, more than by planning." },
    ],
    fallback: "So that is how you find your footing with something new.",
  },
  {
    id: "focus-1",
    partIndex: 1,
    text: "Describe the last time you were fully absorbed in your work. What were you doing, and what made it possible?",
    followUp: "What was different about that day, compared with an ordinary one?",
    reflections: [
      { stems: ["quiet", "door", "alone", "headphone", "drawer", "nobody", "no one", "uninterrupted"], line: "Depth, for you, seems to need some protection from the room." },
      { stems: ["together", "team", "pair", "call", "workshop", "with a colleague"], line: "Your attention sharpens when someone is in the work with you." },
    ],
    fallback: "That kind of absorption is worth knowing how to find again.",
  },
  {
    id: "focus-2",
    partIndex: 1,
    text: "What pulls you out of that kind of focus most often, and what do you do when it happens?",
    followUp: "And once you have been pulled away, how do you usually find your way back?",
    reflections: [
      { stems: ["meeting", "message", "notification", "email", "phone", "chat", "people"], line: "Most of what interrupts you arrives on other people's timing, not your own." },
      { stems: ["tired", "bored", "hungry", "restless", "worry", "my own", "mind wander"], line: "Some of what interrupts you starts on the inside." },
    ],
    fallback: "You already notice the moment your focus slips, which is most of the work.",
  },
  {
    id: "others-1",
    partIndex: 2,
    text: "Think of someone you work well with. What happens between you that makes the work better?",
    followUp: "Can you remember one moment with them that shows it?",
    reflections: [
      { stems: ["space", "trust", "apart", "writing", "written", "notes", "leave", "independent"], line: "Trust and room to think matter more to you than constant contact." },
      { stems: ["talk", "discuss", "aloud", "out loud", "bounce", "conversation", "whiteboard", "ideas"], line: "You do some of your best thinking in conversation." },
    ],
    fallback: "It helps to know what good collaboration looks like for you.",
  },
  {
    id: "others-2",
    partIndex: 2,
    text: "When you disagree with a colleague about how to do something, what do you usually do?",
    followUp: "Think of the most recent disagreement. What did you actually do?",
    reflections: [
      { stems: ["wait", "overnight", "think about", "later", "next day", "write down", "sleep on"], line: "You take a disagreement away and think before you answer." },
      { stems: ["say", "speak", "tell", "raise", "direct", "straight away", "there and then"], line: "You would rather say it early than carry it." },
    ],
    fallback: "Disagreement tells you something about what you care about in the work.",
  },
  {
    id: "pressure-1",
    partIndex: 3,
    text: "Tell me about a recent deadline, or a week when too much landed at once. How did you get through it?",
    followUp: "What was the first thing you did when you saw how much there was?",
    reflections: [
      { stems: ["list", "order", "plan", "priorit", "steadily", "calm", "step by step", "schedule"], line: "Under pressure you reach for order, and it holds." },
      { stems: ["late night", "all night", "pushed", "rush", "sprint", "last minute", "weekend", "adrenaline", "crunch"], line: "You found another gear when the deadline came close." },
    ],
    fallback: "You got through it, and you can describe how. That is useful to know.",
  },
  {
    id: "pressure-2",
    partIndex: 3,
    text: "What do you need from the people around you when the pressure is on?",
    followUp: "If you could ask for just one thing in a week like that, what would it be?",
    reflections: [
      { stems: ["quiet", "space", "leave me", "alone", "trust", "once a day"], line: "When it is busy, you need room more than you need company." },
      { stems: ["help", "support", "check in", "talk", "together", "company"], line: "When it is busy, you want people close." },
    ],
    fallback: "Knowing what to ask for is half of getting it.",
  },
  {
    id: "next-1",
    partIndex: 4,
    text: "If one thing about the way you work could be different six months from now, what would you want it to be?",
    followUp: "What would that change make room for?",
    reflections: [
      { stems: ["fewer", "less", "properly", "protect", "say no", "slow", "boundar", "deep work"], line: "You are asking for less, done better." },
      { stems: ["new", "learn", "bigger", "lead", "grow", "change role", "try something"], line: "You are looking for something new to grow into." },
    ],
    fallback: "That is a clear wish, and a reachable one.",
  },
  {
    id: "next-2",
    partIndex: 4,
    text: "What is one small thing you could try this week that would move you toward that?",
    followUp: "Make it smaller still. What could you do on a single morning?",
    reflections: [],
    fallback: "That is small enough to try and clear enough to notice.",
  },
];

export const FOLLOW_UP_REFLECTION = "Thank you. A little more will help your report.";
export const CLOSING_LINE = "That was the last question. Thank you for the care you put into this.";

/** Invented answers, used for the seeded example sessions, the sample report and the "use a sample answer" shortcut. */
export const SAMPLE_ANSWERS: Record<string, string> = {
  "begin-1":
    "I got in before most people, made coffee and spent twenty minutes with my notebook before opening email. I wrote down the three things that had to happen that day. By the time messages started arriving I already knew what I was protecting.",
  "begin-2":
    "I read everything twice and write down the questions I have. Then I sketch an outline of the whole piece, even a rough one. I don't like to start until I understand what done looks like and who it is for.",
  "focus-1":
    "Last month I rebuilt our quarterly planning sheet. I had a quiet afternoon with the door closed and my phone in a drawer. Three hours went by without my noticing. It was possible because nobody needed anything from me until four.",
  "focus-2":
    "Mostly messages, and short meetings scattered through the day. When it happens I write one line about where I was, deal with the interruption, and come back to the line. It works about half the time.",
  "others-1":
    "My colleague Dana gives me space. We agree on the goal in writing, work apart for a few days, then compare notes. She trusts me to get on with it, and I trust her to tell me plainly when something is off.",
  "others-2":
    "I usually wait. I think about it overnight and write down what I actually disagree with. Then I bring it up the next day, calmly, with an alternative. I know I sometimes wait too long and the moment passes.",
  "pressure-1":
    "In October two projects were due in the same week. I made a list of everything, put it in order, and told one team their piece would be two days late. I worked steadily and stopped at seven each night. It was tiring, but it held.",
  "pressure-2":
    "Clear priorities and a bit of quiet. I need someone to tell me what matters most and then leave me to it. Check in once a day, not once an hour.",
  "next-1":
    "I would like fewer things on my plate and more time to do them properly. I say yes too quickly. Six months from now I want to be protecting two mornings a week for deep work.",
  "next-2":
    "I could block Tuesday morning in my calendar this week and treat it like a meeting with someone important. And tell my team why.",
};

export const SAMPLE_FOLLOW_UP_ANSWER =
  "The last time, I closed my laptop for ten minutes and wrote the next step on paper first. It sounds small, but it meant I started from my own plan and not from whatever arrived overnight.";

/** A second invented voice, for the seeded session that is still in progress. */
export const SECOND_VOICE_ANSWERS: Record<string, string> = {
  "begin-1":
    "I opened my laptop on the train and just started on the proposal. No plan, I find my way by writing a rough draft and seeing what is wrong with it. By nine I had two pages.",
  "begin-2":
    "Honestly I dive in. I try the hardest part first to see if it is even possible, then I go back and tidy up. Reading the whole brief first makes me restless.",
  "focus-1":
    "A workshop with the design team last week. Four of us at a whiteboard for a whole afternoon. I lose track of time when we are building on each other's ideas together.",
  "focus-2":
    "Mostly my own mind wandering when a task gets dull. I switch to something else for twenty minutes and come back. I keep three things on the go so there is always somewhere to switch to.",
};

/** A third, briefer voice, for the seeded session that ran out of time. */
export const THIRD_VOICE_ANSWERS: Record<string, string> = {
  "begin-1":
    "It was a Tuesday. I walked to work instead of taking the bus and had the first hour with no meetings. I answered the two messages I had been avoiding and felt lighter for the rest of the morning.",
  "begin-2":
    "I ask who needs it and by when. Then I usually talk it through with someone before I write anything down.",
};
