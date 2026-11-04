// Typed boundaries for the existing JavaScript contexts and Design System.
import type { ButtonHTMLAttributes, ComponentType, HTMLAttributes, ReactNode } from 'react';
import LegacyCard from '../ui/Card';
import LegacyBtn from '../ui/Btn';
import LegacyBadge from '../ui/Badge';
import LegacyHeader from '../ui/PageHeader';
import LegacyEmpty from '../ui/EmptyState';
import { useFinanzas } from '../../context/FinanzasContext';
import type { TreasuryContext } from './types';
export const useTreasury = (): TreasuryContext => useFinanzas() as unknown as TreasuryContext;
export const Card = LegacyCard as ComponentType<HTMLAttributes<HTMLDivElement> & { padding?: 'none' | 'sm' | 'md'; variant?: 'flat' | 'raised' }>;
export const Btn = LegacyBtn as ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'sm' | 'md'; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'; leftIcon?: ReactNode; fullWidth?: boolean }>;
export const Badge = LegacyBadge as ComponentType<{ children: ReactNode; color?: string; dot?: boolean }>;
export const PageHeader = LegacyHeader as ComponentType<{ onBack: () => void; right?: ReactNode }>;
export const EmptyState = LegacyEmpty as ComponentType<{ title: string; message?: string }>;
