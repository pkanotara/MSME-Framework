import axios from 'axios';
import { env } from '../config/env';

export class WhatsAppProfileService {
  async updateBusinessProfile(phoneNumberId: string, accessToken: string, payload: { about: string; address: string }): Promise<void> {
    await axios.post(
      `https://graph.facebook.com/${env.META_API_VERSION}/${phoneNumberId}/whatsapp_business_profile`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}
