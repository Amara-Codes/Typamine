// Tag condivisi tra il layer di lettura pubblico (lib/services/*.ts, avvolto
// in unstable_cache) e le server action/API di scrittura in admin
// (lib/actions/*.ts, app/api/admin/**) che devono invalidarlo con
// revalidateTag dopo una mutazione — stessa stringa da entrambe le parti,
// altrimenti l'invalidazione silenziosamente non colpisce nulla.
export const CACHE_TAGS = {
  ingredients: "ingredients",
  formulas: "formulas",
  virtualFormulas: "virtual-formulas",
  pairings: "pairings",
  posts: "posts",
  tags: "tags",
  fontAuthors: "font-authors",
} as const;
