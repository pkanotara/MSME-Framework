import { Schema, model, Document, Types } from 'mongoose';

export interface IMenuCategory extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  sortOrder: number;
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const MenuCategoryModel = model<IMenuCategory>('MenuCategory', menuCategorySchema);
