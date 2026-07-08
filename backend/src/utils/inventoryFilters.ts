import { FilterQuery } from 'mongoose';
import { IInventory } from '../models/Inventory.js';

export const notDeletedFilter = (): FilterQuery<IInventory> => ({
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
});
