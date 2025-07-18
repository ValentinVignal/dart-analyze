/**
 * Makes only the specified keys K in T optional, while keeping all other properties required
 */
export type PartiallyPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
//# sourceMappingURL=types.d.ts.map