import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CameraComponent from "../components/CameraComponent";

const App: React.FC = () => {
  const handlePhotoUploaded = (response: any): void => {
    console.log("Фото успешно загружено:", response);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraComponent
        onPhotoUploaded={handlePhotoUploaded}
        serverUrl="http://192.168.0.15:3000/upload"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});

export default App;
