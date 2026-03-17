import axios from 'axios';
import { env } from '../config/env';

export class WhatsAppMessagingService {
  async sendText(phoneNumberId: string, accessToken: string, to: string, body: string): Promise<void> {
    await axios.post(
      `https://graph.facebook.com/${env.META_API_VERSION}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}
