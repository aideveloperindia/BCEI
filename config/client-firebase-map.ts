// Domain to Firebase project mapping
// Add all 20 clients here

export interface ClientFirebaseConfig {
  projectId: string;
  serviceAccountEnv: string; // Environment variable name for service account
  collectionName: string;
  topicName: string;
  branding: {
    title: string;
    subtitle: string;
  };
}

export const clientFirebaseMap: Record<string, ClientFirebaseConfig> = {
  // Local development
  'localhost': {
    projectId: 'bcei-b4627',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT1',
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: 'Any School Fee Discount',
      subtitle: 'Get the latest school fee discount updates',
    },
  },
  // Production: https://bcei.vercel.app
  'bcei.vercel.app': {
    projectId: 'bcei-b4627',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT1',
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: 'Any School Fee Discount',
      subtitle: 'Get the latest school fee discount updates',
    },
  },
};

// Get config for current domain
export function getClientConfig(domain: string): ClientFirebaseConfig | null {
  return clientFirebaseMap[domain] || null;
}

// Get all client domains
export function getAllClientDomains(): string[] {
  return Object.keys(clientFirebaseMap);
}
