import { CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
// import * as MediaLibrary from "expo-media-library";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Типы для пропсов компонента
interface CameraComponentProps {
  onPhotoUploaded?: (response: UploadResponse) => void;
  serverUrl?: string;
}

// Тип для ответа от сервера
interface UploadResponse {
  success: boolean;
  message: string;
  file?: string;
  [key: string]: any;
}

// Тип для состояния фото
interface PhotoState {
  uri: string;
  width?: number;
  height?: number;
}

const CameraComponent: React.FC<CameraComponentProps> = ({
  onPhotoUploaded,
  serverUrl = "http://192.168.56.1:3000/upload",
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  // const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(
  //   null,
  // );
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const cameraRef = useRef<CameraView | null>(null);

  // useEffect(() => {
  //   (async () => {
  //     // Запрашиваем разрешение на доступ к медиатеке
  //     const mediaStatus = await MediaLibrary.requestPermissionsAsync();
  //     setHasMediaPermission(mediaStatus.status === "granted");
  //   })();
  // }, []);

  const takePhoto = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });

        if (photo) {
          // Опционально: сжимаем изображение перед отправкой
          const compressedPhoto = await manipulateAsync(
            photo.uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: SaveFormat.JPEG },
          );

          setPhoto({
            uri: compressedPhoto.uri,
            width: compressedPhoto.width,
            height: compressedPhoto.height,
          });
        }
      } catch (error) {
        Alert.alert(
          "Ошибка",
          "Не удалось сделать фото: " + (error as Error).message,
        );
      }
    }
  };

  const uploadPhoto = async (): Promise<void> => {
    if (!photo) return;

    setIsUploading(true);

    try {
      // Создаем FormData для отправки файла
      const formData = new FormData();

      // Добавляем фото в FormData
      formData.append("filedata", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);

      // Добавляем дополнительные данные если нужно
      formData.append("timestamp", new Date().toISOString());
      formData.append("deviceInfo", "mobile");

      // Отправляем на сервер
      const response = await fetch(serverUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result: UploadResponse = await response.json();

      if (response.ok) {
        Alert.alert("Успешно", "Фото отправлено на сервер");

        // Сохраняем в галерею если есть разрешение
        // if (hasMediaPermission) {
        //   await MediaLibrary.saveToLibraryAsync(photo.uri);
        // }

        // Вызываем callback если передан
        if (onPhotoUploaded) {
          onPhotoUploaded(result);
        }

        // Сбрасываем состояние
        setPhoto(null);
      } else {
        throw new Error(result.message || "Ошибка загрузки");
      }
    } catch (error) {
      Alert.alert(
        "Ошибка",
        "Не удалось отправить фото: " + (error as Error).message,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const retakePhoto = (): void => {
    setPhoto(null);
  };

  const toggleFlash = (): void => {
    setFlash(flash === "off" ? "on" : "off");
  };

  const toggleCameraFacing = (): void => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    // Разрешения еще загружаются
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Запрос разрешения на использование камеры...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Нет доступа к камере
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Нет доступа к камере</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Запросить разрешение</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!photo ? (
        // Режим съемки
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
              activeOpacity={0.7}
            >
              <Text style={styles.controlText}>
                {flash === "on" ? "⚡" : "☀️"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              activeOpacity={0.7}
            >
              <Text style={styles.controlText}>🔄</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        // Режим просмотра фото
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />

          <View style={styles.previewControls}>
            <TouchableOpacity
              style={[styles.previewButton, styles.retakeButton]}
              onPress={retakePhoto}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Повторить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, styles.uploadButton]}
              onPress={uploadPhoto}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Отправить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  controlButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    padding: 10,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: {
    color: "#fff",
    fontSize: 24,
  },
  captureContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  preview: {
    flex: 1,
    resizeMode: "contain",
  },
  previewControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  previewButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  retakeButton: {
    backgroundColor: "#666",
  },
  uploadButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff0000",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  infoText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
  },
});

export default CameraComponent;
