import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Dimensions,
  Pressable, Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { extractPlateFromOcr } from '../utils/ocrParser';

let TextRecognition: any = null;
try { TextRecognition = require('@react-native-ml-kit/text-recognition').default; } catch {}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_W = SCREEN_W * 0.78;
const FRAME_H = FRAME_W * 0.42;
const FRAME_TOP = SCREEN_H / 2 - FRAME_H / 2;
const FRAME_LEFT = (SCREEN_W - FRAME_W) / 2;

interface Props {
  onPlateDetected: (plate: string) => void;
  onClose: () => void;
}

export default function CameraScanner({ onPlateDetected, onClose }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState('Aim at the licence plate');

  // Animated scan line
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (scanning) {
      scanAnim.setValue(0);
      scanLoop.current = Animated.loop(
        Animated.timing(scanAnim, {
          toValue: FRAME_H - 14,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      scanLoop.current.start();
    } else {
      scanLoop.current?.stop();
      scanAnim.setValue(0);
    }
    return () => {
      scanLoop.current?.stop();
    };
  }, [scanning]);

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

  // --- Permission loading state ---
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2D6DB5" />
      </View>
    );
  }

  // --- Permission denied UI ---
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: '#F5F8FC', gap: 20 }]}>
        <Ionicons name="camera-outline" size={56} color="#2D6DB5" />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSubtitle}>
          Allow camera access to scan licence plates
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const cornerBorderColor = scanning ? '#28A745' : '#FFFFFF';
  const cornerShadow = scanning
    ? {
        shadowColor: '#28A745',
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
      }
    : {};

  return (
    <View style={styles.root}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={'back' as CameraType} />

      {/* 4-panel dark overlay */}
      {/* Top panel */}
      <View style={[styles.panel, { top: 0, left: 0, right: 0, height: FRAME_TOP }]} />
      {/* Bottom panel */}
      <View style={[styles.panel, { bottom: 0, left: 0, right: 0, height: FRAME_TOP }]} />
      {/* Left panel */}
      <View
        style={[
          styles.panel,
          {
            top: FRAME_TOP,
            bottom: FRAME_TOP,
            left: 0,
            width: FRAME_LEFT,
          },
        ]}
      />
      {/* Right panel */}
      <View
        style={[
          styles.panel,
          {
            top: FRAME_TOP,
            bottom: FRAME_TOP,
            right: 0,
            width: FRAME_LEFT,
          },
        ]}
      />

      {/* Frame container with corners and scan line */}
      <View
        style={{
          position: 'absolute',
          top: FRAME_TOP,
          left: FRAME_LEFT,
          width: FRAME_W,
          height: FRAME_H,
        }}
      >
        {/* Top-left corner */}
        <View
          style={[
            styles.corner,
            { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
            { borderColor: cornerBorderColor, borderRadius: 4 },
            cornerShadow,
          ]}
        />
        {/* Top-right corner */}
        <View
          style={[
            styles.corner,
            { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
            { borderColor: cornerBorderColor, borderRadius: 4 },
            cornerShadow,
          ]}
        />
        {/* Bottom-left corner */}
        <View
          style={[
            styles.corner,
            { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
            { borderColor: cornerBorderColor, borderRadius: 4 },
            cornerShadow,
          ]}
        />
        {/* Bottom-right corner */}
        <View
          style={[
            styles.corner,
            { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
            { borderColor: cornerBorderColor, borderRadius: 4 },
            cornerShadow,
          ]}
        />

        {/* Animated scan line */}
        {scanning && (
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanAnim }] },
            ]}
          />
        )}
      </View>

      {/* Top chrome */}
      <View style={styles.topChrome}>
        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.closeBorder} />
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        {/* Status pill */}
        <View style={styles.statusPill}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.statusPillBorder} />
          <View style={styles.statusPillInner}>
            <Ionicons name="sparkles" size={12} color="#5BA4E6" />
            <Text style={styles.statusPillText}>OCR on-device</Text>
          </View>
        </View>
      </View>

      {/* Hint pill */}
      <View style={styles.hintContainer}>
        <View style={styles.hintPill}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.hintPillBorder} />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      </View>

      {/* Shutter button */}
      <View style={styles.shutterContainer}>
        <Pressable
          style={[
            styles.shutterBtn,
            { backgroundColor: scanning ? '#28A745' : '#2D6DB5' },
          ]}
          onPress={capture}
          disabled={scanning}
        >
          {scanning
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Ionicons name="camera" size={30} color="#FFFFFF" />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Permission screens
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  permSubtitle: {
    fontSize: 14,
    color: '#6B7A90',
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#2D6DB5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  permBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Dark overlay panels
  panel: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },

  // Animated scan line
  scanLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: 'rgba(40,167,69,0.9)',
    shadowColor: '#28A745',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
  },

  // Top chrome row
  topChrome: {
    position: 'absolute',
    top: 58,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusPillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Hint pill
  hintContainer: {
    position: 'absolute',
    top: FRAME_TOP + FRAME_H + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    overflow: 'hidden',
  },
  hintPillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Shutter button
  shutterContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
});
