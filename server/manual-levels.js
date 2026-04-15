function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildOptionsTree(levels) {
  const options = [];
  const appendNode = (node, parentId, depth) => {
    const id = parentId ? `${parentId}-${slugify(node.label)}` : slugify(node.label);
    options.push({
      id,
      label: node.label,
      parent: parentId,
      depth,
      requiresDescription: Boolean(node.requiresDescription),
    });
    (node.children || []).forEach(child => appendNode(child, id, depth + 1));
  };

  levels.forEach(level1 => appendNode(level1, undefined, 1));

  return { options };
}

const laptopDesktopProblems = [
  'Battery, charging, or power problem',
  'Internet / VPN / Network Issues',
  'System Performance / OS Issues',
  'Settings / Configuration Issues',
  'System Not Working (Critical Failure)',
  'Login / Account Access Issues',
  'Audio / Camera Issues',
  'Screen / Display Issues',
  'Keyboard / Mouse / Port Issues',
  'Security / Encryption Issues',
  'Device Physically Damaged',
  'Something else',
];

const printerProblems = [
  'Setup / Configuration / Driver Issues',
  'Print Quality / Alignment / Unable to Print',
  'Paper Jam / Paper Handling',
  'Network / Connectivity Issues',
  'Hardware Failure (Internal Components)',
  'Not Powering On / Printer Dead',
  'Consumables (Toner / Ribbon / Cartridge)',
  'Something else',
];

const biometricOrScannerProblems = [
  'Login / Authentication Issues',
  'URL / Access related Issues',
  'Device not working',
  'Configuration Issues',
  'RD Service / Driver Issues',
  'Something else',
];

const microsoftProblems = [
  'Application not working',
  'Login / Access',
  'Functionality / Performance',
  'Configuration / Setup / Installation',
  'Connection / Network',
  'Cache / Browser',
  'Audio / Video',
  'Email / Mailbox',
  'Archive / Storage',
  'Storage / Sync',
  'File Upload / Download',
  'SMS / OTP',
  'License Requests',
  'Something else',
];

const businessWebAppProblems = [
  'Login / Access',
  'Application not working',
  'Functionality / Performance',
  'Something else',
];

const otherSoftwareProblems = [
  'Login / Access',
  'Application not working',
  'Functionality / Performance',
  'Setup / Installation',
  'Connection / Network',
  'Something else',
];

const branchProblems = [
  'LAN / Wireless Issues',
  'Slow / Performance',
  'Connectivity Down',
  'Power / Electrical Issues',
  'Server Issues',
  'Rack Issues',
  'Fire / Electrical Incident',
  'Flood / Waterlogging',
  'Something else',
];

const atmKioskProblems = ['Link / Access Issues', 'Power Issues', 'Not Working', 'Something else'];

function createProblemNodes(problems) {
  return problems.map(label => ({ label }));
}

