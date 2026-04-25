/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Habit } from '../../domain/entities';

const createChannelMock = vi.hoisted(() => vi.fn(async () => undefined));
const getPendingMock = vi.hoisted(() => vi.fn(async () => ({ notifications: [] })));
const cancelMock = vi.hoisted(() => vi.fn(async () => undefined));
const scheduleMock = vi.hoisted(() => vi.fn(async () => ({ notifications: [] })));
const areEnabledMock = vi.hoisted(() => vi.fn(async () => ({ value: true })));
const checkPermissionsMock = vi.hoisted(() => vi.fn(async () => ({ display: 'granted' })));
const requestPermissionsMock = vi.hoisted(() => vi.fn(async () => ({ display: 'granted' })));
const getDeliveredNotificationsMock = vi.hoisted(() => vi.fn(async () => ({ notifications: [] })));
const removeDeliveredNotificationsMock = vi.hoisted(() => vi.fn(async () => undefined));
const addListenerMock = vi.hoisted(() => vi.fn(async () => ({ remove: vi.fn(async () => undefined) })));
const runtimeState = vi.hoisted(() => ({
  native: true,
  platform: 'android'
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    createChannel: createChannelMock,
    getPending: getPendingMock,
    cancel: cancelMock,
    schedule: scheduleMock,
    areEnabled: areEnabledMock,
    checkPermissions: checkPermissionsMock,
    requestPermissions: requestPermissionsMock,
    getDeliveredNotifications: getDeliveredNotificationsMock,
    removeDeliveredNotifications: removeDeliveredNotificationsMock,
    addListener: addListenerMock
  },
  Weekday: {
    Sunday: 1,
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7
  }
}));

vi.mock('../platform/RuntimePlatform', () => ({
  isNativeApp: () => runtimeState.native,
  getRuntimePlatform: () => runtimeState.platform
}));

import {
  clearHabitReminderSchedules,
  ensureHabitReminderPermission,
  syncHabitReminderSchedules
} from './HabitReminderService';

describe('HabitReminderService', () => {
  const dailyHabit: Habit = {
    id: 'habit-daily',
    name: 'Drink water',
    type: 'yesno',
    frequency: 'daily',
    isActive: true,
    createdAt: '2026-04-24T00:00:00.000Z',
    reminder: {
      enabled: true,
      cadence: 'daily',
      time: '08:30',
      weekdays: []
    }
  };

  const customHabit: Habit = {
    id: 'habit-custom',
    name: 'Reflect',
    type: 'yesno',
    frequency: 'daily',
    isActive: true,
    createdAt: '2026-04-24T00:00:00.000Z',
    reminder: {
      enabled: true,
      cadence: 'custom',
      time: '20:15',
      weekdays: [1, 4]
    }
  };

  beforeEach(() => {
    runtimeState.native = true;
    runtimeState.platform = 'android';
    createChannelMock.mockClear();
    getPendingMock.mockReset();
    getPendingMock.mockResolvedValue({ notifications: [] });
    cancelMock.mockClear();
    scheduleMock.mockClear();
    areEnabledMock.mockReset();
    areEnabledMock.mockResolvedValue({ value: true });
    checkPermissionsMock.mockReset();
    checkPermissionsMock.mockResolvedValue({ display: 'granted' });
    requestPermissionsMock.mockReset();
    requestPermissionsMock.mockResolvedValue({ display: 'granted' });
    getDeliveredNotificationsMock.mockReset();
    getDeliveredNotificationsMock.mockResolvedValue({ notifications: [] });
    removeDeliveredNotificationsMock.mockClear();
    addListenerMock.mockClear();
  });

  it('requests permission on Android when notifications are disabled', async () => {
    areEnabledMock.mockResolvedValueOnce({ value: false });

    const result = await ensureHabitReminderPermission();

    expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
    expect(checkPermissionsMock).not.toHaveBeenCalled();
    expect(result).toBe('granted');
  });

  it('syncs active habit reminders into native scheduled notifications', async () => {
    getPendingMock.mockResolvedValueOnce({
      notifications: [{ id: 91, title: 'Old', body: 'Old', extra: { kind: 'habit-reminder' } }]
    });

    await syncHabitReminderSchedules([dailyHabit, customHabit], 'es');

    expect(createChannelMock).toHaveBeenCalledTimes(1);
    expect(cancelMock).toHaveBeenCalledWith({
      notifications: [{ id: 91 }]
    });
    expect(scheduleMock).toHaveBeenCalledTimes(1);

    const lastScheduleCall = scheduleMock.mock.calls[
      scheduleMock.mock.calls.length - 1
    ] as unknown[] | undefined;
    const scheduleArgs = lastScheduleCall?.[0] as {
      notifications: Array<{ channelId?: string }>;
    } | undefined;

    expect(scheduleArgs?.notifications).toHaveLength(3);
    expect(
      scheduleArgs?.notifications.every(
        (notification) => notification.channelId === 'habit-reminders'
      )
    ).toBe(true);
    expect(checkPermissionsMock).not.toHaveBeenCalled();
  });

  it('clears scheduled and delivered reminder notifications', async () => {
    getPendingMock.mockResolvedValueOnce({
      notifications: [
        { id: 11, title: 'A', body: 'A', extra: { kind: 'habit-reminder' } },
        { id: 12, title: 'B', body: 'B', extra: { kind: 'other' } }
      ]
    });
    getDeliveredNotificationsMock.mockResolvedValueOnce({
      notifications: [
        { id: 21, title: 'A', body: 'A', group: 'habit-reminders' },
        { id: 22, title: 'B', body: 'B', group: 'other' }
      ]
    });

    await clearHabitReminderSchedules();

    expect(cancelMock).toHaveBeenCalledWith({
      notifications: [{ id: 11 }]
    });
    expect(removeDeliveredNotificationsMock).toHaveBeenCalledWith({
      notifications: [{ id: 21, title: 'A', body: 'A', group: 'habit-reminders' }]
    });
    expect(checkPermissionsMock).not.toHaveBeenCalled();
  });
});
