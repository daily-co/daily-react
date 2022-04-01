import { DailyCall } from '@daily-co/daily-js';
import { createContext } from 'react';

export const DailyContext = createContext<DailyCall | null>(null);
