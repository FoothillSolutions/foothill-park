import { View, Text, Platform, StyleSheet } from 'react-native';

const PLATE_BG = '#EDEDE0';
const PLATE_INK = '#1F5E3A';
const STRIP_GREEN = '#2F7A48';
const STRIP_TEXT = '#F3F2E3';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface SizeDef {
  width: number;
  height: number;
  fontSize: number;
  stripWidth: number;
  stripFontSize: number;
}

const SIZE_MAP: Record<Size, SizeDef> = {
  sm: { width: 180, height: 52,  fontSize: 22, stripWidth: 24, stripFontSize: 10 },
  md: { width: 240, height: 68,  fontSize: 28, stripWidth: 32, stripFontSize: 13 },
  lg: { width: 280, height: 78,  fontSize: 34, stripWidth: 38, stripFontSize: 15 },
  xl: { width: 320, height: 90,  fontSize: 40, stripWidth: 42, stripFontSize: 17 },
};

function parsePlateParts(plate: string): string[] {
  const match = plate.match(/^([A-Z0-9]{1,2})[\s-]*([A-Z0-9]{2,5})[\s-]*([A-Z0-9]{1,3})$/i);
  if (match) {
    return [match[1], match[2], match[3]];
  }
  const parts = plate.split(/[\s-]+/).filter(Boolean);
  return parts.length > 0 ? parts : [plate];
}

export function PlateDisplay({ plate = '7-0339-96', size = 'md' }: { plate?: string; size?: Size }) {
  const s = SIZE_MAP[size];
  const parts = parsePlateParts(plate.toUpperCase());
  const separatorWidth = Math.max(6, s.fontSize * 0.3);
  const monoFamily = Platform.select({ ios: 'Courier New', android: 'monospace' });
  const highlightHeight = Math.round(s.height * 0.35);

  return (
    <View
      style={[
        styles.plate,
        {
          width: s.width,
          height: s.height,
          borderRadius: 8,
        },
      ]}
    >
      {/* Left area — plate number */}
      <View style={styles.leftArea}>
        {parts.map((part, i) => (
          <View key={i} style={styles.partRow}>
            {i > 0 && (
              <View
                style={{
                  width: separatorWidth,
                  height: 3,
                  backgroundColor: PLATE_INK,
                  borderRadius: 1,
                  marginHorizontal: 2,
                }}
              />
            )}
            <Text
              style={{
                fontSize: s.fontSize,
                fontWeight: '800',
                color: PLATE_INK,
                letterSpacing: 1,
                fontFamily: monoFamily,
              }}
              numberOfLines={1}
            >
              {part}
            </Text>
          </View>
        ))}
      </View>

      {/* Right panel */}
      <View
        style={[
          styles.strip,
          {
            width: s.stripWidth,
            borderLeftWidth: 2,
            borderLeftColor: PLATE_INK,
            backgroundColor: STRIP_GREEN,
          },
        ]}
      >
        <Text
          style={{
            fontSize: s.stripFontSize + 2,
            fontWeight: '700',
            color: STRIP_TEXT,
            lineHeight: s.stripFontSize + 6,
          }}
        >
          ف
        </Text>
        <Text
          style={{
            fontSize: s.stripFontSize - 1,
            fontWeight: '700',
            color: STRIP_TEXT,
            lineHeight: s.stripFontSize + 2,
          }}
        >
          P
        </Text>
      </View>

      {/* Inset highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: highlightHeight,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: PLATE_INK,
    backgroundColor: PLATE_BG,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  leftArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexWrap: 'nowrap',
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
