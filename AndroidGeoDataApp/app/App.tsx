import React from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
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
        serverUrl="https://your-server.com/api/upload"
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
