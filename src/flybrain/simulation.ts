import { NODES, EDGES, type BrainNode } from "./connectome";

/**
 * A leaky-integrator firing-rate simulation over the connectome graph.
 * Each node relaxes toward a target activity level — its external input plus
 * the weighted sum of its upstream neighbors' current activity — at a rate set
 * by its own time constant (tau). Critically, tau only controls *how fast* a
 * node settles, not *how high* — the target itself is a plain weighted sum, so
 * a slow "integrator" node (large tau) can't spuriously amplify a tiny but
 * sustained input into saturation the way it would if tau scaled the gain too.
 * That keeps a multi-hop chain's attenuation bounded by edge weights (each
 * ≤ 1) instead of compounding into either nothing or a runaway.
 */
export class BrainSimulation {
  nodes: BrainNode[] = NODES;
  index: Map<string, number>;
  activity: Float32Array;
  private incoming: { src: number; weight: number }[][];
  private scratch: Float32Array;

  constructor() {
    this.index = new Map(this.nodes.map((n, i) => [n.id, i]));
    this.activity = new Float32Array(this.nodes.length);
    this.scratch = new Float32Array(this.nodes.length);
    this.incoming = this.nodes.map(() => []);
    for (const e of EDGES) {
      const src = this.index.get(e.source);
      const tgt = this.index.get(e.target);
      if (src === undefined || tgt === undefined) continue;
      this.incoming[tgt].push({ src, weight: e.weight });
    }
  }

  /** external: map of node id -> extra drive (0..~1) applied this step */
  step(dt: number, external: Record<string, number>) {
    const prev = this.activity;
    const out = this.scratch;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      let drive = external[node.id] ?? 0;
      const ins = this.incoming[i];
      for (let k = 0; k < ins.length; k++) {
        drive += ins[k].weight * prev[ins[k].src];
      }
      // Exact solution of da/dt = (target - a) / tau over this step, treating
      // the target as constant for the step — standard exponential smoothing.
      const target = drive;
      const alpha = 1 - Math.exp(-dt / node.tau);
      const next = prev[i] + (target - prev[i]) * alpha;
      out[i] = next < 0 ? 0 : next > 1 ? 1 : next;
    }
    this.scratch = prev;
    this.activity = out;
  }

  get(id: string): number {
    const i = this.index.get(id);
    return i === undefined ? 0 : this.activity[i];
  }

  groupAverage(predicate: (n: BrainNode) => boolean): number {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      if (predicate(this.nodes[i])) {
        sum += this.activity[i];
        count++;
      }
    }
    return count ? sum / count : 0;
  }
}
