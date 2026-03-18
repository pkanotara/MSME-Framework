export interface Restaurant {
  _id: string;
  name: string;
  phone: string;
  address: string;
  cuisineType: string;
  onboardingStatus: 'pending' | 'meta_connected' | 'completed';
}
