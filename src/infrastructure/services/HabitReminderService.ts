/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalNotifications, Weekday, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { Language } from '../../shared/i18n/translations';
import type { Habit, HabitReminder } from '../../domain/entities';
import { getRuntimePlatform, isNativeApp } from '../platform/RuntimePlatform';

const REMINDER_CHANNEL_ID = 'habit-reminders';
const REMINDER_GROUP = 'habit-reminders';
const REMINDER_KIND = 'habit-reminder';

type ReminderPermissionResult = 'granted' | 'denied' | 'unsupported';
type LocalNotificationsWithAreEnabled = typeof LocalNotifications & {
  areEnabled?: () => Promise<{ value: boolean }>;
};

function parseReminderTime(time: string) {
  const [rawHour, rawMinute] = time.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 8,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0
  };
}

function sanitizeReminder(reminder: HabitReminder | undefined): HabitReminder | undefined {
  if (!reminder?.enabled) {
    return undefined;
  }

  return {
    enabled: true,
    cadence: reminder.cadence ?? 'daily',
    time: reminder.time ?? '08:00',
    weekdays: Array.isArray(reminder.weekdays)
      ? reminder.weekdays.filter((day, index, source) =>
        Number.isInteger(day) && day >= 0 && day <= 6 && source.indexOf(day) === index
      )
      : []
  };
}

function jsDayToWeekday(day: number): Weekday {
  switch (day) {
    case 0:
      return Weekday.Sunday;
    case 1:
      return Weekday.Monday;
    case 2:
      return Weekday.Tuesday;
    case 3:
      return Weekday.Wednesday;
    case 4:
      return Weekday.Thursday;
    case 5:
      return Weekday.Friday;
    default:
      return Weekday.Saturday;
  }
}

function hashToInt(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) || 1;
}

function buildReminderIds(habit: Habit, reminder: HabitReminder) {
  if (reminder.cadence === 'daily') {
    return [hashToInt(`${habit.id}:daily`)];
  }

  const weekdays = reminder.weekdays?.length
    ? reminder.weekdays
    : [new Date().getDay()];

  return weekdays.map((day) => hashToInt(`${habit.id}:${day}`));
}

function buildReminderNotification(
  habit: Habit,
  language: Language,
  reminder: HabitReminder,
  weekday?: number
): LocalNotificationSchema {
  const { hour, minute } = parseReminderTime(reminder.time);
  const id = hashToInt(`${habit.id}:${weekday ?? 'daily'}`);

  return {
    id,
    title: language === 'es' ? 'LUMINA / Recordatorio suave' : 'LUMINA / Gentle reminder',
    body: language === 'es'
      ? `Es momento de volver a "${habit.name}".`
      : `It is time to return to "${habit.name}".`,
    group: REMINDER_GROUP,
    channelId: getRuntimePlatform() === 'android' ? REMINDER_CHANNEL_ID : undefined,
    extra: {
      kind: REMINDER_KIND,
      habitId: habit.id
    },
    schedule: reminder.cadence === 'daily'
      ? {
        on: { hour, minute }
      }
      : {
        on: {
          weekday: jsDayToWeekday(weekday ?? new Date().getDay()),
          hour,
          minute
        }
      }
  };
}

async function ensureReminderChannel() {
  if (!isNativeApp() || getRuntimePlatform() !== 'android') {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Habit reminders',
      description: 'Gentle reminders for active habits.',
      importance: 3,
      visibility: 0,
      vibration: false
    });
  } catch {
    // Channel may already exist or platform may handle it differently.
  }
}

async function clearScheduledReminderNotifications() {
  if (!isNativeApp()) {
    return;
  }

  try {
    const pending = await LocalNotifications.getPending();
    const pendingReminders = pending.notifications
      .filter((notification) => notification.extra?.kind === REMINDER_KIND)
      .map((notification) => ({ id: notification.id }));

    if (pendingReminders.length > 0) {
      await LocalNotifications.cancel({ notifications: pendingReminders });
    }

    const delivered = await LocalNotifications.getDeliveredNotifications();
    const deliveredReminders = delivered.notifications.filter((notification) => {
      const extra = notification.extra ?? notification.data;
      return notification.group === REMINDER_GROUP || extra?.kind === REMINDER_KIND;
    });

    if (deliveredReminders.length > 0) {
      await LocalNotifications.removeDeliveredNotifications({
        notifications: deliveredReminders
      });
    }
  } catch (error) {
    console.error('Failed to clear scheduled reminder notifications:', error);
  }
}

