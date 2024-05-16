import { Button, Rows } from "@canva/app-ui-kit";
import { getTemporaryUrl, upload } from "@canva/asset";
import { addNativeElement } from "@canva/preview/design";
import { appProcess } from "@canva/platform";
import * as React from "react";
import styles from "styles/components.css";
import { TableWrapper } from "utils/table_wrapper";
import { useOverlay } from "utils/use_overlay_hook";
import { useSelection } from "utils/use_selection_hook";
import { requestExport } from "@canva/design";

export function App() {
  const context = appProcess.current.getInfo();

  if (context.surface === "object_panel") {
    return <ObjectPanel />;
  }

  if (context.surface === "selected_image_overlay") {
    return <SelectedImageOverlay />;
  }

  throw new Error(`Invalid surface: ${context.surface}`);
}

function ObjectPanel() {
  const overlay = useOverlay("image_selection");
  const [isImageReady, setIsImageReady] = React.useState(false);

  React.useEffect(() => {
    // Listen for when the image has been rendered
    appProcess.registerOnMessage((sender, message) => {
      const isImageReady = Boolean(message.isImageReady);
      setIsImageReady(isImageReady);
    });
  }, []);

  function handleOpen() {
    overlay.open();
  }

  function handleInvert() {
    appProcess.broadcastMessage("invert");
  }

  async function handleSave() {
    overlay.close({ reason: "completed" });
  }

  function handleClose() {
    overlay.close({ reason: "aborted" });
  }

  if (overlay.isOpen) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Rows spacing="1u">
            <Button
              variant="primary"
              disabled={!isImageReady}
              onClick={handleInvert}
            >
              Invert
            </Button>
          </Rows>
          <Rows spacing="1u">
            <Button
              variant="primary"
              disabled={!isImageReady}
              onClick={handleSave}
            >
              Save and close
            </Button>
            <Button
              variant="secondary"
              disabled={!isImageReady}
              onClick={handleClose}
            >
              Close without saving
            </Button>
          </Rows>
        </Rows>
      </div>
    );
  }

  async function handleClick() {
    // Add the shape to the design
    await addNativeElement({
      type: "SHAPE",
      paths: [
        {
          d: "M 0 0 H 100 V 100 H 0 L 0 0",
          fill: {
            color: "#ff0099",
          },
        },
      ],
      viewBox: {
        height: 100,
        width: 100,
        left: 0,
        top: 0,
      },
    });
  }

  function handleTableClick() {
    const table = TableWrapper.create(2, 2);
    table.setCellDetails(1, 1, {
      colSpan: 2,
    });
    const cell = table.getCellDetails(1, 1);
    const element = table.toElement();
    
    addNativeElement(element);
  }

  async function exportClick() {
    const result = await requestExport({
      acceptedFileTypes: ["JPG", "PNG"]
    })
    console.log(result)

   
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
      <Button variant="primary" onClick={exportClick}>
          Export
        </Button>
      <Button variant="primary" onClick={handleClick}>
          Add table to design
        </Button>
        <Button  variant="secondary" onClick={handleClick}>Add shape to design</Button>
        <Button
          variant="primary"
          disabled={!overlay.canOpen}
          onClick={handleOpen}
        >
          Edit image
        </Button>
      </Rows>
    </div>
  );
}

function SelectedImageOverlay() {
  const selection = useSelection("image");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const initializeCanvas = async () => {
      // Get the selected image
      const draft = await selection.read();
      const [image] = draft.contents;

      if (!image) {
        return;
      }

      // Download the selected image
      const { url } = await getTemporaryUrl({ type: "IMAGE", ref: image.ref });
      const img = await downloadImage(url);
      const { width, height } = img;

      // Render the selected image
      const { canvas, context } = getCanvas(canvasRef.current);
      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, 0, 0, width, height);

      // Set the `isImageReady` state
      appProcess.broadcastMessage({ isImageReady: true });
    };

    initializeCanvas();
  }, [selection]);

  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      // Invert the colors of the image
      if (message === "invert") {
        const { canvas, context } = getCanvas(canvasRef.current);
        const { width, height } = canvas;
        context.filter = "invert(100%)";
        context.drawImage(canvas, 0, 0, width, height);
      }
    });
  }, []);

  React.useEffect(() => {
    return void appProcess.current.setOnDispose(async (context) => {
      // Save changes to the user's image
      if (context.reason === "completed") {
        // Get the data URL of the image
        const { canvas } = getCanvas(canvasRef.current);
        const dataUrl = canvas.toDataURL();

        // Upload the new image
        const asset = await upload({
          type: "IMAGE",
          mimeType: "image/png",
          url: dataUrl,
          thumbnailUrl: dataUrl,
        });

        // Replace the original image with the new image
        const draft = await selection.read();
        draft.contents[0].ref = asset.ref;
        await draft.save();
      }

      // Reset the `isImageReady` state
      appProcess.broadcastMessage({ isImageReady: false });
    });
  }, [selection]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

async function downloadImage(url: string) {
  const response = await fetch(url, { mode: "cors" });
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("Image could not be loaded"));
    img.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);

  return img;
}

function getCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    throw new Error("HTMLCanvasElement does not exist");
  }

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("CanvasRenderingContext2D does not exist");
  }

  return { canvas, context };
}