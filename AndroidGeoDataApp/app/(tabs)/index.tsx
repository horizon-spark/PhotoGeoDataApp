import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import Button from "@/components/Button";
import ImageViewer from "@/components/ImageViewer";

import { File, Paths } from "expo-file-system";
import { fetch } from "expo/fetch";

const PlaceholderImage = require("@/assets/images/cat-image.jpg");

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  );

  let pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    } else {
      setSelectedImage(undefined);
      alert("You did not select any image!");
    }
  };

  let sendSelectedImage = async () => {
    const uri = selectedImage === undefined ? "noUri" : selectedImage;
    console.log(uri);
    const photo = new File(Paths.cache, uri);
    let response = await fetch("https://example.com", {
      method: "POST",
      body: photo,
    });
    if (!response.ok) {
      console.log("Upload failed");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer
          imgSource={PlaceholderImage}
          selectedImage={selectedImage}
        />
      </View>
      <View style={styles.footerContainer}>
        <Button
          theme="primary"
          label="Choose a photo"
          onPress={pickImageAsync}
        />
        <Button
          theme="primary"
          label="Send to server"
          onPress={sendSelectedImage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#fff",
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },
});
