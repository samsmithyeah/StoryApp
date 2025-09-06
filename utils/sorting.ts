/**
 * Utility function to sort items by createdAt date in descending order
 * Items without a createdAt date are placed at the end
 */
export const sortByCreatedAtDesc = <T extends { createdAt?: Date }>(
  a: T,
  b: T
): number => {
  if (!a.createdAt && !b.createdAt) return 0;
  if (!a.createdAt) return 1; // items without a date go to the end
  if (!b.createdAt) return -1; // items without a date go to the end
  return b.createdAt.getTime() - a.createdAt.getTime();
};
