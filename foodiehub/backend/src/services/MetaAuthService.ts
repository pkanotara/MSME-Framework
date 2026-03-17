import axios from 'axios';
import { env } from '../config/env';

export class MetaAuthService {
  private baseUrl = `https://graph.facebook.com/${env.META_API_VERSION}`;

  async exchangeCodeForToken(code: string): Promise<{ access_token: string }> {
    const { data } = await axios.get(`${this.baseUrl}/oauth/access_token`, {
      params: {
        client_id: env.META_APP_ID,
        client_secret: env.META_APP_SECRET,
        redirect_uri: env.META_REDIRECT_URI,
        code
      }
    });
    return data;
  }
}
