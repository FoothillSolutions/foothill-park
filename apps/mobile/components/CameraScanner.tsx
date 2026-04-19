import { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
let TextRecognition: any = null;
try { TextRecognition = require('@react-native-ml-kit/text-recognition').default; } catch {}
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { extractPlateFromOcr } from '../utils/ocrParser';

const { width: SCREEN_W } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_W * 0.78;

interface Props {
  onPlateDetected: (plate: string) => void;
  onClose: () => void;
}

export default function CameraScanner({ onPlateDetected, onClose }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState('Aim at the licence plate');

  const capture = useCallback(async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    setHint('Reading plate…');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      if (!photo) throw new Error('No photo captured');

      if (!TextRecognition) throw new Error('OCR not available in Expo Go — use a dev build.');
      const result = await TextRecognition.recognize(photo.uri);
      const blocks = result.blocks.map((b: { text: string }) => b.text);
      const plate = extractPlateFromOcr(blocks);

      if (plate) {
        onPlateDetected(plate);
      } else {
        setHint('No plate found — try again');
        setScanning(false);
      }
    } catch {
      setHint('Scan failed — try again');
      setScanning(false);
    }
  }, [scanning, onPlateDetected]);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={theme.colors.primary} />
        <Text style={styles.permText}>Camera access is needed to scan plates</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={'back' as CameraType} />

      {/* Dark overlay with transparent cutout */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.frame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Hint text */}
      <View style={styles.hintRow}>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={capture} disabled={scanning}>
          {scanning
            ? <ActivityIndicator color={theme.colors.white} />
            : <Ionicons name="camera" size={28} color={theme.colors.white} />}
        </TouchableOpacity>

        {/* Spacer to balance the close button */}
        <View style={styles.closeBtn} />
      </View>
    </View>
  );
}

const CORNER = 22;
const BORDER = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText: { fontSize: 16, color: theme.colors.dark, textAlign: 'center' },
  permBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: 12,
    paddingHorizontal: 28, borderRadius: theme.radius.full,
  },
  permBtnText: { color: theme.colors.white, fontWeight: '700' },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME_SIZE * 0.42 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE * 0.42 },

  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: theme.colors.white },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },

  hintRow: {
    position: 'absolute', bottom: 140, left: 0, right: 0, alignItems: 'center',
  },
  hint: {
    color: theme.colors.white, fontSize: 14, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: theme.radius.full, overflow: 'hidden',
  },

  controls: {
    position: 'absolute', bottom: 48, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 10,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
});
