import { env } from '../config/env';

export class EmbeddedSignupService {
  getSignupLink(restaurantId: string): string {
    const redirectUri = encodeURIComponent(`${env.META_REDIRECT_URI}?restaurantId=${restaurantId}`);
    return `https://www.facebook.com/${env.META_API_VERSION}/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${redirectUri}&scope=whatsapp_business_management,whatsapp_business_messaging,business_management`;
  }
}
