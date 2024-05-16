import { AudioCard, AudioContextProvider, Rows } from "@canva/app-ui-kit";
import { upload } from "@canva/asset";
import { addAudioTrack, ui } from "@canva/design";
import React from "react";
import styles from "styles/components.css";

export function App() {
  async function handleClick() {
    const audioAsset = await upload({
      type: "AUDIO",
      title: "Example audio",
      mimeType: "audio/mp3",
      durationMs: 86047,
      url: "https://www.canva.dev/example-assets/audio-import/audio.mp3",
    });

    addAudioTrack({
      ref: audioAsset.ref,
    });
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>) {
    ui.startDrag(event, {
      type: "AUDIO",
      title: "Example audio",
      durationMs: 86047,
      resolveAudioRef: () => {
        return upload({
          type: "AUDIO",
          title: "Example audio",
          mimeType: "audio/mp3",
          durationMs: 86047,
          url: "https://www.canva.dev/example-assets/audio-import/audio.mp3",
        });
      },
    });
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
        {/* A single `AudioContextProvider` component must be an ancestor to all `AudioCard` components*/}
        <AudioContextProvider>
          <AudioCard
            title="Example audio"
            audioPreviewUrl="https://www.canva.dev/example-assets/audio-import/audio.mp3"
            durationInSeconds={86}
            onClick={handleClick}
            onDragStart={handleDragStart}
          />
        </AudioContextProvider>
      </Rows>
    </div>
  );
}