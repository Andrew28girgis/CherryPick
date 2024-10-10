interface DomainConfig {
  logo: string;
  color: string;
  fontFamily: string;
}

const domainConfigs: { [domain: string]: DomainConfig } = {
  'common.cherrypick.com': {
    logo: '../../../assets/Images/common-logo.svg',
    color: '#0e1b4d',
    fontFamily: '"Satoshi", sans-serif',
  },

  'autozone.cherrypick.com': {
    logo: '../../../assets/Images/AutoZone-Inc.jpg',
    color: '#f37f00',
    fontFamily: '"Satoshi", sans-serif',
  },

  'oreillyauto.cherrypick.com': {
    logo: '../../../assets/Images/oreilly.png',
    color: '#067D35',
    fontFamily: '"Satoshi", sans-serif',
  },

  'peak7holdings.cherrypick.com': {
    logo: '../../../assets/Images/peak7.jpg',
    color: '#161616',
    fontFamily: '"Satoshi", sans-serif',
  },

  'localhost:4200': {
    logo: '../../../assets/Images/logo.png',
    color: 'rgb(212, 0, 42)',
    fontFamily: '"Satoshi", sans-serif',
  },
  'localhost:4401': {
    logo: '../../../assets/Images/common-logo.svg',
    color: '#0e1b4d',
    fontFamily: '"Satoshi", sans-serif',
  },
  'localhost:5000': {
    logo: '../../../assets/Images/oreilly.png',
    color: '#067D35',
    fontFamily: '"Satoshi", sans-serif',
  },
};

// Default configuration
const defaultConfig: DomainConfig = {
  logo: '../../../assets/Images/logo.png',
  color: 'rgb(212, 0, 42)',
  fontFamily: '"Arial", sans-serif',
};

export function getDomainConfig(href: string): DomainConfig {
  // Extract domain and port from the URL
  const parser = document.createElement('a');
  parser.href = href;
  const domainWithPort = parser.host;

  // Check if the domain with port exists in domainConfigs
  if (domainConfigs[domainWithPort]) {
    return domainConfigs[domainWithPort];
  }

  // Extract just the domain without port
  const domainWithoutPort = parser.hostname;

  // Check for .cherrypick domains
  if (domainWithoutPort.endsWith('.cherrypick.com')) {
    const subdomain = domainWithoutPort.split('.cherrypick.com')[0];
    if (domainConfigs[subdomain + '.cherrypick.com']) {
      return domainConfigs[subdomain + '.cherrypick.com'];
    }
  }

  // Check for static domains without .cherrypick
  const staticDomainKeys = Object.keys(domainConfigs).filter(
    (key) => !key.includes(':')
  );
  for (const key of staticDomainKeys) {
    if (domainWithoutPort.includes(key)) {
      return domainConfigs[key];
    }
  }

  // Use default configuration if no match found
  return defaultConfig;
}
