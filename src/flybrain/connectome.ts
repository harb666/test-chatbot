// A stylized, macro-scale stand-in for the fly brain connectome.
//
// The real FlyWire/FAFB connectome (flywire.ai) has ~139,000 neurons and
// ~2.7M synapses across ~78 neuropils — far too much to ship or simulate on
// a phone in a browser tab. This models the same *circuit motifs* at the
// neuropil level instead: a couple dozen named brain regions wired up the
// way the real ones are known to connect (visual motion -> escape,
// olfaction -> mushroom body / lateral horn, central complex as the
// steering hub), so the behavior is a genuine (simplified) model rather
// than random wiring.

export type NodeGroup = "optic" | "olfactory" | "mushroom" | "central" | "motor";

export interface BrainNode {
  id: string;
  label: string;
  full: string;
  group: NodeGroup;
  side: "L" | "R" | "M";
  position: [number, number, number];
  radius: number;
  /** Leak time constant in seconds — smaller = faster/twitchier. */
  tau: number;
}

export interface BrainEdge {
  source: string;
  target: string;
  weight: number;
}

const side = (base: [number, number, number], mirror: boolean): [number, number, number] =>
  mirror ? [-base[0], base[1], base[2]] : base;

function pair(
  id: string,
  label: string,
  full: string,
  group: NodeGroup,
  pos: [number, number, number],
  radius: number,
  tau: number,
): BrainNode[] {
  return [
    { id: `${id}_L`, label, full, group, side: "L", position: side(pos, true), radius, tau },
    { id: `${id}_R`, label, full, group, side: "R", position: side(pos, false), radius, tau },
  ];
}

export const NODES: BrainNode[] = [
  // --- Optic lobe: visual motion pathway (lamina -> medulla -> lobula -> lobula plate).
  // Tau values here are fast on purpose: a real fly's motion-to-escape pathway (via the
  // giant fiber system) is famously one of the quickest reflex circuits in any animal,
  // so this chain is tuned to visibly react within well under a second, not the slower
  // ~1s+ it'd take with anatomically-typical integration time constants.
  ...pair("lamina", "Lamina", "Lamina (photoreceptor relay)", "optic", [2.15, 0.3, 0.85], 0.09, 0.06),
  ...pair("medulla", "Medulla", "Medulla (early vision)", "optic", [1.85, 0.28, 0.42], 0.1, 0.07),
  ...pair("lobula", "Lobula", "Lobula (form vision)", "optic", [1.55, 0.18, 0.0], 0.1, 0.08),
  ...pair("lop", "Lobula Plate", "Lobula plate (motion / LPTCs)", "optic", [1.45, -0.02, -0.32], 0.11, 0.09),

  // --- Olfaction: antennal lobe -> mushroom body + lateral horn (slower, deliberative) ---
  ...pair("al", "Antennal Lobe", "Antennal lobe (smell input)", "olfactory", [0.68, -0.35, 1.0], 0.1, 0.4),
  ...pair("mbc", "MB Calyx", "Mushroom body calyx", "mushroom", [0.55, 0.58, 0.12], 0.09, 0.5),
  ...pair("mbl", "MB Lobes", "Mushroom body lobes (learning)", "mushroom", [0.32, 0.15, 0.38], 0.09, 0.5),
  ...pair("lh", "Lateral Horn", "Lateral horn (innate smell)", "olfactory", [0.92, 0.08, 0.55], 0.09, 0.4),

  // --- Premotor / descending ---
  ...pair("lal", "LAL", "Lateral accessory lobe (premotor)", "central", [0.42, -0.18, -0.18], 0.1, 0.2),
  ...pair("dn", "Descending", "Descending neurons (to VNC)", "motor", [0.28, -0.58, -0.52], 0.08, 0.08),

  // --- Central complex: midline steering hub (slow integrator — the fly's sense of
  // heading persists over seconds, unlike the reflex pathway above) ---
  { id: "eb", label: "EB", full: "Ellipsoid body", group: "central", side: "M", position: [0, 0.15, -0.05], radius: 0.11, tau: 0.6 },
  { id: "fb", label: "FB", full: "Fan-shaped body", group: "central", side: "M", position: [0, 0.36, -0.18], radius: 0.1, tau: 0.7 },
  { id: "pb", label: "PB", full: "Protocerebral bridge", group: "central", side: "M", position: [0, 0.52, -0.3], radius: 0.08, tau: 0.7 },

  // --- Midline feeding / motor output ---
  { id: "sez", label: "SEZ", full: "Subesophageal zone", group: "motor", side: "M", position: [0, -0.78, 0.32], radius: 0.1, tau: 0.4 },
  { id: "vnc", label: "VNC", full: "Ventral nerve cord (wings/legs)", group: "motor", side: "M", position: [0, -1.32, -0.22], radius: 0.12, tau: 0.1 },
];

