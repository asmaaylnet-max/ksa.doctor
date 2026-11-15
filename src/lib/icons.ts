import {
  Activity,
  Baby,
  BookOpen,
  Brain,
  BriefcaseMedical,
  Calendar,
  ClipboardList,
  Eye,
  FileText,
  Globe,
  HeartPulse,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  UserRound,
  Video,
  type LucideIcon
} from 'lucide-react';

export const ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'stethoscope', Icon: Stethoscope },
  { key: 'heart', Icon: HeartPulse },
  { key: 'brain', Icon: Brain },
  { key: 'activity', Icon: Activity },
  { key: 'eye', Icon: Eye },
  { key: 'pill', Icon: Pill },
  { key: 'syringe', Icon: Syringe },
  { key: 'baby', Icon: Baby },
  { key: 'medical', Icon: BriefcaseMedical },
  { key: 'calendar', Icon: Calendar },
  { key: 'video', Icon: Video },
  { key: 'book', Icon: BookOpen },
  { key: 'clipboard', Icon: ClipboardList },
  { key: 'shield', Icon: ShieldCheck },
  { key: 'sparkles', Icon: Sparkles },
  { key: 'star', Icon: Star },
  { key: 'user', Icon: UserRound },
  { key: 'globe', Icon: Globe },
  { key: 'phone', Icon: Phone },
  { key: 'message', Icon: MessageCircle },
  { key: 'mail', Icon: Mail },
  { key: 'link', Icon: Link2 },
  { key: 'location', Icon: MapPin },
  { key: 'file', Icon: FileText }
];

export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(ICON_OPTIONS.map((item) => [item.key, item.Icon]));

export function getIcon(name: string | undefined): LucideIcon {
  return (name && ICON_MAP[name]) || Stethoscope;
}
