import { useState, useCallback, useRef, useEffect } from "react";
import { AbsoluteFill } from "remotion";

// PUBLIC_INTERFACE
/**
 * Main container for the CountDownCraft app.
 * - Editor for countdown duration, text, fonts, and colors
 * - Live Remotion preview
 * - Export as MP4
 * - Responsive layout
 */
const COLOR_PRIMARY = "#040490";
const COLOR_SECONDARY = "#0ec45c";
const COLOR_ACCENT = "#c71f3b";
const LIGHT_BG = "#f9f9fa";
const DARK_TEXT = "#101042";

const FONTS = [
  { label: "Sans (Default)", value: "SF Pro Text, Helvetica, Arial, sans-serif" },
  { label: "Serif", value: "Merriweather, Georgia, serif" },
  { label: "Mono", value: "Menlo, Monaco, monospace" }
];

// Simple countdown live preview component with play/stop
type CountdownLivePreviewProps = {
  duration: number;
  text: string;
  fontFamily: string;
  textColor: string;
  bgColor: string;
};

// PUBLIC_INTERFACE
/**
 * CountdownLivePreview - shows a user-controlled countdown with a Play/Stop button.
 * Handles timer logic for demo purposes; the Remotion preview remains static.
 */
/* eslint-disable no-undef */
const CountdownLivePreview = ({
  duration,
  text,
  fontFamily,
  textColor,
  bgColor,
}: CountdownLivePreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(duration);

  // Restart the display when the duration setting changes
  useEffect(() => {
    setCurrent(duration);
    setIsPlaying(false);
  }, [duration]);

  // Timer ref so interval is cleared on unmount or stop
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Robust timer management (React-friendly, avoids stale closure)
  useEffect(() => {
    if (isPlaying && current > 0) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => {
          if (prev > 1) {
            return prev - 1;
          }
          // Stop at zero
          setIsPlaying(false);
          return 0;
        });
      }, 1000);
    }
    // Cleanup interval on stop
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, current]);

  // (Re-)start the countdown
  const handlePlay = () => {
    setCurrent(duration);
    setIsPlaying(true);
  };

  // Stop the countdown
  const handleStop = () => {
    setIsPlaying(false);
  };

  const timeString = String(current).padStart(2, "0");

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bgColor,
        height: "100%",
        width: "100%",
        borderRadius: 24,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        position: "relative"
      }}
    >
      <div style={{
        fontFamily,
        fontWeight: 700,
        color: textColor,
        fontSize: "min(8vw, 4rem)",
        marginBottom: 24,
        textAlign: "center"
      }}>
        {text}
      </div>
      <div style={{
        fontFamily: "monospace",
        fontSize: "min(14vw,7rem)",
        color: COLOR_PRIMARY,
        fontWeight: "bold",
        letterSpacing: 2
      }}>
        {timeString}
      </div>
      {/* Play/Stop controls */}
      <div style={{ marginTop: 22 }}>
        {!isPlaying && (
          <button
            onClick={handlePlay}
            style={{
              background: COLOR_SECONDARY,
              color: "#fff",
              border: "none",
              borderRadius: 100,
              padding: "12px 36px",
              fontWeight: "bold",
              fontSize: 22,
              fontFamily: "inherit",
              marginRight: 12,
              cursor: "pointer",
              outline: "none",
              boxShadow: isPlaying ? "0 2px 8px 0 #0ec45c55" : undefined
            }}
            aria-label={current === 0 ? "Restart Countdown" : "Play Countdown"}
            type="button"
          >
            {current === 0 ? "Restart" : "Play"}
          </button>
        )}
        {isPlaying && (
          <button
            onClick={handleStop}
            style={{
              background: COLOR_ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: 100,
              padding: "12px 36px",
              fontWeight: "bold",
              fontSize: 22,
              fontFamily: "inherit",
              marginLeft: 12,
              cursor: "pointer",
              outline: "none",
              boxShadow: "0 2px 8px 0 #c71f3b44"
            }}
            aria-label="Stop Countdown"
            type="button"
          >
            Stop
          </button>
        )}
      </div>
    </AbsoluteFill>
  );
};

const defaultEditorState = {
  duration: 10,
  text: "Get ready!",
  fontFamily: FONTS[0].value,
  textColor: COLOR_PRIMARY,
  bgColor: "#ffffff"
};

