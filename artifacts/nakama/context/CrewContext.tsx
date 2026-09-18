import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// ------- Types -------

export interface CrewMember {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Legacy permission retained for stored crew migration. */
  distanceVisible?: boolean;
  hakiGranted: boolean;
  emperorHakiGranted: boolean;
  addedAt: number;
}

interface CrewContextValue {
  crew: CrewMember[];
  myId: string;
  myName: string;
  setMyName: (name: string) => Promise<void>;
  myLocation: { latitude: number; longitude: number } | null;
  compassHeading: number;
  selectedFriendId: string | null;
  selectedFriend: CrewMember | null;
  selectFriend: (id: string | null) => void;
  addCrewMember: (member: Omit<CrewMember, 'addedAt'>) => Promise<void>;
  removeCrewMember: (id: string) => Promise<void>;
  toggleHaki: (id: string) => Promise<void>;
  toggleEmperorHaki: (id: string) => Promise<void>;
  bearingToFriend: number | null;
  distanceToFriend: number | null;
  locationPermission: 'granted' | 'denied' | 'pending' | 'unknown';
  requestLocationPermission: () => Promise<void>;
}

// ------- Math helpers -------

/** Haversine distance in km */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing in degrees (0-360) from point1 → point2 */
export function bearingDeg(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ------- Context -------

const CrewContext = createContext<CrewContextValue | null>(null);

const STORAGE_CREW = '@nakama/crew';
const STORAGE_MY_ID = '@nakama/myId';
const STORAGE_MY_NAME = '@nakama/myName';

export function CrewProvider({ children }: { children: React.ReactNode }) {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [myId, setMyId] = useState<string>('');
  const [myName, setMyNameState] = useState<string>('');
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending' | 'unknown'>('unknown');

  // ---- Initialise persisted data ----
  useEffect(() => {
    (async () => {
      const [storedId, storedName, storedCrew] = await Promise.all([
        AsyncStorage.getItem(STORAGE_MY_ID),
        AsyncStorage.getItem(STORAGE_MY_NAME),
        AsyncStorage.getItem(STORAGE_CREW),
      ]);
      const id = storedId ?? generateId();
      if (!storedId) await AsyncStorage.setItem(STORAGE_MY_ID, id);
      setMyId(id);
      setMyNameState(storedName ?? '');
      if (storedCrew) {
        try {
          const savedCrew = JSON.parse(storedCrew) as CrewMember[];
          setCrew(savedCrew.map((member) => ({
            ...member,
            hakiGranted: member.hakiGranted ?? member.distanceVisible ?? false,
            emperorHakiGranted: member.emperorHakiGranted ?? false,
          })));
        } catch { /* ignore invalid local data */ }
      }
    })();
  }, []);

  // ---- Location ----
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationPermission('denied');
        return;
      }
      setLocationPermission('pending');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocationPermission('granted');
        },
        () => setLocationPermission('denied'),
        { enableHighAccuracy: true },
      );
      return;
    }
    setLocationPermission('pending');
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted' ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            setLocationPermission('granted');
          },
          () => setLocationPermission('denied'),
          { enableHighAccuracy: true },
        );
        cleanup = () => navigator.geolocation.clearWatch(watchId);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission('denied');
        return;
      }
      setLocationPermission('granted');
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 },
        (loc) => setMyLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      );
      cleanup = () => sub.remove();
    })();

    return () => cleanup?.();
  }, []);

  // ---- Compass heading from Magnetometer ----
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Slowly rotate needle for web demo
      let angle = 0;
      const timer = setInterval(() => {
        angle = (angle + 0.4) % 360;
        setCompassHeading(angle);
      }, 60);
      return () => clearInterval(timer);
    }

    let sub: { remove: () => void } | undefined;
    (async () => {
      try {
        const { Magnetometer } = await import('expo-sensors');
        Magnetometer.setUpdateInterval(80);
        sub = Magnetometer.addListener(({ x, y }) => {
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          setCompassHeading((angle + 360) % 360);
        });
      } catch {
        // expo-sensors unavailable — use 0
      }
    })();
    return () => sub?.remove();
  }, []);

  // ---- Gently drift demo friend locations so the needle stays alive ----
  useEffect(() => {
    const timer = setInterval(() => {
      setCrew((prev) =>
        prev.map((m) => ({
          ...m,
          latitude: m.latitude + (Math.random() - 0.5) * 0.0004,
          longitude: m.longitude + (Math.random() - 0.5) * 0.0004,
        })),
      );
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // ---- Derived values ----
  const selectedFriend = crew.find((m) => m.id === selectedFriendId) ?? null;

  let bearingToFriend: number | null = null;
  let distanceToFriend: number | null = null;

  if (selectedFriend && myLocation) {
    bearingToFriend = bearingDeg(
      myLocation.latitude, myLocation.longitude,
      selectedFriend.latitude, selectedFriend.longitude,
    );
    distanceToFriend = haversineKm(
      myLocation.latitude, myLocation.longitude,
      selectedFriend.latitude, selectedFriend.longitude,
    );
  }

  // ---- Mutations ----
  const setMyName = useCallback(async (name: string) => {
    setMyNameState(name);
    await AsyncStorage.setItem(STORAGE_MY_NAME, name);
  }, []);

  const persistCrew = useCallback(async (next: CrewMember[]) => {
    setCrew(next);
    await AsyncStorage.setItem(STORAGE_CREW, JSON.stringify(next));
  }, []);

  const addCrewMember = useCallback(async (member: Omit<CrewMember, 'addedAt'>) => {
    const newMember: CrewMember = { ...member, addedAt: Date.now() };
    const next = [...crew, newMember];
    await persistCrew(next);
    setSelectedFriendId(member.id);
  }, [crew, persistCrew]);

  const removeCrewMember = useCallback(async (id: string) => {
    const next = crew.filter((m) => m.id !== id);
    await persistCrew(next);
    if (selectedFriendId === id) setSelectedFriendId(next[0]?.id ?? null);
  }, [crew, persistCrew, selectedFriendId]);

  const toggleHaki = useCallback(async (id: string) => {
    const next = crew.map((m) => m.id === id ? { ...m, hakiGranted: !m.hakiGranted } : m);
    await persistCrew(next);
  }, [crew, persistCrew]);

  const toggleEmperorHaki = useCallback(async (id: string) => {
    const next = crew.map((m) => m.id === id ? { ...m, emperorHakiGranted: !m.emperorHakiGranted } : m);
    await persistCrew(next);
  }, [crew, persistCrew]);

  const selectFriend = useCallback((id: string | null) => {
    setSelectedFriendId(id);
  }, []);

  return (
    <CrewContext.Provider
      value={{
        crew,
        myId,
        myName,
        setMyName,
        myLocation,
        compassHeading,
        selectedFriendId,
        selectedFriend,
        selectFriend,
        addCrewMember,
        removeCrewMember,
        toggleHaki,
        toggleEmperorHaki,
        bearingToFriend,
        distanceToFriend,
        locationPermission,
        requestLocationPermission,
      }}
    >
      {children}
    </CrewContext.Provider>
  );
}

export function useCrew(): CrewContextValue {
  const ctx = useContext(CrewContext);
  if (!ctx) throw new Error('useCrew must be used inside CrewProvider');
  return ctx;
}
