// Pure camera lifecycle reducer: idle -> starting -> active -> stopping -> idle,
// with an error state reachable from starting/active. Framework-free so it is
// unit-testable without a browser/DOM (see scannerInput.ts for the same
// convention). The component is responsible for the actual getUserMedia/ZXing
// calls; this module only decides which transitions are legal, so that e.g. a
// repeated click can never start two simultaneous camera streams.

export type CameraState = "idle" | "starting" | "active" | "stopping" | "error";

export type CameraEvent =
  | { type: "START_REQUESTED" }
  | { type: "START_SUCCEEDED" }
  | { type: "START_FAILED"; message: string }
  | { type: "STOP_REQUESTED" }
  | { type: "STOPPED" }
  | { type: "TRACK_ENDED" }
  | { type: "RESET" };

export interface CameraMachineState {
  state: CameraState;
  error: string | null;
}

export const INITIAL_CAMERA_STATE: CameraMachineState = { state: "idle", error: null };

export function cameraReducer(current: CameraMachineState, event: CameraEvent): CameraMachineState {
  switch (event.type) {
    case "START_REQUESTED":
      // Already starting or active: ignore — prevents a double-click (or a
      // stray re-invocation) from launching a second concurrent stream.
      if (current.state === "starting" || current.state === "active") return current;
      return { state: "starting", error: null };

    case "START_SUCCEEDED":
      // Only a start that is still in flight can succeed. If we've since
      // been stopped/reset (e.g. unmounted while the permission prompt was
      // pending), this is a stale resolution and must not resurrect the UI.
      if (current.state !== "starting") return current;
      return { state: "active", error: null };

    case "START_FAILED":
      if (current.state !== "starting") return current;
      return { state: "error", error: event.message };

    case "STOP_REQUESTED":
      if (current.state === "idle" || current.state === "stopping") return current;
      return { state: "stopping", error: null };

    case "STOPPED":
      return { state: "idle", error: null };

    case "TRACK_ENDED":
      // The underlying MediaStreamTrack died on its own (device unplugged,
      // permission revoked mid-stream, OS reclaimed the camera, etc).
      if (current.state !== "active") return current;
      return { state: "error", error: "La caméra a été interrompue." };

    case "RESET":
      return INITIAL_CAMERA_STATE;

    default:
      return current;
  }
}
