"use client";

import * as React from "react";
import { AlertTriangle, Camera, ImagePlus, Images, RefreshCw, SwitchCamera, Zap, ZapOff } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_PAGES } from "./types";

type CameraState = "idle" | "starting" | "active" | "unavailable";

/** lib.dom only declares `torch` on MediaTrackSettings – extend the other two shapes locally. */
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraintSet = MediaTrackConstraintSet & { torch?: boolean };

export interface CameraCaptureProps {
  /** Pages already captured – used for the counter and the max-pages guard. */
  pageCount: number;
  /** Disables capture while the receipt is being saved. */
  disabled?: boolean;
  onCapture: (file: File) => void;
  /** Files chosen through the fallback input when the live camera is unavailable. */
  onFiles: (files: File[]) => void;
  onSwitchToUpload: () => void;
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
  audio: false,
};

function describeCameraError(error: unknown): string {
  const name = typeof error === "object" && error !== null && "name" in error ? String((error as { name?: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Du behöver tillåta kameran i webbläsaren för att fota direkt i appen. Du kan också ta bilden med kameraappen i stället.";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "Vi hittade ingen kamera på den här enheten. Välj en bild eller fil i stället.";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "Kameran verkar användas av en annan app. Stäng den och försök igen.";
    default:
      return "Kameran kunde inte startas. Du kan ta bilden med kameraappen i stället.";
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function captureFileName(index: number): string {
  const d = new Date();
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `kvitto-${date}-${time}-${index}.jpg`;
}

export function CameraCapture({ pageCount, disabled = false, onCapture, onFiles, onSwitchToUpload }: CameraCaptureProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const mountedRef = React.useRef(true);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const [state, setState] = React.useState<CameraState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [torchSupported, setTorchSupported] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);
  const [flashKey, setFlashKey] = React.useState(0);

  const full = pageCount >= MAX_PAGES;
  const canSwitch = devices.length > 1;

  const stopStream = React.useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const attachStream = React.useCallback(
    async (stream: MediaStream) => {
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        // React does not always reflect `muted` as an attribute; iOS needs it set before play().
        video.muted = true;
        video.setAttribute("muted", "");
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // Muted + playsInline video is allowed to autoplay; a rejected play() here is harmless.
        }
      }
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.addEventListener("ended", () => {
          if (!mountedRef.current || streamRef.current !== stream) return;
          stopStream();
          setState("idle");
        });
        // Firefox has no getCapabilities().
        const caps: TorchCapabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
        setTorchSupported(caps.torch === true);
      }
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (mountedRef.current) setDevices(all.filter((d) => d.kind === "videoinput"));
      } catch {
        if (mountedRef.current) setDevices([]);
      }
    },
    [stopStream],
  );

  const start = React.useCallback(
    async (constraints: MediaStreamConstraints): Promise<boolean> => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Din webbläsare kan inte visa kameran direkt i appen. Ta bilden med kameraappen i stället.");
        setState("unavailable");
        return false;
      }
      setState("starting");
      setError(null);
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mountedRef.current) {
          for (const track of stream.getTracks()) track.stop();
          return false;
        }
        await attachStream(stream);
        if (mountedRef.current) setState("active");
        return true;
      } catch (err) {
        if (!mountedRef.current) return false;
        setError(describeCameraError(err));
        setState("unavailable");
        return false;
      }
    },
    [attachStream, stopStream],
  );

  const startCamera = React.useCallback(() => {
    void start(DEFAULT_CONSTRAINTS);
  }, [start]);

  // Stop the camera when the component unmounts (mode switch, navigation).
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStream();
    };
  }, [stopStream]);

  // iOS suspends the stream when the tab is hidden; if it does not come back, offer a restart.
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      if (track.readyState === "ended") {
        stopStream();
        setState("idle");
      } else {
        videoRef.current?.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stopStream]);

  const switchCamera = React.useCallback(async () => {
    if (devices.length < 2) return;
    const currentId = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId;
    const index = devices.findIndex((d) => d.deviceId === currentId);
    const next = devices[(index + 1) % devices.length];
    if (!next || next.deviceId === currentId) return;
    const ok = await start({ video: { deviceId: { exact: next.deviceId }, width: { ideal: 1920 } }, audio: false });
    if (!ok) {
      toast.error("Det gick inte att byta kamera.");
      void start(DEFAULT_CONSTRAINTS);
    }
  }, [devices, start]);

  const toggleTorch = React.useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      const constraint: TorchConstraintSet = { torch: next };
      await track.applyConstraints({ advanced: [constraint] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
      toast.error("Lampan kunde inte tändas på den här enheten.");
    }
  }, [torchOn]);

  const capture = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video || state !== "active" || capturing || disabled || full) return;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) {
      toast.error("Kameran är inte redo än – vänta en sekund och försök igen.");
      return;
    }
    setCapturing(true);
    try {
      // The preview uses object-cover, so crop to exactly what the user sees in the frame.
      const clientWidth = video.clientWidth;
      const clientHeight = video.clientHeight;
      let sx = 0;
      let sy = 0;
      let sw = videoWidth;
      let sh = videoHeight;
      if (clientWidth > 0 && clientHeight > 0) {
        const scale = Math.max(clientWidth / videoWidth, clientHeight / videoHeight);
        sw = Math.min(videoWidth, Math.round(clientWidth / scale));
        sh = Math.min(videoHeight, Math.round(clientHeight / scale));
        sx = Math.round((videoWidth - sw) / 2);
        sy = Math.round((videoHeight - sh) / 2);
      }
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-unavailable");
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("encode-failed");
      if (!reduceMotion) setFlashKey((k) => k + 1);
      if (typeof navigator.vibrate === "function") navigator.vibrate(25);
      onCapture(new File([blob], captureFileName(pageCount + 1), { type: "image/jpeg" }));
    } catch {
      toast.error("Bilden kunde inte tas. Försök igen.");
    } finally {
      if (mountedRef.current) setCapturing(false);
    }
  }, [state, capturing, disabled, full, reduceMotion, onCapture, pageCount]);

  const handleFallbackInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length) onFiles(files);
  };

  const isActive = state === "active";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-ink-950 shadow-card">
        <div className="relative aspect-[3/4] max-h-[62dvh] w-full sm:aspect-[4/3] lg:max-h-[560px]" role="region" aria-label="Kamerasökare">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", isActive ? "opacity-100" : "opacity-0")}
          />

          {isActive ? (
            <>
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute inset-x-[8%] inset-y-[7%] rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(11,13,15,0.35)]">
                  <span className="absolute -left-0.5 -top-0.5 h-7 w-7 rounded-tl-2xl border-l-4 border-t-4 border-brand-300" />
                  <span className="absolute -right-0.5 -top-0.5 h-7 w-7 rounded-tr-2xl border-r-4 border-t-4 border-brand-300" />
                  <span className="absolute -bottom-0.5 -left-0.5 h-7 w-7 rounded-bl-2xl border-b-4 border-l-4 border-brand-300" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-br-2xl border-b-4 border-r-4 border-brand-300" />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-3 flex items-start justify-between gap-2 px-3">
                <p className="rounded-full bg-ink-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">Lägg kvittot på en plan yta i bra ljus</p>
                <p className="shrink-0 rounded-full bg-ink-950/70 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-white backdrop-blur" aria-live="polite">
                  {pageCount}/{MAX_PAGES} <span className="font-normal">sidor</span>
                </p>
              </div>
            </>
          ) : null}

          <AnimatePresence>
            {flashKey > 0 ? (
              <motion.div
                key={flashKey}
                className="pointer-events-none absolute inset-0 bg-white"
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                aria-hidden
              />
            ) : null}
          </AnimatePresence>

          {state === "idle" || state === "starting" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-ink-900 to-ink-950 px-6 text-center text-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600/20 ring-1 ring-brand-400/40">
                <Camera className="h-9 w-9 text-brand-300" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Fota ditt kvitto</h2>
                <p className="mt-1 text-sm text-ink-300">Kameran startar när du trycker på knappen – du bestämmer själv när bilden tas.</p>
              </div>
              <Button type="button" size="lg" onClick={startCamera} loading={state === "starting"} disabled={disabled}>
                {state === "starting" ? null : <Camera className="h-5 w-5" aria-hidden />}
                {state === "starting" ? "Startar kameran…" : "Starta kameran"}
              </Button>
              <button type="button" onClick={onSwitchToUpload} className="text-sm font-medium text-ink-300 underline-offset-4 hover:text-white hover:underline">
                Eller välj bilder och filer
              </button>
            </div>
          ) : null}

          {state === "unavailable" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-ink-950 px-6 py-6 text-center text-white">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                <AlertTriangle className="h-7 w-7 text-amber-300" aria-hidden />
              </div>
              <p role="alert" className="max-w-sm text-sm text-ink-200">
                {error}
              </p>
              <div className="flex w-full max-w-xs flex-col gap-2">
                <Button type="button" size="lg" onClick={() => cameraInputRef.current?.click()} disabled={disabled || full}>
                  <ImagePlus className="h-5 w-5" aria-hidden />
                  Ta bild med kameraappen
                </Button>
                <Button type="button" variant="outline" className="border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20" onClick={onSwitchToUpload}>
                  <Images className="h-5 w-5" aria-hidden />
                  Välj från bilder eller filer
                </Button>
                <button type="button" onClick={startCamera} className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm text-ink-300 hover:text-white">
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Försök starta kameran igen
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {isActive ? (
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex w-16 justify-start">
              {torchSupported ? (
                <button
                  type="button"
                  onClick={() => void toggleTorch()}
                  aria-pressed={torchOn}
                  aria-label={torchOn ? "Släck lampan" : "Tänd lampan"}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                    torchOn ? "bg-amber-400 text-ink-950 hover:bg-amber-300" : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {torchOn ? <Zap className="h-5 w-5" aria-hidden /> : <ZapOff className="h-5 w-5" aria-hidden />}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void capture()}
              disabled={capturing || disabled || full}
              aria-label={full ? `Max ${MAX_PAGES} sidor per kvitto – spara kvittot för att fortsätta` : "Ta bild"}
              className="group relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white/25 ring-2 ring-white/70 transition-transform active:scale-95 disabled:opacity-40"
            >
              <span className="h-[60px] w-[60px] rounded-full bg-white shadow-inner transition-transform group-active:scale-90" aria-hidden />
            </button>

            <div className="flex w-16 justify-end">
              {canSwitch ? (
                <button
                  type="button"
                  onClick={() => void switchCamera()}
                  aria-label="Byt kamera"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <SwitchCamera className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {isActive ? (
        <p className="text-center text-sm text-ink-500">
          {full ? `Du har fotat ${MAX_PAGES} sidor – max för ett kvitto. Spara kvittot för att fortsätta.` : "Tryck på den runda knappen för att ta en bild. Fota gärna varje sida av kvittot."}
        </p>
      ) : null}

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={handleFallbackInput} />
    </div>
  );
}
