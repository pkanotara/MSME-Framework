import axios from 'axios';
import { env } from '../config/env';

export class MetaSetupService {
  private baseUrl = `https://graph.facebook.com/${env.META_API_VERSION}`;

  async subscribeWebhook(wabaId: string, accessToken: string): Promise<void> {
    await axios.post(
      `${this.baseUrl}/${wabaId}/subscribed_apps`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}
