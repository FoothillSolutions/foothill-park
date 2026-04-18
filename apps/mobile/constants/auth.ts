// Fill these in after registering the app in Azure Portal (Entra ID)
// Azure Portal → App registrations → New registration
export const AUTH_CONFIG = {
  tenantId: 'eda60734-6629-4439-b419-266a437d6773',
  clientId: 'b20532c8-b3fb-41d3-9cb4-8947c5384030',

  // Scopes: openid + profile give us name/email. Add your API scope in Session 4.
  scopes: ['openid', 'profile', 'email', 'offline_access'],
} as const;