import { ReactNode } from 'react';

export interface ScheduleItem {
  time: string;
  activity: string;
  desc: string;
  icon: ReactNode;
  tips?: string;
}

export interface ItineraryDay {
  day: string;
  date: string;
  theme: string;
  schedule: ScheduleItem[];
}

export interface TripInfo {
  title: string;
  dates: string;
  theme: string;
  weather: string;
}

export interface Consideration {
  text: string;
  desc: string;
}