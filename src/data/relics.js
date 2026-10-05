// Static Relic Data for Relic Dig 3026
// Single static data file containing all five authored field notes and the default sealed message.
// Authored copy finalized for Step 6.

export const DEFAULT_SEALED_MESSAGE =
  "To whoever finds this: we knew you would eventually dig this far. The things you call relics were ordinary to us. Keep them safe. They are proof that we were here.";

export const RELICS = [
  {
    id: "earbuds",
    name: "Wired Earbuds",
    file: "/assets/earbuds_v2.glb",
    scale: 1.0,
    pitOffset: [0, -0.05, 0],
    fieldNote:
      "Personal acoustic communication implants, probably worn beneath the skin. Their connecting filament suggests an early neural interface, though the two separate receivers remain unexplained. Such devices were apparently common among people who preferred to receive information directly into the skull.",
    specimenId: "SPEC-3026-01",
    provenance: "Tripo v3.1 Task 6f2a0c8b-0cf4-433c-8f80-f4c51d03a862"
  },
  {
    id: "can",
    name: "Aluminium Can",
    file: "/assets/crushed_can_fossil.glb",
    scale: 0.9,
    pitOffset: [0, -0.08, 0],
    fieldNote:
      "A disposable cylindrical pressure vessel, likely used to transport laboratory gases or emergency oxygen. The unusually thin construction suggests it was intended for a single use. Its crushed condition is consistent with archaeological evidence of widespread atmospheric instability.",
    specimenId: "SPEC-3026-02",
    provenance: "Tripo v3.1 Task bcf2bf0e-eac7-4488-b2f3-ff4ea73a7171"
  },
  {
    id: "tablet",
    name: "Glass Slab Tablet",
    file: "/assets/tablet_v1.glb",
    scale: 0.95,
    pitOffset: [0, -0.05, 0],
    fieldNote:
      "A portable mineral-glass writing tablet used by administrative workers. No visible writing survives, suggesting the surface was cleared after each transaction. Its remarkably smooth face may indicate that 2020s bureaucracy had already abandoned paper.",
    specimenId: "SPEC-3026-03",
    provenance: "Tripo v3.1 Task c56073a6-c5fd-4f66-bc1d-9afd01d53cf6"
  },
  {
    id: "remote",
    name: "TV Remote",
    file: "/assets/remote_v1.glb",
    scale: 0.95,
    pitOffset: [0, -0.05, 0],
    fieldNote:
      "A compact command instrument for controlling domestic machinery from a distance. The numerous raised symbols indicate that households of this period operated unusually complex environments. Its small size suggests it was carried continuously by senior members of the family.",
    specimenId: "SPEC-3026-04",
    provenance: "Tripo v3.1 Task 2da76341-a08e-402a-b967-d3003ee9320e"
  },
  {
    id: "controller",
    name: "Game Controller",
    file: "/assets/controller_v1.glb",
    scale: 0.95,
    pitOffset: [0, -0.05, 0],
    fieldNote:
      "A hand-operated control interface, probably used to direct small domestic robots. The symmetrical arrangement of switches suggests coordinated movement rather than entertainment. Evidence of repeated thumb contact indicates that these machines required considerable manual supervision.",
    specimenId: "SPEC-3026-05",
    provenance: "Tripo v3.1 Task bf6491ba-40af-42ca-aec8-fcf2aac19173"
  }
];

/**
 * Safely parses the sealed message from the URL fragment (e.g. #message=... or #...).
 * Always returns a clean string. Treats input as untrusted.
 * Falls back to DEFAULT_SEALED_MESSAGE if absent or empty.
 */
export function getSealedMessageFromURL() {
  try {
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) {
      return DEFAULT_SEALED_MESSAGE;
    }
    const rawContent = hash.slice(1);

    // Support #message=...
    if (rawContent.startsWith('message=')) {
      const encoded = rawContent.slice('message='.length);
      const decoded = decodeURIComponent(encoded.replace(/\+/g, ' '));
      return decoded.trim() || DEFAULT_SEALED_MESSAGE;
    }

    // Support URLSearchParams format #key=val&message=...
    const params = new URLSearchParams(rawContent);
    const msg = params.get('message');
    if (msg && msg.trim()) {
      return msg.trim();
    }

    // Support raw unkeyed hash #Hello%20Future
    if (!rawContent.includes('=')) {
      const decoded = decodeURIComponent(rawContent.replace(/\+/g, ' '));
      return decoded.trim() || DEFAULT_SEALED_MESSAGE;
    }

    return DEFAULT_SEALED_MESSAGE;
  } catch (err) {
    console.warn('[RelicDig] Failed to decode URL fragment, falling back to default:', err);
    return DEFAULT_SEALED_MESSAGE;
  }
}
