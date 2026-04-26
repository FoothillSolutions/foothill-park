import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { GATE_LABEL } from '../constants/config';

export const GEOFENCE_TASK = 'GATE_GEOFENCE_TASK';

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;

  const { eventType } = data as { eventType: Location.GeofencingEventType };

  if (eventType === Location.GeofencingEventType.Enter) {
    Notifications.scheduleNotificationAsync({
      content: {
        title: `${GATE_LABEL} — You've arrived 🚗`,
        body: 'Tap to call the gate and open the barrier.',
        data: { callGate: true },
        sound: true,
      },
      trigger: null,
    });
  }
});
