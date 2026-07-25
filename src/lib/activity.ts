export type ActivityType = "viewed_product" | "clicked_buy" | "reward_earned";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  productId?: string;
  productName?: string;
  amount?: number;
  label?: string;
  timestamp: number;
};

export function createActivityEntry(
  type: ActivityType,
  data: {
    productId?: string;
    productName?: string;
    amount?: number;
    label?: string;
  },
): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    ...data,
  };
}