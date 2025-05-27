import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// PUBLIC_INTERFACE
/**
 * CountdownVideo - Remotion component for exporting countdown animation as MP4.
 * Props match the main editor's customizable options.
 */
type CountdownVideoProps = {
  duration: number;     // in seconds
  text: string;
  fontFamily: string;
  textColor: string;
  bgColor: string;
};

export const CountdownVideo: React.FC<CountdownVideoProps> = ({
  duration,
  text,
  fontFamily,
  textColor,
  bgColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animation: countdown shown as integer, 1 per second
  const timeRemaining = Math.max(0, duration - Math.floor(frame / fps));
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.5, durationInFrames],
    [1, 0],
    { extrapolateRight: "clamp" }
  );
  const fadeIn = interpolate(
    frame,
    [0, fps * 0.2],
    [0, 1],
    { extrapolateLeft: "clamp" }
  );

  const showAnim = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        borderRadius: 24,
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily,
          color: textColor,
          fontWeight: 700,
          fontSize: "min(8vw,4rem)",
          marginBottom: 30,
          textAlign: "center",
          opacity: showAnim,
          transition: "opacity 0.2s"
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "min(14vw,7rem)",
          color: "#040490",
          letterSpacing: 2,
          opacity: showAnim,
          transition: "opacity 0.2s"
        }}
      >
        {String(timeRemaining).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
};
