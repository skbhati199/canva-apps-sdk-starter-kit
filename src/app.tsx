import { Button, Rows, Text, VideoCard } from "@canva/app-ui-kit";
import { addNativeElement, addPage } from "@canva/design";
import * as React from "react";
import styles from "styles/components.css";

export const App = () => {
  const ref = "ref"
  const onClick = () => {
    addNativeElement({
      type: "TEXT",
      children: ["Hello world!"],
    });

    
  };

 

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          To make changes to this app, edit the <code>src/app.tsx</code> file,
          then close and reopen the app in the editor to preview the changes.
        </Text>
        <Button variant="primary" onClick={onClick} stretch>
          Do something cool
        </Button>
        <Button variant="secondary" onClick={onClick}>Secondary</Button>
      </Rows>
    </div>
  );
};