const MANUAL_LEVELS = [
  {
    label: 'Device & Hardware',
    children: [
      {
        label: 'Laptop and Desktop',
        children: createProblemNodes(laptopDesktopProblems),
      },
      {
        label: 'Printer',
        children: [
          { label: 'Laserjet Printer', children: createProblemNodes(printerProblems) },
          { label: 'Passbook Printer', children: createProblemNodes(printerProblems) },
          { label: 'Xerox - MFP', children: createProblemNodes(printerProblems) },
          {
            label: 'Others',
            children: [
              { label: 'DDMC - Printer' },
              { label: 'Statement - Printer' },
              { label: 'Barcode - Printer' },
              { label: 'Passbook - Kiosk' },
              { label: 'Line Printer' },
              { label: 'Print Server' },
              { label: 'WEPSOL - MFP (eHL)' },
              { label: 'TeamComputer - MFP (eHL)' },
              { label: 'Pin Printer' },
              { label: 'Others', requiresDescription: true },
            ],
          },
        ],
      },
      {
        label: 'Scanning Device',
        children: [
          { label: 'Document Scanner', children: createProblemNodes(biometricOrScannerProblems) },
          { label: 'CTS Scanner', children: createProblemNodes(biometricOrScannerProblems) },
          { label: 'Barcode Scanner', children: createProblemNodes(biometricOrScannerProblems) },
        ],
      },
      {
        label: 'Biometric',
        children: [
          { label: 'Biometric 2FA for FC', children: createProblemNodes(biometricOrScannerProblems) },
          { label: 'Biometric Scanner', children: createProblemNodes(biometricOrScannerProblems) },
          { label: 'Biometric for eKYC', children: createProblemNodes(biometricOrScannerProblems) },
          {
            label: 'Biometric 2FA Registration - Project',
            children: createProblemNodes(biometricOrScannerProblems),
          },
        ],
      },
      {
        label: 'Others',
        children: [{ label: 'Mobile' }, { label: 'iPad' }, { label: 'Tablet' }],
      },
    ],
  },
  {
    label: 'Software & Application',
    children: [
      {
        label: 'Microsoft / Office 365 Softwares',
        children: [
          { label: 'Microsoft Edge', children: createProblemNodes(microsoftProblems) },
          { label: 'Microsoft Outlook', children: createProblemNodes(microsoftProblems) },
          { label: 'Microsoft Teams', children: createProblemNodes(microsoftProblems) },
          { label: 'Microsoft Office', children: createProblemNodes(microsoftProblems) },
          { label: 'Microsoft OneDrive', children: createProblemNodes(microsoftProblems) },
          { label: 'Microsoft MFA', children: createProblemNodes(microsoftProblems) },
          { label: 'Microsoft SharePoint', children: createProblemNodes(microsoftProblems) },
          { label: 'Exchange Report', children: createProblemNodes(microsoftProblems) },
          { label: 'O365 UAT', children: createProblemNodes(microsoftProblems) },
          { label: 'MSO Service', children: createProblemNodes(microsoftProblems) },
          { label: 'Others', requiresDescription: true },
        ],
      },
      {
        label: 'Business Web Applications',
        children: [
          { label: 'IPLS – Retail Loan Origination', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Pances', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Flexcube', children: createProblemNodes(businessWebAppProblems) },
          { label: 'MPower', children: createProblemNodes(businessWebAppProblems) },
          { label: 'MS Intune EMM', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Mobile Banking Rewrite', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Customer Portal', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Enterprise DataWarehouse', children: createProblemNodes(businessWebAppProblems) },
          { label: 'HCM', children: createProblemNodes(businessWebAppProblems) },
          { label: 'HDFC & You – Sales Mobile App', children: createProblemNodes(businessWebAppProblems) },
          { label: 'CRM Next', children: createProblemNodes(businessWebAppProblems) },
          { label: 'CBX', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Veritas', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Digital Customer Onboarding', children: createProblemNodes(businessWebAppProblems) },
          { label: 'ServiceNow', children: createProblemNodes(businessWebAppProblems) },
          { label: 'IDEA – RAS', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Penn App – Pennants Lending Factory', children: createProblemNodes(businessWebAppProblems) },
          { label: 'Others', requiresDescription: true },
        ],
      },
      {
        label: 'Other Software',
        children: [
          { label: 'ZScaler', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Cisco AnyConnect', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Holmes EndPoint Solution', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Google Chrome', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Open Office', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Citrix Client', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'DoPDF', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Internet Explorer', children: createProblemNodes(otherSoftwareProblems) },
          { label: 'Others', requiresDescription: true },
        ],
      },
    ],
  },
  {
    label: 'Bank Infrastructure & Network',
    children: [
      {
        label: 'Branch',
        children: [
          { label: 'Network & Connectivity', children: createProblemNodes(branchProblems) },
          { label: 'Infrastructure / Server / Power', children: createProblemNodes(branchProblems) },
          { label: 'Branch Down', children: createProblemNodes(branchProblems) },
        ],
      },
      {
        label: 'ATM / Kiosk',
        children: [
          { label: 'Network & Connectivity', children: createProblemNodes(atmKioskProblems) },
          { label: 'Infrastructure / Power', children: createProblemNodes(atmKioskProblems) },
        ],
      },
    ],
  },
];

export function getManualLevelsPayload() {
  return buildOptionsTree(MANUAL_LEVELS);
}

