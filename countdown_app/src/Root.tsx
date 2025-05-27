import { Composition } from "remotion";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
import { CountDownCraftContainer } from "./CountDownCraftContainer";
import { z } from "zod";
import { CountdownVideo } from "./CountdownVideo";

/**
 * Schema for custom countdown composition.
 * - Matches the CountdownVideo props shape for parameterized rendering.
 */
export const countdownCompSchema = z.object({
  duration: z.number().min(1).max(600),
  text: z.string().max(40),
  fontFamily: z.string(),
  textColor: z.string(),
  bgColor: z.string(),
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main CountDownCraft app */}
      <CountDownCraftContainer />

      <Composition
        // You can take the "id" to render a video:
        // npx remotion render src/index.ts <id> out/video.mp4
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Main custom countdown video export composition */}
      <Composition
        id="CountdownVideo"
        component={CountdownVideo}
        durationInFrames={150} // Default, will be overridden by props
        fps={30}
        width={1280}
        height={720}
        schema={countdownCompSchema}
        defaultProps={{
          duration: 10,
          text: "Get ready!",
          fontFamily: "SF Pro Text, Helvetica, Arial, sans-serif",
          textColor: "#040490",
          bgColor: "#ffffff",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91dAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />
    </>
  );
};