async function areAndroidNotificationsEnabled() {
  const notifications = LocalNotifications as LocalNotificationsWithAreEnabled;

  if (typeof notifications.areEnabled !== 'function') {
    return false;
  }

  try {
    const { value } = await notifications.areEnabled();
    return value;
  } catch (error) {
    console.warn('Failed to read Android notification enabled state:', error);
    return false;
  }
}

async function hasGrantedHabitReminderPermission() {
  if (!isNativeApp()) {
    return false;
  }

  if (getRuntimePlatform() === 'android') {
    return areAndroidNotificationsEnabled();
  }

  try {
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'granted';
  } catch (error) {
    console.error('Failed to read notification permission state:', error);
    return false;
  }
}

export async function ensureHabitReminderPermission(): Promise<ReminderPermissionResult> {
  if (!isNativeApp()) {
    return 'unsupported';
  }

  try {
    if (getRuntimePlatform() === 'android') {
      if (await areAndroidNotificationsEnabled()) {
        return 'granted';
      }

      const requested = await LocalNotifications.requestPermissions();
      if (requested.display === 'granted') {
        return 'granted';
      }

      return (await areAndroidNotificationsEnabled()) ? 'granted' : 'denied';
    }

    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return 'granted';
    }

    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted' ? 'granted' : 'denied';
  } catch (error) {
    console.error('Failed to check or request notification permissions:', error);
    return (await hasGrantedHabitReminderPermission()) ? 'granted' : 'denied';
  }
}

export async function syncHabitReminderSchedules(habits: Habit[], language: Language) {
  if (!isNativeApp()) {
    return;
  }

  try {
    if (!(await hasGrantedHabitReminderPermission())) {
      return;
    }

    await ensureReminderChannel();
    await clearScheduledReminderNotifications();

    const notifications = habits
      .filter((habit) => habit.isActive)
      .flatMap((habit) => {
        const reminder = sanitizeReminder(habit.reminder);
        if (!reminder) {
          return [];
        }

        if (reminder.cadence === 'daily') {
          return [buildReminderNotification(habit, language, reminder)];
        }

        const weekdays = reminder.weekdays?.length
          ? reminder.weekdays
          : [new Date().getDay()];

        return weekdays.map((weekday) =>
          buildReminderNotification(habit, language, reminder, weekday)
        );
      });

    if (notifications.length === 0) {
      return;
    }

    await LocalNotifications.schedule({ notifications });
  } catch (error) {
    console.error('Failed to sync habit reminder schedules:', error);
  }
}

export async function clearHabitReminderSchedules() {
  if (!isNativeApp()) {
    return;
  }

  try {
    if (!(await hasGrantedHabitReminderPermission())) {
      return;
    }

    await clearScheduledReminderNotifications();
  } catch (error) {
    console.error('Failed to clear habit reminder schedules:', error);
  }
}

export async function registerHabitReminderOpenListener(onOpen: (habitId?: string) => void) {
  if (!isNativeApp()) {
    return async () => undefined;
  }

  const handle = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      const extra = action.notification.extra ?? (action.notification as { data?: Record<string, unknown> }).data;
      if (extra?.kind === REMINDER_KIND) {
        onOpen(typeof extra.habitId === 'string' ? extra.habitId : undefined);
      }
    }
  );

  return async () => {
    await handle.remove();
  };
}

export function hasActiveHabitReminder(habit: Habit) {
  return sanitizeReminder(habit.reminder) !== undefined;
}

export function getHabitReminderLabel(habit: Habit, language: Language) {
  const reminder = sanitizeReminder(habit.reminder);
  if (!reminder) {
    return null;
  }

  const cadenceLabel = language === 'es'
    ? reminder.cadence === 'daily'
      ? 'diario'
      : reminder.cadence === 'weekly'
        ? 'semanal'
        : 'personalizado'
    : reminder.cadence === 'daily'
      ? 'daily'
      : reminder.cadence === 'weekly'
        ? 'weekly'
        : 'custom';

  return `${cadenceLabel} · ${reminder.time}`;
}

export function getHabitReminderNotificationIds(habit: Habit) {
  const reminder = sanitizeReminder(habit.reminder);
  return reminder ? buildReminderIds(habit, reminder) : [];
}
