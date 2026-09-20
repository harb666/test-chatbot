import { useEffect, useMemo, useRef, useState } from "react";
import BrainScene from "./BrainScene";
import { BrainSimulation } from "./simulation";
import { useCameraMotion } from "./useCameraMotion";
import { GROUP_COLOR, GROUP_LABEL, NODES, type NodeGroup } from "./connectome";

function useShare() {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const share = async () => {
    const url = window.location.href;
    const data = {
      title: "Fly Brain 🪰",
      text: "A simplified, real-time simulation of a fruit fly's brain circuitry, driven by your phone camera. Runs entirely on-device.",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* user cancelled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return { canShare, copied, share };
}

const GROUPS: NodeGroup[] = ["optic", "olfactory", "mushroom", "central", "motor"];

export default function FlyBrainApp() {
  const sim = useMemo(() => new BrainSimulation(), []);
  const { status, videoRef, motionRef, start, startle } = useCameraMotion();
  const { canShare, copied, share } = useShare();
  const [flash, setFlash] = useState(false);
  const [levels, setLevels] = useState<Record<NodeGroup, number>>({
    optic: 0,
    olfactory: 0,
    mushroom: 0,
    central: 0,
    motor: 0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setLevels({
        optic: sim.groupAverage((n) => n.group === "optic"),
        olfactory: sim.groupAverage((n) => n.group === "olfactory"),
        mushroom: sim.groupAverage((n) => n.group === "mushroom"),
        central: sim.groupAverage((n) => n.group === "central"),
        motor: sim.groupAverage((n) => n.group === "motor"),
      });
    }, 120);
    return () => clearInterval(id);
  }, [sim]);

  const flashRef = useRef<number>(0);
  const handleEscape = () => {
    setFlash(true);
    window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => setFlash(false), 900);
  };

  return (
    <div className="fb-app">
      <header className="fb-header">
        <div className="fb-title-block">
          <h1>Fly Brain 🪰</h1>
          <p>{NODES.length} regions · a simplified live model of a fruit fly's circuitry</p>
        </div>
        <button className="fb-share-btn" onClick={share}>
          {copied ? "Link copied!" : canShare ? "Share" : "Copy link"}
        </button>
      </header>

      <div className="fb-scene-wrap">
        <BrainScene sim={sim} motionRef={motionRef} onEscape={handleEscape} />
        {flash && <div className="fb-escape-flash">ESCAPE RESPONSE — motion detected</div>}

        <video ref={videoRef} className="fb-camera-preview" muted playsInline autoPlay />

        <div className="fb-camera-controls">
          {status === "active" ? (
            <span className="fb-status-pill fb-status-active">👁 camera driving vision</span>
          ) : status === "requesting" ? (
            <span className="fb-status-pill">requesting camera…</span>
          ) : status === "denied" ? (
            <span className="fb-status-pill">camera denied — running on ambient input</span>
          ) : status === "unavailable" ? (
            <span className="fb-status-pill">no camera here — running on ambient input</span>
          ) : (
            <button className="fb-camera-btn" onClick={start}>
              Use camera as eyes
            </button>
          )}
          <button className="fb-startle-btn" onClick={startle}>
            Startle
          </button>
        </div>
      </div>

      <div className="fb-readout">
        {GROUPS.map((g) => (
          <div className="fb-readout-row" key={g}>
            <span className="fb-readout-label" style={{ color: GROUP_COLOR[g] }}>
              {GROUP_LABEL[g]}
            </span>
            <div className="fb-readout-track">
              <div
                className="fb-readout-fill"
                style={{ width: `${Math.min(100, levels[g] * 100)}%`, background: GROUP_COLOR[g] }}
              />
            </div>
          </div>
        ))}
      </div>

      <footer className="fb-footer">
        Point the camera at something and move it — real motion drives the visual pathway (lamina → medulla →
        lobula → lobula plate) toward the descending neurons that flap the wings, the way a fly's actual escape
        reflex works. No account, no server: everything runs on your device.{" "}
        <a href="./index.html">🐾 Or go chat with Oreo instead</a>
      </footer>
    </div>
  );
}
