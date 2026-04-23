import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle, Platform } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}

export function Skeleton({ width = '100%', height = 14, radius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 1, 0.55],
  });

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E4ECF7', overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#D6E4F5',
          opacity,
        }}
      />
    </View>
  );
}

export function EmployeeCardSkeleton() {
  return (
    <View style={cardStyles.card}>
      <Skeleton width={46} height={46} radius={23} />
      <View style={cardStyles.info}>
        <Skeleton width={'60%'} height={14} radius={6} />
        <View style={cardStyles.metaRow}>
          <Skeleton width={70} height={16} radius={6} />
          <Skeleton width={54} height={16} radius={6} />
        </View>
      </View>
      <Skeleton width={68} height={26} radius={999} />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D6E4F5',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
});
