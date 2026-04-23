import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  Pressable, Animated, LayoutChangeEvent,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { extractPlateFromOcr } from '../utils/ocrParser';

let TextRecognition: any = null;
try { TextRecognition = require('@react-native-ml-kit/text-recognition').default; } catch {}

// Frame dimensions as fractions of the container — no pixel math needed
const FRAME_W_RATIO = 0.78;
const FRAME_ASPECT  = 0.42; // height = width * 0.42  (licence-plate shape)

interface Props {
  onPlateDetected: (plate: string) => void;
  onClose: () => void;
}

export default function CameraScanner({ onPlateDetected, onClose }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState('Aim at the licence plate');

  // Actual measured container size — set via onLayout
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const frameW = containerSize.width  * FRAME_W_RATIO;
  const frameH = frameW * FRAME_ASPECT;
  const frameLeft = (containerSize.width  - frameW) / 2;
  const frameTop  = (containerSize.height - frameH) / 2;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  // Animated scan line
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (scanning && frameH > 0) {
      scanAnim.setValue(0);
      scanLoop.current = Animated.loop(
        Animated.timing(scanAnim, {
          toValue: frameH - 4,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      scanLoop.current.start();
    } else {
      scanLoop.current?.stop();
      scanAnim.setValue(0);
    }
    return () => { scanLoop.current?.stop(); };
  }, [scanning, frameH]);

  const capture = useCallback(async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    setHint('Reading plate…');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, base64: false });
      if (!photo) throw new Error('No photo captured');

      if (!TextRecognition) throw new Error('OCR not available — use a dev build.');

      // Compute frame region in photo pixels (15% margin so we don't clip edges)
      const photoW = photo.width  ?? containerSize.width;
      const photoH = photo.height ?? containerSize.height;
      const scaleX = photoW / containerSize.width;
      const scaleY = photoH / containerSize.height;
      const margin  = 0.15;
      const cropX   = Math.max(0, Math.round((frameLeft - frameW * margin) * scaleX));
      const cropY   = Math.max(0, Math.round((frameTop  - frameH * margin) * scaleY));
      const cropW   = Math.min(photoW - cropX, Math.round(frameW * (1 + margin * 2) * scaleX));
      const cropH   = Math.min(photoH - cropY, Math.round(frameH * (1 + margin * 2) * scaleY));

      // Try to crop to the frame region before OCR — fall back to full photo if unavailable
      let ocrUri = photo.uri;
      if (cropW > 10 && cropH > 10) {
        try {
          const cropped = await manipulateAsync(
            photo.uri,
            [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
            { compress: 1, format: SaveFormat.JPEG },
          );
          ocrUri = cropped.uri;
        } catch { /* native module not in this build — use full photo */ }
      }

      const result = await TextRecognition.recognize(ocrUri);

      // Sort blocks largest-first
      const blockArea = (b: any) => {
        const f = b.frame ?? b.boundingBox;
        return f ? (f.width ?? 0) * (f.height ?? 0) : 0;
      };
      const sortedBlocks: any[] = [...result.blocks].sort((a, b) => blockArea(b) - blockArea(a));

      // If we ran on the full photo (crop failed), filter blocks to the frame region
      const activeBlocks = ocrUri === photo.uri
        ? (() => {
            const fLeft   = cropX;
            const fRight  = cropX + cropW;
            const fTop    = cropY;
            const fBottom = cropY + cropH;
            const filtered = sortedBlocks.filter((block: any) => {
              const f = block.frame ?? block.boundingBox;
              if (!f) return true;
              const cx = (f.left ?? f.x ?? 0) + (f.width ?? 0) / 2;
              const cy = (f.top  ?? f.y ?? 0) + (f.height ?? 0) / 2;
              return cx >= fLeft && cx <= fRight && cy >= fTop && cy <= fBottom;
            });
            return filtered.length > 0 ? filtered : sortedBlocks;
          })()
        : sortedBlocks;

      const textChunks: string[] = [];
      for (const block of activeBlocks) {
        textChunks.push(block.text);
        if (block.lines) {
          for (const line of block.lines) textChunks.push(line.text);
        }
      }

      const plate = extractPlateFromOcr(
        textChunks.length > 0 ? textChunks : result.blocks.map((b: any) => b.text),
      );

      if (plate) {
        onPlateDetected(plate);
      } else {
        setHint('No plate found — try again');
        setScanning(false);
      }
    } catch (err: any) {
      setHint(err?.message ?? 'Scan failed — try again');
      setScanning(false);
    }
  }, [scanning, onPlateDetected, containerSize, frameLeft, frameTop, frameW, frameH]);

  // --- Permission loading ---
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2D6DB5" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: '#F5F8FC', gap: 20 }]}>
        <Ionicons name="camera-outline" size={56} color="#2D6DB5" />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSubtitle}>Allow camera access to scan licence plates</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const cornerColor = scanning ? '#28A745' : '#FFFFFF';
  const cornerShadow = scanning ? {
    shadowColor: '#28A745', shadowOpacity: 0.7, shadowRadius: 16, elevation: 8,
  } : {};

  return (
    <View style={styles.root} onLayout={onLayout}>
      {/* Camera fills entire background */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={'back' as CameraType} />

      {containerSize.width > 0 && (
        <>
          {/* ── 4-panel dark overlay ── */}
          {/* Top */}
          <View style={[styles.panel, { top: 0, left: 0, right: 0, height: frameTop }]} />
          {/* Bottom */}
          <View style={[styles.panel, { top: frameTop + frameH, left: 0, right: 0, bottom: 0 }]} />
          {/* Left */}
          <View style={[styles.panel, { top: frameTop, left: 0, width: frameLeft, height: frameH }]} />
          {/* Right */}
          <View style={[styles.panel, { top: frameTop, right: 0, width: frameLeft, height: frameH }]} />

          {/* ── Frame corners + scan line ── */}
          <View style={{
            position: 'absolute',
            top: frameTop,
            left: frameLeft,
            width: frameW,
            height: frameH,
          }}>
            {/* Top-left */}
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }, { borderColor: cornerColor }, cornerShadow]} />
            {/* Top-right */}
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }, { borderColor: cornerColor }, cornerShadow]} />
            {/* Bottom-left */}
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }, { borderColor: cornerColor }, cornerShadow]} />
            {/* Bottom-right */}
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }, { borderColor: cornerColor }, cornerShadow]} />

            {scanning && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanAnim }] }]} />
            )}
          </View>
        </>
      )}

      {/* ── Top chrome ── */}
      <View style={styles.topChrome}>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.closeBorder} />
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.statusPill}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.statusPillBorder} />
          <View style={styles.statusPillInner}>
            <Ionicons name="sparkles" size={12} color="#5BA4E6" />
            <Text style={styles.statusPillText}>OCR on-device</Text>
          </View>
        </View>
      </View>

      {/* ── Hint pill ── */}
      {containerSize.height > 0 && (
        <View style={[styles.hintContainer, { top: frameTop + frameH + 20 }]}>
          <View style={styles.hintPill}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.hintPillBorder} />
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        </View>
      )}

      {/* ── Shutter ── */}
      <View style={styles.shutterContainer}>
        <Pressable
          style={[styles.shutterBtn, { backgroundColor: scanning ? '#28A745' : '#2D6DB5' }]}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permTitle: {
    fontSize: 18, fontWeight: '700', color: '#1A1A2E', textAlign: 'center',
  },
  permSubtitle: {
    fontSize: 14, color: '#6B7A90', textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#2D6DB5', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 999,
  },
  permBtnText: {
    fontSize: 15, fontWeight: '700', color: '#FFFFFF',
  },
  panel: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 4,
  },
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
    width: 44, height: 44, borderRadius: 22,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  closeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusPill: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, overflow: 'hidden',
  },
  statusPillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statusPillInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  statusPillText: {
    fontSize: 12, fontWeight: '600', color: '#FFFFFF',
  },
  hintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintPill: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, overflow: 'hidden',
  },
  hintPillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  hintText: {
    fontSize: 13, fontWeight: '600', color: '#FFFFFF',
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterBtn: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
});
