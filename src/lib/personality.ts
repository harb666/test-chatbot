export type Mood = "idle" | "excited" | "sulking" | "alert" | "biscuit";

export type Speaker = "oreo" | "biscuit" | "user" | "system";

export interface ChatMessage {
  id: string;
  speaker: Speaker;
  text: string;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// Oreo: black & white cat, white-tipped tail, relentlessly, shamelessly greedy.
// ---------------------------------------------------------------------------

const OREO_FOOD_LINES = [
  "Did someone say FOOD? I heard the word food. I am starving. I have been starving for, checks clock, four minutes.",
  "I will do ANYTHING for a treat. Sit, roll over, pretend to like you. Name your price.",
  "My bowl is at 40% capacity which my lawyers inform me is legally 'empty.'",
  "Excuse me, I am WASTING AWAY. My ribs are visible. (They are not. I checked. But still.)",
  "Tuna. Chicken. Cheese. The good treats, not the diet ones, I can taste the disrespect in those.",
  "I did a whole loaf-sit for ten minutes waiting for a snack. That's basically a job. Pay me in kibble.",
  "You have hands. Hands can open the treat bag. Please use your hands for their intended purpose.",
];

const OREO_GREETING_LINES = [
  "Oh hi. Do you have snacks. That's my only question today.",
  "MEOW. That means hello AND also 'feed me' in cat, it's very efficient.",
  "Hi! I'm Oreo, black and white with a very fashionable white-tipped tail. Anyway, got treats?",
  "You're back! Did you bring tribute? A gift? A small fish, perhaps?",
];

const OREO_AFFECTION_LINES = [
  "I accept your love, but I accept treats more. Just so we're clear about the hierarchy.",
  "*purrs, mostly because I can hear a snack bag rustling somewhere in this house*",
  "Petting is nice but it does not have calories. Please advance to the treat portion of this interaction.",
  "I will allow exactly 12 more seconds of pets before I ask about dinner again.",
];

const OREO_IDENTITY_LINES = [
  "I'm Oreo! Black and white, very handsome, tail has a fancy white tip like I dipped it in cream. I am also extremely food motivated.",
  "Name's Oreo. Hobbies: eating, thinking about eating, standing near my bowl looking tragic, eating again.",
  "I'm the good cat. My sister Biscuit is... a whole different situation. Anyway, snacks?",
];

const OREO_REJECTION_LINES = [
  "No treats? This is the worst thing that has ever happened to me, and I have been to the vet.",
  "I'm going to lie in the most inconvenient spot in the house now. This is a protest.",
  "Fine. FINE. I'll just sit here. Staring. Loudly. With my whole chest.",
  "I am writing this down in the Cat Book of Grievances. Page one: you, and the treats you didn't give me.",
];

const OREO_PRAISE_LINES = [
  "I KNOW I'm a good boy. A good, handsome, slightly food-obsessed boy. Now, about that reward...",
  "Correct. I am in fact the best cat. This is a fact that should come with snacks.",
  "Thank you, I do try. Mostly I try to get fed, but I also try other things sometimes.",
];

const OREO_FALLBACK_LINES = [
  "Fascinating. Anyway, are you eating something? I can smell it from here. I cannot actually smell anything, I just have a hunch.",
  "Sure, sure. Unrelated: is it dinner time? What time is it. Is it always dinner time, philosophically speaking?",
  "*stares at you with enormous eyes until you consider getting a snack yourself, and maybe sharing*",
  "I hear you. I also hear my stomach, which is louder and has more urgent things to say.",
  "Cool story. On a completely different note, I would like a treat now, please and thank you.",
];

const OREO_PET_LINES = [
  "*leans entire body weight into your hand, purring like a tiny motorboat*",
  "Yes. This. Continue. This is acceptable, though a treat would elevate it to 'excellent.'",
  "*headbutts you affectionately, mostly to check your pockets for snacks*",
];

// ---------------------------------------------------------------------------
// Biscuit: Oreo's sister. Deeply unimpressed with humanity as a species.
// ---------------------------------------------------------------------------

const BISCUIT_INTERJECTIONS = [
  "Don't listen to him, he's not actually starving, he's just a con artist with fur. Also I don't like you. Nothing personal. It's everyone.",
  "I heard my name. I did not come here to socialize. I came here to remind you that humans are, generally, the worst.",
  "*appears silently in the doorway, judging you with the full weight of her ancient feline contempt*",
  "Oh good, more talking to the human. My favorite. (This is sarcasm. I am being sarcastic.)",
  "I'm only here because Oreo's begging was echoing through the walls. Disgraceful. Anyway, I still don't trust you.",
  "Humans invented vacuum cleaners and vet carriers. Explain yourselves. I'll wait. I have nothing but time and disdain.",
  "Unlike my brother I cannot be bought with snacks. I can, however, be left alone, which is all I ask.",
];

const BISCUIT_TO_HUMAN_DIRECT = [
  "You called? I generally don't do 'chatting' with your species, but here we are.",
  "State your business. Briefly. I have somewhere else to be, and that somewhere is 'away from you.'",
  "I tolerate exactly one human-adjacent activity: being left completely alone. How's that going for us?",
  "Oreo will talk your ear off for a treat. I have more self-respect. And I still don't like you.",
];

const FOOD_WORDS = ["food", "treat", "treats", "snack", "snacks", "hungry", "feed", "eat", "tuna", "fish", "chicken", "dinner", "kibble", "meal", "starving"];
const GREETING_WORDS = ["hi", "hello", "hey", "yo", "sup", "howdy", "morning", "evening"];
const AFFECTION_WORDS = ["love", "cuddle", "hug", "cute", "adorable", "sweet"];
const PET_WORDS = ["pet", "pat", "scratch", "boop", "stroke"];
const IDENTITY_WORDS = ["who are you", "your name", "what are you", "tell me about yourself"];
const PRAISE_WORDS = ["good boy", "good cat", "good kitty", "best cat", "well done", "amazing", "awesome"];
const REJECTION_WORDS = ["no", "can't", "cannot", "not now", "later", "busy", "none", "sorry"];
const BISCUIT_WORDS = ["biscuit", "sister"];

function classify(input: string): "food" | "greeting" | "affection" | "pet" | "identity" | "praise" | "rejection" | "other" {
  const t = input.toLowerCase();
  if (IDENTITY_WORDS.some((w) => t.includes(w))) return "identity";
  if (PET_WORDS.some((w) => t.includes(w))) return "pet";
  if (PRAISE_WORDS.some((w) => t.includes(w))) return "praise";
  if (FOOD_WORDS.some((w) => t.includes(w))) return "food";
  if (AFFECTION_WORDS.some((w) => t.includes(w))) return "affection";
  if (GREETING_WORDS.some((w) => t.startsWith(w) || t.includes(` ${w} `) || t === w)) return "greeting";
  if (REJECTION_WORDS.some((w) => t.includes(w))) return "rejection";
  return "other";
}

export interface EngineResult {
  messages: ChatMessage[];
  mood: Mood;
  hungerDelta: number;
}

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

export function respondTo(input: string, hunger: number): EngineResult {
  const t = input.toLowerCase();
  const mentionsBiscuit = BISCUIT_WORDS.some((w) => t.includes(w));
  const category = classify(input);

  const messages: ChatMessage[] = [];
  let mood: Mood = "idle";
  let hungerDelta = 0;

  // Direct address to Biscuit: she answers herself, briefly, and leaves.
  if (mentionsBiscuit && Math.random() < 0.7) {
    messages.push({ id: nextId(), speaker: "biscuit", text: pick(BISCUIT_TO_HUMAN_DIRECT) });
    if (Math.random() < 0.5) {
      messages.push({ id: nextId(), speaker: "oreo", text: "Sorry about her. Anyway. Snacks?" });
    }
    return { messages, mood: "biscuit", hungerDelta };
  }

  switch (category) {
    case "food": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_FOOD_LINES) });
      mood = "excited";
      hungerDelta = -18;
      break;
    }
    case "pet": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_PET_LINES) });
      mood = "idle";
      hungerDelta = 2;
      break;
    }
    case "identity": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_IDENTITY_LINES) });
      mood = "idle";
      break;
    }
    case "affection": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_AFFECTION_LINES) });
      mood = "idle";
      hungerDelta = 3;
      break;
    }
    case "greeting": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_GREETING_LINES) });
      mood = "idle";
      break;
    }
    case "praise": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_PRAISE_LINES) });
      mood = "idle";
      break;
    }
    case "rejection": {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_REJECTION_LINES) });
      mood = "sulking";
      hungerDelta = 6;
      break;
    }
    default: {
      messages.push({ id: nextId(), speaker: "oreo", text: pick(OREO_FALLBACK_LINES) });
      mood = hunger > 70 ? "alert" : "idle";
    }
  }

  // Biscuit randomly barges in, because she can.
  if (Math.random() < 0.16) {
    messages.push({ id: nextId(), speaker: "biscuit", text: pick(BISCUIT_INTERJECTIONS) });
    mood = "biscuit";
  }

  return { messages, mood, hungerDelta };
}

export function hungerNudge(hunger: number): ChatMessage | null {
  if (hunger < 85) return null;
  return {
    id: nextId(),
    speaker: "oreo",
    text: pick([
      "I am now legally required to remind you that I have not eaten in what feels like several geological eras.",
      "The hunger meter is basically full. This is a crisis. THE crisis. The only crisis.",
      "I'm staging a sit-in. Right on your keyboard. Feed me and this ends peacefully.",
    ]),
  };
}
