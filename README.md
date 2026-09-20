# Oreo the Cat 🐾

A tiny chatbot app starring **Oreo**, a black-and-white 3D cat with a
white-tipped tail. Oreo is shamelessly greedy and will steer every
conversation back toward treats. His sister **Biscuit** hates humans and
occasionally barges into the chat to say so.

Everything runs **entirely in the browser** — there's no server, no API key,
and no Claude account or sign-up of any kind. The "chatbot" is a small
rule-based personality engine (see `src/lib/personality.ts`), not a call to
an LLM, so there's nothing to configure and nothing that can ask a recipient
to log in. That's also what makes it safe to send as a plain link over
iMessage: whoever opens it just gets a working page.

## What's in here

- `src/components/Cat.tsx` — a procedural 3D cat (built from Three.js
  primitives: spheres, cones, cylinders, and a curved tube for the tail)
  with black/white markings, a white tail tip, idle breathing, blinking,
  ear and tail animation, and mood reactions (excited, sulking, alert).
  The same component renders both Oreo and his sister Biscuit (recolored
  eyes, ears pinned back, a faint red glow).
- `src/components/Scene.tsx` — the `@react-three/fiber` canvas, lighting,
  and camera. Biscuit lurks in a dark corner and becomes more visible when
  she's mentioned in chat.
- `src/lib/personality.ts` — the chat "engine": keyword-based response
  categories (food, petting, greetings, identity, praise, rejection),
  randomized response banks for both cats, and a hunger/"Treat Meter" state
  that rises over time and drops when you offer Oreo food — because he's
  greedy and that should be more than just a line of dialogue.
- `src/components/ChatWindow.tsx` — the chat UI (bubbles, quick-reply
  chips, composer).
- `src/App.tsx` — wires it together and adds the "Send via iMessage"
  button (uses the native Web Share API on iOS, which lists Messages as a
  share target; falls back to "Copy link" where Web Share isn't available).

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL in a browser.

## Building

```bash
npm run build
```

Outputs a fully static site to `dist/` — just HTML/CSS/JS and a few PNGs.
No environment variables, no backend.

## Deploying so you can actually send it over iMessage

Since it's a static site, any static host works. Two easy options:

**Vercel**
```bash
npm i -g vercel
vercel --prod
```

**Netlify (drag-and-drop)**
```bash
npm run build
# then drag the resulting dist/ folder onto https://app.netlify.com/drop
```

**GitHub Pages** also works — build, then publish the `dist/` folder to a
`gh-pages` branch or via a Pages workflow.

Once it's deployed, you'll have a normal `https://…` URL. Open it on your
iPhone (or tap "Send via iMessage" inside the app, which opens the native
share sheet with Messages as an option), and send that link like you would
any other link. The recipient taps it, the page loads, and they can start
talking to Oreo immediately — no account needed on either end.

### Nicer link previews

`index.html` already includes Open Graph tags pointing at
`public/og-image.png` (a pre-rendered 1200×630 image of Oreo) so the link
shows a rich preview in Messages instead of a bare URL. If your host serves
the site from a subpath, double check that `og:image` still resolves — the
included tags use a relative path (`./og-image.png`), which works for a
root deployment; switch it to an absolute URL if you deploy under a
subpath and previews don't pick it up.

## The characters

- **Oreo** — black and white, white-tipped tail, greedy to a fault. Ask him
  about treats, food, or dinner and he will not let it go. There's a Treat
  Meter under the 3D scene that climbs on its own over time (he's always
  getting hungrier) and drops when you "feed" him in chat.
- **Biscuit** — Oreo's sister. Doesn't think much of humans. She interjects
  randomly and whenever you mention her by name, with a noticeably less
  patient tone than her brother.
