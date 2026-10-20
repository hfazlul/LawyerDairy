import type { ComponentType, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>
export type LucideIcon = ComponentType<IconProps>

function icon(d: string) {
  return function Icon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...props}
      >
        <path d={d} />
      </svg>
    )
  }
}

function MultiIcon(paths: string[]) {
  return function Icon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...props}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    )
  }
}

export const LayoutDashboard = MultiIcon([
  'M3 3h7v9H3z',
  'M14 3h7v5h-7z',
  'M14 12h7v9h-7z',
  'M3 16h7v5H3z',
])
export const User = MultiIcon(['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'])
export const Users = MultiIcon([
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
  'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  'M22 21v-2a4 4 0 0 0-3-3.87',
  'M16 3.13a4 4 0 0 1 0 7.75',
])
export const ContactRound = MultiIcon([
  'M16 2v2',
  'M8 2v2',
  'M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  'M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  'M8 18a4 4 0 0 1 8 0',
])
export const Briefcase = MultiIcon(['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M2 8h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z'])
export const CalendarDays = MultiIcon([
  'M8 2v4',
  'M16 2v4',
  'M3 10h18',
  'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
])
export const Calculator = MultiIcon([
  'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  'M8 7h8',
  'M8 11h2',
  'M14 11h2',
  'M8 15h2',
  'M14 15h2',
])
export const Package = MultiIcon([
  'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
  'M12 22V12',
  'M3.3 7 12 12l8.7-5',
])
export const Settings = MultiIcon([
  'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
])
export const FileText = MultiIcon([
  'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z',
  'M14 2v4a2 2 0 0 0 2 2h4',
  'M10 9H8',
  'M16 13H8',
  'M16 17H8',
])
export const BarChart3 = MultiIcon(['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'])
export const UserSearch = MultiIcon([
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
  'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  'M22 22l-3.5-3.5',
  'M19 16.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
])
export const Share2 = MultiIcon([
  'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  'M8.59 13.51l6.83 3.98',
  'M15.41 6.51l-6.82 3.98',
])
export const MessageSquare = MultiIcon(['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'])
export const GraduationCap = MultiIcon([
  'M22 10v6M2 10l10-5 10 5-10 5z',
  'M6 12v5c3 3 9 3 12 0v-5',
])
export const Menu = MultiIcon(['M4 5h16', 'M4 12h16', 'M4 19h16'])
export const LogOut = MultiIcon(['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'])
export const Globe = MultiIcon([
  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  'M2 12h20',
  'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10',
])
export const Home = MultiIcon(['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'])
export const Phone = MultiIcon(['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c1.21.34 2 1.57 2.81.7A2 2 0 0 1 22 16.92z'])
export const LogIn = MultiIcon(['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'M10 17l5-5-5-5', 'M15 12H3'])
export const Scale = MultiIcon([
  'M12 3v18',
  'M5 7h14',
  'M5 7l-2 7a4 4 0 0 0 8 0L9 7',
  'M15 7l-2 7a4 4 0 0 0 8 0l-2-7',
])
export const Smartphone = MultiIcon([
  'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
  'M12 18h.01',
])
export const ShieldCheck = MultiIcon([
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  'M9 12l2 2 4-4',
])
export const ArrowRight = icon('M5 12h14M13 5l7 7-7 7')
export const ChevronRight = icon('M9 18l6-6-6-6')
export const Mail = MultiIcon(['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'])
export const MessageCircle = MultiIcon([
  'M7.9 20A9 9 0 1 0 4 16.1L2 22z',
])
export const Send = MultiIcon(['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'M21.854 2.147L11 13'])
export const X = MultiIcon(['M18 6L6 18', 'M6 6l12 12'])
