import { WebhookEventLogModel } from '../models/WebhookEventLog';
import { CartSessionModel } from '../models/CartSession';
import { MenuCategoryModel } from '../models/MenuCategory';
import { MenuItemModel } from '../models/MenuItem';
import { OrderModel } from '../models/Order';
import { WhatsAppConfigModel } from '../models/WhatsAppConfig';
import { WhatsAppMessagingService } from './WhatsAppMessagingService';

const messagingService = new WhatsAppMessagingService();

export class WebhookProcessingService {
  async process(logId: string): Promise<void> {
    const log = await WebhookEventLogModel.findById(logId);
    if (!log) return;

    try {
      const message = (log.payload as any)?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message?.from || !message?.text?.body) {
        log.processed = true;
        await log.save();
        return;
      }

      const incoming = String(message.text.body).trim().toLowerCase();
      const phoneNumberId = (log.payload as any)?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
      const config = await WhatsAppConfigModel.findOne({ phoneNumberId, botStatus: 'active' });

      if (!config?.accessToken || !config.restaurantId) {
        log.processed = true;
        await log.save();
        return;
      }

      if (incoming === 'menu') {
        const categories = await MenuCategoryModel.find({ restaurantId: config.restaurantId }).sort({ sortOrder: 1 });
        const text = categories.length ? `Menu Categories:\n${categories.map((c) => `- ${c.name}`).join('\n')}` : 'Menu is currently empty.';
        await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, text);
      } else if (incoming.startsWith('items ')) {
        const categoryName = incoming.replace('items ', '').trim();
        const category = await MenuCategoryModel.findOne({ restaurantId: config.restaurantId, name: new RegExp(`^${categoryName}$`, 'i') });
        if (!category) {
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, 'Category not found.');
        } else {
          const items = await MenuItemModel.find({ restaurantId: config.restaurantId, categoryId: category.id, isAvailable: true });
          const text = items.length
            ? items.map((item) => `${item.name} - ${item.price}\n${item.description ?? ''}`).join('\n\n')
            : 'No available items in this category.';
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, text);
        }
      } else if (incoming.startsWith('add ')) {
        const itemName = incoming.replace('add ', '').trim();
        const item = await MenuItemModel.findOne({ restaurantId: config.restaurantId, name: new RegExp(`^${itemName}$`, 'i') });
        if (!item) {
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, 'Item not found.');
        } else {
          const cart =
            (await CartSessionModel.findOne({ restaurantId: config.restaurantId, customerPhone: message.from })) ||
            (await CartSessionModel.create({
              restaurantId: config.restaurantId,
              customerPhone: message.from,
              items: [],
              expiresAt: new Date(Date.now() + 60 * 60 * 1000)
            }));

          const line = cart.items.find((x) => String(x.menuItemId) === item.id);
          if (line) line.quantity += 1;
          else cart.items.push({ menuItemId: item._id, quantity: 1 });
          await cart.save();
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, `${item.name} added to cart.`);
        }
      } else if (incoming === 'cart') {
        const cart = await CartSessionModel.findOne({ restaurantId: config.restaurantId, customerPhone: message.from });
        if (!cart || cart.items.length === 0) {
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, 'Your cart is empty.');
        } else {
          const menuItems = await MenuItemModel.find({ _id: { $in: cart.items.map((i) => i.menuItemId) } });
          const lines = cart.items.map((line) => {
            const item = menuItems.find((m) => String(m._id) === String(line.menuItemId));
            return `${item?.name ?? 'Item'} x${line.quantity}`;
          });
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, `Cart summary:\n${lines.join('\n')}`);
        }
      } else if (incoming === 'order') {
        const cart = await CartSessionModel.findOne({ restaurantId: config.restaurantId, customerPhone: message.from });
        if (!cart || cart.items.length === 0) {
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, 'Your cart is empty.');
        } else {
          const menuItems = await MenuItemModel.find({ _id: { $in: cart.items.map((i) => i.menuItemId) } });
          const items = cart.items.map((line) => {
            const item = menuItems.find((m) => String(m._id) === String(line.menuItemId));
            return { menuItemId: line.menuItemId, quantity: line.quantity, price: item?.price ?? 0 };
          });
          const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const order = await OrderModel.create({
            restaurantId: config.restaurantId,
            customerPhone: message.from,
            items,
            totalAmount,
            status: 'pending'
          });
          await CartSessionModel.deleteOne({ _id: cart._id });
          await messagingService.sendText(config.phoneNumberId!, config.accessToken, message.from, `Order placed successfully. ID: ${order.id}`);
        }
      } else {
        await messagingService.sendText(
          config.phoneNumberId!,
          config.accessToken,
          message.from,
          'Welcome to our ordering bot. Commands: menu, items <category>, add <item>, cart, order.'
        );
      }

      log.processed = true;
      log.processingError = undefined;
    } catch (error) {
      log.processed = false;
      log.processingError = (error as Error).message;
    }

    await log.save();
  }
}
