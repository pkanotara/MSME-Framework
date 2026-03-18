import { connectDB } from '../config/db';
import { logger } from '../config/logger';
import { UserModel } from '../models/User';
import { RestaurantModel } from '../models/Restaurant';

async function seed() {
  await connectDB();

  const admin = await UserModel.findOneAndUpdate(
    { email: 'admin@foodiehub.local' },
    { name: 'Platform Admin', email: 'admin@foodiehub.local', password: 'Admin@12345', role: 'super_admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const owner = await UserModel.findOneAndUpdate(
    { email: 'owner@foodiehub.local' },
    { name: 'Restaurant Owner', email: 'owner@foodiehub.local', password: 'Owner@12345', role: 'restaurant_owner' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const restaurant = await RestaurantModel.findOneAndUpdate(
    { email: 'owner@foodiehub.local' },
    {
      ownerId: owner._id,
      name: 'Demo Bistro',
      phone: '+14155550123',
      email: 'owner@foodiehub.local',
      address: '1 Demo Street',
      description: 'Sample seeded restaurant',
      workingHours: '9AM-9PM',
      foodCategories: ['Burgers', 'Pizza'],
      onboardingStatus: 'active'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  owner.restaurantId = restaurant._id;
  await owner.save();

  logger.info({ admin: admin.email, owner: owner.email, restaurant: restaurant.name }, 'Seed data created');
  process.exit(0);
}

seed().catch((error) => {
  logger.error({ error }, 'Seed failed');
  process.exit(1);
});
