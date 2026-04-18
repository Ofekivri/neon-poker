import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserSettings {
  defaultBuyIn: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultBuyIn: 50,
};

export function useSettings(uid: string | undefined) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'config', 'settings');
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<UserSettings>) });
      }
    });
    return unsubscribe;
  }, [uid]);

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      if (!uid) return;
      const ref = doc(db, 'users', uid, 'config', 'settings');
      const updated = { ...settings, ...partial };
      await setDoc(ref, updated);
    },
    [uid, settings]
  );

  return { settings, updateSettings };
}
