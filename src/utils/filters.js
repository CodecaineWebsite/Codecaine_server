import { eq } from 'drizzle-orm';
import { pensTable } from '../models/schema.js';

export function publicPensFilters() {
  return [
    eq(pensTable.is_private, false),
    eq(pensTable.is_deleted, false),
    eq(pensTable.is_trash, false),
  ];
}