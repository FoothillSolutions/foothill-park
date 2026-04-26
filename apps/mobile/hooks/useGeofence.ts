import { useEffect } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { GEOFENCE_TASK } from '../tasks/geofenceTask';

const GATE_REGION: Location.LocationRegion = {
  identifier: 'fts-gate',
  latitude: 32.217657,
  longitude: 35.269797,
  radius: 60,
  notifyOnEnter: true,
  notifyOnExit: false,
};

export function useGeofence() {
  useEffect(() => {
    setup();
  }, []);
}

async function setup() {
  try {
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    if (notifStatus !== 'granted') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return;

    let bgGranted = false;
    try {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      bgGranted = bgStatus === 'granted';
    } catch {
      bgGranted = false;
    }
    if (!bgGranted) return;

    const already = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (!already) {
      await Location.startGeofencingAsync(GEOFENCE_TASK, [GATE_REGION]);
    }
  } catch {}
}
