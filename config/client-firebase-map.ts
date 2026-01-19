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
  // Client 1 - Example
  'client1.com': {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1 || 'bar-council-client1',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT1',
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: 'Get Bar Council Election Updates',
      subtitle: 'Stay updated with important election updates',
    },
  },
  // Add more clients here...
  // 'client2.com': { ... },
  // 'client3.com': { ... },
};

// Get config for current domain
export function getClientConfig(domain: string): ClientFirebaseConfig | null {
  return clientFirebaseMap[domain] || null;
}

// Get all client domains
export function getAllClientDomains(): string[] {
  return Object.keys(clientFirebaseMap);
}