function edgesForSide(s: "L" | "R"): BrainEdge[] {
  const other: "L" | "R" = s === "L" ? "R" : "L";
  return [
    // Visual motion chain
    { source: `lamina_${s}`, target: `medulla_${s}`, weight: 0.95 },
    { source: `medulla_${s}`, target: `lobula_${s}`, weight: 0.9 },
    { source: `lobula_${s}`, target: `lop_${s}`, weight: 0.9 },
    // Motion detectors drive premotor circuitry (mostly ipsilateral escape steering,
    // small contralateral crosstalk like real bilateral LPTC integration)
    { source: `lop_${s}`, target: `lal_${s}`, weight: 0.75 },
    { source: `lop_${s}`, target: `lal_${other}`, weight: 0.2 },
    // "Giant fiber" shortcut: real flies escape via a near-monosynaptic fast pathway
    // from visual motion detectors straight to the descending neurons, bypassing the
    // slower deliberative premotor loop — that's what makes the reflex so fast.
    { source: `lop_${s}`, target: `dn_${s}`, weight: 0.85 },

    // Olfaction
    { source: `al_${s}`, target: `mbc_${s}`, weight: 0.8 },
    { source: `mbc_${s}`, target: `mbl_${s}`, weight: 0.85 },
    { source: `al_${s}`, target: `lh_${s}`, weight: 0.55 },
    { source: `mbl_${s}`, target: `lal_${s}`, weight: 0.4 },
    { source: `lh_${s}`, target: `sez`, weight: 0.35 },

    // Premotor -> descending -> motor
    { source: `lal_${s}`, target: `dn_${s}`, weight: 0.85 },
    { source: `dn_${s}`, target: `vnc`, weight: 0.9 },

    // Premotor feeds the central complex's heading/steering integrator. Deliberately
    // one-way (not a closed loop back to lal/motor): a recurrent loop here would need
    // very careful gain tuning to avoid runaway self-sustaining activity, and isn't
    // needed for what this model shows — EB/FB/PB just visualize "the navigation
    // system is integrating something" driven by the reflex pathway below it.
    { source: `lal_${s}`, target: `eb`, weight: 0.45 },
  ];
}

export const EDGES: BrainEdge[] = [
  ...edgesForSide("L"),
  ...edgesForSide("R"),
  { source: "eb", target: "fb", weight: 0.6 },
  { source: "fb", target: "pb", weight: 0.55 },
  { source: "sez", target: "vnc", weight: 0.5 },
];

export const GROUP_COLOR: Record<NodeGroup, string> = {
  optic: "#57d9ff",
  olfactory: "#ffb347",
  mushroom: "#c792ff",
  central: "#ff6fc7",
  motor: "#ff5a5a",
};

export const GROUP_LABEL: Record<NodeGroup, string> = {
  optic: "Vision",
  olfactory: "Smell",
  mushroom: "Memory",
  central: "Navigation",
  motor: "Motor output",
};