// PUBLIC_INTERFACE
export const CountDownCraftContainer = () => {
  const [editor, setEditor] = useState(defaultEditorState);
  const [showDrawer, setShowDrawer] = useState(false);
  // Instead of boolean/string, use a state object for explicit status
  const [exporting, setExporting] = useState<null | "starting" | "rendering">(null);

  // Static mobile detection stub; always false in SSR/build for Remotion safety.
  // In real SPA/CSR, replace with a custom hook using window.matchMedia or screen width.
  const isMobile = false;

  // PUBLIC_INTERFACE
  const handleEditorChange =
    (prop: keyof typeof defaultEditorState) =>
    (e: React.ChangeEvent<any>) => {
      const value = e.target.type === "color" ? e.target.value : e.target.value;
      setEditor((prev) => ({
        ...prev,
        [prop]: value
      }));
    };

  // PUBLIC_INTERFACE
  const handleExport = useCallback(async () => {
    setExporting("starting");

    // Is Remotion's browser rendering API available?
    // @ts-ignore
    const isRemotionBrowserAvailable = typeof window !== "undefined" && window.remotion_renderMedia;
    if (!isRemotionBrowserAvailable) {
      alert("Remotion browser rendering is only supported in a local browser preview.\n" +
        "In CI/build, use the CLI to render. (See README)");
      setExporting(null);
      return;
    }

    try {
      // Dynamically import Remotion's renderMedia API for client-side browser export
      // @ts-ignore
      const { renderMedia } = window.remotion_renderMedia ?? (await import("remotion"));
      if (typeof renderMedia !== "function") throw new Error("Remotion renderMedia() not available");

      // Prepare settings for the export
      const compositionId = "CountdownVideo";
      const fps = 30;
      const durationInFrames = Number(editor.duration) * fps;
      const width = 1280;
      const height = 720;

      // Build input props for Remotion composition
      const inputProps = {
        duration: Number(editor.duration),
        text: editor.text,
        fontFamily: editor.fontFamily,
        textColor: editor.textColor,
        bgColor: editor.bgColor
      };

      // Show progress (Ready for download after animation)
      setExporting("rendering");

      // Render in browser: Remotion browser APIs will prompt to download the result
      // https://www.remotion.dev/docs/player/render-media
      await renderMedia({
        composition: {
          id: compositionId,
          component: undefined, // not needed in browser API
          durationInFrames,
          fps,
          width,
          height,
          props: inputProps
        },
        codec: "h264",
        audioCodec: "aac",
        defaultProps: inputProps,
        downloadFileName: `countdown-${Date.now()}.mp4`,
        onProgress: (_progress: number) => {
          // Optionally provide progress UI
        }
      });

      setExporting(null);
    } catch (err) {
      alert(
        "Export failed: " +
          ((err && (err as any).message) || err || "Unknown error") +
          "\n\nTry using the CLI for video export if this error persists."
      );
      setExporting(null);
    }
  }, [editor]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: "100vh",
        background: LIGHT_BG,
        fontFamily: editor.fontFamily
      }}
    >
      {/* Editor Panel / Drawer */}
      <div
        style={{
          width: isMobile ? "100%" : 340,
          minWidth: isMobile ? undefined : 260,
          background: "#fff",
          borderRight: isMobile ? undefined : `1px solid #ececf1`,
          padding: "32px 24px",
          position: isMobile ? "fixed" : "relative",
          top: 0,
          left: 0,
          zIndex: 2,
          height: isMobile ? "100vh" : "100%",
          boxShadow: isMobile && showDrawer ? "0 4px 16px rgba(0,0,0,0.08)" : undefined,
          transform: isMobile && !showDrawer ? "translateY(-100%)" : undefined,
          transition: "all 0.3s"
        }}
        aria-label="Countdown editor panel"
        hidden={isMobile && !showDrawer}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            color: COLOR_PRIMARY,
            margin: 0
          }}>Countdown Editor</h2>
          {isMobile && (
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: COLOR_PRIMARY
              }}
              aria-label="Close drawer"
              onClick={() => setShowDrawer(false)}
            >×</button>
          )}
        </div>
        <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <label>
            <span style={labelStyle}>Countdown Duration (sec)</span>
            <input
              type="number"
              min={1}
              max={600}
              value={editor.duration}
              style={inputStyle}
              onChange={handleEditorChange("duration")}
            />
          </label>
          <label>
            <span style={labelStyle}>Display Text</span>
            <input
              type="text"
              maxLength={40}
              value={editor.text}
              style={inputStyle}
              onChange={handleEditorChange("text")}
            />
          </label>
          <label>
            <span style={labelStyle}>Font</span>
            <select
              value={editor.fontFamily}
              style={inputStyle}
              onChange={handleEditorChange("fontFamily")}
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>Text Color</span>
            <input
              type="color"
              value={editor.textColor}
              style={{ ...inputStyle, padding: 0, width: 40, height: 32, border: "none" }}
              onChange={handleEditorChange("textColor")}
            />
          </label>
          <label>
            <span style={labelStyle}>Background Color</span>
            <input
              type="color"
              value={editor.bgColor}
              style={{ ...inputStyle, padding: 0, width: 40, height: 32, border: "none" }}
              onChange={handleEditorChange("bgColor")}
            />
          </label>
        </form>
        <div style={{ marginTop: 32 }}>
          <button
            disabled={exporting !== null}
            onClick={handleExport}
            style={{
              background: COLOR_SECONDARY,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "16px 0",
              width: "100%",
              fontWeight: "bold",
              fontSize: 18,
              boxShadow: `0 2px 8px 0 ${COLOR_SECONDARY}30`,
              cursor: "pointer",
              marginBottom: 8,
              transition: "background .2s"
            }}
            aria-label="Export video"
            type="button"
          >
            {exporting === "rendering"
              ? "Rendering MP4..."
              : exporting === "starting"
              ? "Exporting..."
              : "Export as MP4"}
          </button>
        </div>
        {exporting !== null && (
          <div style={{
            color: COLOR_ACCENT,
            marginTop: 10,
            textAlign: "center",
            fontWeight: 500,
            fontSize: 16
          }}>
            {exporting === "rendering"
              ? "Rendering video in browser. This may take a while. You'll get a download when done."
              : "Export started..."}
          </div>
        )}
        <footer style={{
          fontSize: 12, color: "#a0a4de", marginTop: 18, textAlign: "center"
        }}>
          CountDownCraft • Powered by Remotion
        </footer>
      </div>
      {/* Backdrop for mobile drawer */}
      {isMobile && showDrawer && (
        <div
          style={{
            position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.09)", zIndex: 1
          }}
          onClick={() => setShowDrawer(false)}
        />
      )}
      {/* Preview Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          position: "relative"
        }}
      >
        <div
          style={{
            width: "min(90vw, 700px)",
            maxWidth: "100vw",
            height: isMobile ? "48vw" : "35vw",
            minHeight: 320,
            margin: isMobile ? "90px auto 24px" : "48px auto",
            background: "#fff",
            boxShadow: "0 0 14px 0 rgba(4,4,144,0.06)",
            borderRadius: 26,
            position: "relative"
          }}
        >
          {/* Live Preview */}
          <CountdownLivePreview
            duration={Number(editor.duration)}
            text={editor.text}
            fontFamily={editor.fontFamily}
            textColor={editor.textColor}
            bgColor={editor.bgColor}
          />
        </div>
        {/* Show FAB for opening settings drawer on mobile */}
        {isMobile && !showDrawer && (
          <button
            onClick={() => setShowDrawer(true)}
            aria-label="Open editor"
            style={{
              position: "fixed",
              right: 20,
              bottom: 30,
              background: COLOR_ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 60,
              height: 60,
              fontSize: "2rem",
              boxShadow: `0 2px 12px 0 ${COLOR_ACCENT}32`,
              cursor: "pointer",
              zIndex: 3
            }}
            type="button"
          >☰</button>
        )}
      </div>
    </div>
  );
};

// Common styles
const labelStyle = {
  color: COLOR_PRIMARY,
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 3,
  display: "block"
};
const inputStyle = {
  fontSize: 16,
  width: "100%",
  padding: "8px 10px",
  marginTop: 4,
  border: "1px solid #d1d6ff",
  borderRadius: 5,
  background: "#fcfcfe",
  color: DARK_TEXT,
  fontFamily: "inherit"
};
