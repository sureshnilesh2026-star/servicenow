export interface NavigationOption {
  id: string;
  label: string;
  parent?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export const scenarios: Scenario[] = [
  {
    id: 'scenario-1',
    title: 'Employee onboarding system access',
    description: 'A new employee needs to request access to email and collaboration tools.',
  },
  {
    id: 'scenario-2',
    title: 'Network connectivity issue',
    description: 'An employee is experiencing slow internet connection on their laptop.',
  },
  {
    id: 'scenario-3',
    title: 'Software installation request',
    description: 'A team member needs to install design software for a new project.',
  },
  {
    id: 'scenario-4',
    title: 'Server maintenance notification',
    description: 'IT needs to schedule downtime for server updates.',
  },
  {
    id: 'scenario-5',
    title: 'Mobile device configuration',
    description: 'An employee needs help setting up work email on their phone.',
  },
];

export const level1Options: NavigationOption[] = [
  { id: 'device', label: 'Device' },
  { id: 'software', label: 'Software' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

export const level2Options: NavigationOption[] = [
  // Device children
  { id: 'desktop-computers', label: 'Desktop Computers', parent: 'device' },
  { id: 'mobile-devices', label: 'Mobile Devices', parent: 'device' },
  { id: 'networking-equipment', label: 'Networking Equipment', parent: 'device' },
  { id: 'peripherals', label: 'Peripherals', parent: 'device' },

  // Software children
  { id: 'operating-systems', label: 'Operating Systems', parent: 'software' },
  { id: 'applications', label: 'Applications', parent: 'software' },
  { id: 'development-tools', label: 'Development Tools', parent: 'software' },
  { id: 'security-software', label: 'Security Software', parent: 'software' },

  // Infrastructure children
  { id: 'servers', label: 'Servers', parent: 'infrastructure' },
  { id: 'cloud-services', label: 'Cloud Services', parent: 'infrastructure' },
  { id: 'storage-systems', label: 'Storage Systems', parent: 'infrastructure' },
  { id: 'network-infrastructure', label: 'Network Infrastructure', parent: 'infrastructure' },
];

export const level3Options: NavigationOption[] = [
  // Desktop Computers
  { id: 'hardware-setup', label: 'Hardware Setup', parent: 'desktop-computers' },
  { id: 'performance-issues', label: 'Performance Issues', parent: 'desktop-computers' },
  { id: 'hardware-upgrade', label: 'Hardware Upgrade', parent: 'desktop-computers' },

  // Mobile Devices
  { id: 'phone-config', label: 'Phone Configuration', parent: 'mobile-devices' },
  { id: 'tablet-support', label: 'Tablet Support', parent: 'mobile-devices' },
  { id: 'mobile-security', label: 'Mobile Security', parent: 'mobile-devices' },

  // Networking Equipment
  { id: 'router-setup', label: 'Router Setup', parent: 'networking-equipment' },
  { id: 'wifi-access-points', label: 'WiFi Access Points', parent: 'networking-equipment' },
  { id: 'network-switches', label: 'Network Switches', parent: 'networking-equipment' },

  // Peripherals
  { id: 'printer-scanner', label: 'Printer & Scanner', parent: 'peripherals' },
  { id: 'monitors', label: 'Monitors', parent: 'peripherals' },
  { id: 'input-devices', label: 'Input Devices', parent: 'peripherals' },

  // Operating Systems
  { id: 'windows', label: 'Windows', parent: 'operating-systems' },
  { id: 'macos', label: 'macOS', parent: 'operating-systems' },
  { id: 'linux', label: 'Linux', parent: 'operating-systems' },

  // Applications
  { id: 'office-suite', label: 'Office Suite', parent: 'applications' },
  { id: 'email-client', label: 'Email Client', parent: 'applications' },
  { id: 'collaboration-tools', label: 'Collaboration Tools', parent: 'applications' },

  // Development Tools
  { id: 'ide', label: 'IDE & Code Editors', parent: 'development-tools' },
  { id: 'version-control', label: 'Version Control', parent: 'development-tools' },
  { id: 'testing-tools', label: 'Testing Tools', parent: 'development-tools' },

  // Security Software
  { id: 'antivirus', label: 'Antivirus', parent: 'security-software' },
  { id: 'firewall', label: 'Firewall', parent: 'security-software' },
  { id: 'vpn', label: 'VPN', parent: 'security-software' },

  // Servers
  { id: 'web-servers', label: 'Web Servers', parent: 'servers' },
  { id: 'database-servers', label: 'Database Servers', parent: 'servers' },
  { id: 'file-servers', label: 'File Servers', parent: 'servers' },

  // Cloud Services
  { id: 'cloud-storage', label: 'Cloud Storage', parent: 'cloud-services' },
  { id: 'cloud-computing', label: 'Cloud Computing', parent: 'cloud-services' },
  { id: 'cloud-backup', label: 'Cloud Backup', parent: 'cloud-services' },

  // Storage Systems
  { id: 'nas', label: 'Network Attached Storage', parent: 'storage-systems' },
  { id: 'san', label: 'Storage Area Network', parent: 'storage-systems' },
  { id: 'backup-systems', label: 'Backup Systems', parent: 'storage-systems' },

  // Network Infrastructure
  { id: 'network-design', label: 'Network Design', parent: 'network-infrastructure' },
  { id: 'network-security', label: 'Network Security', parent: 'network-infrastructure' },
  { id: 'network-monitoring', label: 'Network Monitoring', parent: 'network-infrastructure' },
];

export function getChildOptions(parentId: string, level: 2 | 3): NavigationOption[] {
  const options = level === 2 ? level2Options : level3Options;
  return options.filter(opt => opt.parent === parentId);
}
