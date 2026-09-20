# Oreo the Cat 🐾 & Fly Brain 🪰

Two tiny, install-free mobile web apps in one static site. Both run
**entirely in the browser** — no server, no API key, no account — so
they're safe to send as a plain link (iMessage, anywhere): whoever opens it
just gets a working page.

- **Oreo** (`index.html`) — a chatbot starring a black-and-white 3D cat with
  a white-tipped tail. Oreo is shamelessly greedy and will steer every
  conversation back toward treats. His sister **Biscuit** hates humans and
  occasionally barges into the chat to say so.
- **Fly Brain** (`flybrain.html`) — a live, simplified simulation of a fruit
  fly's brain circuitry (vision, smell, memory, navigation, motor output),
  driven in real time by your phone's camera. See "Fly Brain" further down
  for how it works.

The two apps cross-link to each other in their footers.

## Oreo

The "chatbot" is a small rule-based personality engine (see
`src/lib/personality.ts`), not a call to an LLM, so there's nothing to
configure and nothing that can ask a recipient to log in.

### What's in here

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

### The characters

- **Oreo** — black and white, white-tipped tail, greedy to a fault. Ask him
  about treats, food, or dinner and he will not let it go. There's a Treat
  Meter under the 3D scene that climbs on its own over time (he's always
  getting hungrier) and drops when you "feed" him in chat.
- **Biscuit** — Oreo's sister. Doesn't think much of humans. She interjects
  randomly and whenever you mention her by name, with a noticeably less
  patient tone than her brother.

## Fly Brain 🪰

A stylized, real-time model of a fruit fly's brain circuitry — not the raw
FlyWire/FAFB connectome (that's ~139,000 neurons and ~2.7M synapses, far too
much to ship to a phone), but the same *circuit motifs* at the neuropil
level: 25 named brain regions wired up the way the real ones are known to
connect, simulated live in the browser and driven by your phone's camera.

Point the camera at something and move it. Frame-to-frame brightness change
in the left/right halves of the camera feed stands in for the elementary
motion detectors a fly's compound eyes actually compute, and that signal
flows through a simulated visual pathway — lamina → medulla → lobula →
lobula plate → descending neurons → wings — the same stages (simplified) a
real escape reflex uses, including a fast "giant fiber" shortcut so the
response is snappy rather than laggy. A parallel, slower olfaction →
mushroom body → central complex pathway gives the "Smell", "Memory", and
"Navigation" readouts something to do even with no camera motion. No
camera permission → falls back to a tiny ambient idle signal so the demo
still has something to look at; there's also a manual "Startle" button.

### What's in here

- `src/flybrain/connectome.ts` — the node/edge graph: 25 regions (optic
  lobe, antennal lobe, mushroom body, lateral horn, central complex,
  descending/motor) and the weighted connections between them, with brief
  notes on the real neuroanatomy each one is standing in for.
- `src/flybrain/simulation.ts` — the leaky-integrator firing-rate model that
  steps the graph forward each frame (see the comment at the top for why
  it's built the way it is — a naive tau/gain coupling here will either do
  nothing or run away to full saturation, so it's deliberately structured
  so a node's settling *speed* and its settling *level* are independent).
- `src/flybrain/useCameraMotion.ts` — turns camera frames (downsampled to
  32×18) into a left/right motion signal, with an ambient fallback when
  there's no camera.
- `src/flybrain/BrainScene.tsx` / `FlyAvatar.tsx` — the
  `@react-three/fiber` visualization: glowing nodes/edges for the
  connectome, plus a small procedural fly that flaps harder and flinches
  when the motor pathway fires.
- `src/flybrain/FlyBrainApp.tsx` — layout, the camera/startle controls, and
  the per-region activity readout.

## Running locally

```bash
npm install
npm run dev
```

Vite prints local URLs for both `index.html` (Oreo) and `/flybrain.html`
(Fly Brain) — the camera won't work over plain `http://`, except on
`localhost` itself, so test the camera either at the printed `localhost`
URL or over a deployed `https://` link.

## Building

```bash
npm run build
```

Outputs a fully static, two-page site to `dist/` (`index.html` and
`flybrain.html`) — just HTML/CSS/JS and a few PNGs. No environment
variables, no backend.

## Deploying so you can actually open it on your phone

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

**GitHub Pages** also works (there's already a workflow at
`.github/workflows/*.yml` that builds and deploys `dist/` on push) — both
pages land at the same host, e.g. `https://you.github.io/repo/` for Oreo and
`https://you.github.io/repo/flybrain.html` for Fly Brain.

Once it's deployed, you'll have a normal `https://…` URL — camera access on
iOS/Android requires HTTPS, so this step is required for Fly Brain to use
your camera rather than its ambient fallback. Open it on your phone (or tap
"Share"/"Send via iMessage" inside either app, which opens the native share
sheet), and send that link like you would any other link. The recipient
taps it, the page loads, and it just works — no account needed on either
end.

### Nicer link previews

Both `index.html` and `flybrain.html` include Open Graph tags pointing at a
pre-rendered 1200×630 PNG (`public/og-image.png` /
`public/flybrain-og-image.png`) so the link shows a rich preview in
Messages instead of a bare URL. If your host serves the site from a
subpath, double check that `og:image` still resolves — the included tags
use a relative path, which works for a root deployment; switch it to an
absolute URL if you deploy under a subpath and previews don't pick it up.
