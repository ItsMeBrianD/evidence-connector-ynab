import { z } from "zod";
import { LoanAccountPeriodicValueSchema } from "./schemas.js";

const ApiMilliunit = z.number().transform((v) => v / 1000);

const UserSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string(),
    }),
  }),
});

export const user = {
  endpoint: "/user",
  value: UserSchema,
  /**
   * @param {z.infer<typeof UserSchema>} result
   * @returns {Array<Record<string,unknown>>}
   */
  transform: (result) => {
    return [{ userId: result.data.user.id }];
  },
};

const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  on_budget: z.boolean(),
  closed: z.boolean(),
  note: z.string().optional().nullable(),
  balance: ApiMilliunit, // API Returns as milliunits
  cleared_balance: ApiMilliunit, // API Returns as milliunits
  uncleared_balance: ApiMilliunit, // API Returns as milliunits
  transfer_payee_id: z.string(),
  direct_import_linked: z.boolean().optional().nullable(),
  direct_import_in_error: z.boolean().optional().nullable(),
  last_reconciled_at: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((z) => (z ? new Date(z) : z)),
  debt_original_balance: z.number().optional().nullable(),
  debt_interest_rates: LoanAccountPeriodicValueSchema.optional().nullable(),
  debt_minimum_payments: LoanAccountPeriodicValueSchema.optional().nullable(),
  debt_escrow_amounts: LoanAccountPeriodicValueSchema.optional().nullable(),
  deleted: z.boolean(),
});

const BudgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  last_modified_on: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((z) => (z ? new Date(z) : z)),
  first_month: z
    .string()
    .optional()
    .nullable()
    .transform((z) => (z ? new Date(z) : z)),
  last_month: z
    .string()
    .optional()
    .nullable()
    .transform((z) => (z ? new Date(z) : z)),
  accounts: z.array(AccountSchema),
})

const BudgetResponseSchema = z.object({
  data: z.object({
    budgets: z.array(BudgetSchema),
  }),
});
export const budget = {
  endpoint: "/budgets?include_accounts=true",
  value: BudgetResponseSchema,
  columnTypes: {
    budget: [
      { name: "id", evidenceType: "string", typeFidelity: "precise" },
      { name: "name", evidenceType: "string", typeFidelity: "precise" },
      {
        name: "last_modified_on",
        evidenceType: "date",
        typeFidelity: "precise",
      },
      { name: "first_month", evidenceType: "date", typeFidelity: "precise" },
      { name: "last_month", evidenceType: "date", typeFidelity: "precise" },
    ],
    budgetAccounts: [
      { name: "id", evidenceType: "string", typeFidelity: "precise" },
      { name: "budgetId", evidenceType: "string", typeFidelity: "precise" },
      { name: "name", evidenceType: "string", typeFidelity: "precise" },
      { name: "type", evidenceType: "string", typeFidelity: "precise" },
      { name: "on_budget", evidenceType: "boolean", typeFidelity: "precise" },
      { name: "closed", evidenceType: "boolean", typeFidelity: "precise" },
      { name: "note", evidenceType: "string", typeFidelity: "precise" },
      { name: "balance", evidenceType: "number", typeFidelity: "precise" },
      {
        name: "cleared_balance",
        evidenceType: "number",
        typeFidelity: "precise",
      },
      {
        name: "uncleared_balance",
        evidenceType: "number",
        typeFidelity: "precise",
      },
      {
        name: "transfer_payee_id",
        evidenceType: "string",
        typeFidelity: "precise",
      },
      {
        name: "direct_import_linked",
        evidenceType: "boolean",
        typeFidelity: "precise",
      },
      {
        name: "direct_import_in_error",
        evidenceType: "boolean",
        typeFidelity: "precise",
      },
      {
        name: "last_reconciled_at",
        evidenceType: "date",
        typeFidelity: "precise",
      },
      {
        name: "debt_original_balance",
        evidenceType: "number",
        typeFidelity: "precise",
      },
      // These are objects and I haven't found a great way to flatten them yet
      // { name: "debt_interest_rates", evidenceType: "string", typeFidelity: "precise" },
      // { name: "debt_minimum_payments", evidenceType: "string", typeFidelity: "precise" },
      // { name: "debt_escrow_amounts", evidenceType: "string", typeFidelity: "precise" },
      { name: "deleted", evidenceType: "boolean", typeFidelity: "precise" },
    ],
  },
  /**
   * @param {z.infer<typeof BudgetResponseSchema>} result
   * @returns {{budgets: Array<z.infer<typeof BudgetSchema> & { accounts: undefined }>, budgetAccounts: Array<z.infer<typeof AccountSchema>>}}
   */
  transform: (result) => {
    return {
      budgets: result.data.budgets.map((b) => ({ ...b, accounts: undefined })),
      budgetAccounts: result.data.budgets
        .map((b) => b.accounts.map((a) => ({ ...a, budgetId: b.id })))
        .flat(),
    };
  },
};

const CategorySchema = z.object({
  id: z.string().uuid(),
  category_group_id: z.string().uuid(),
  category_group_name: z.string(),
  name: z.string(),
  hidden: z.boolean(),
  note: z.string().nullable(),
  budgeted: ApiMilliunit,
  activity: ApiMilliunit,
  balance: ApiMilliunit,
  goal_type: z.string().nullable(),
  goal_target: ApiMilliunit,
  first_month: z
    .string()
    .optional()
    .nullable()
    .transform((z) => (z ? new Date(z) : z)),
  goal_percentage_complete: ApiMilliunit.nullable().optional(),
  deleted: z.boolean(),
});

const CategoryGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hidden: z.boolean(),
  deleted: z.boolean(),
  categories: z.array(CategorySchema),
});

// TODO: Fill this out
const CategoryResponseSchema = z.object({
  data: z.object({
    category_groups: z.array(CategoryGroupSchema),
    server_knowledge: z.number(),
  }),
});
export const categories = {
  endpoint: "/budgets/:budgetId/categories",
  value: CategoryResponseSchema,
  columnTypes: {
    categories: [
      { name: "id", evidenceType: "string", typeGranularity: "precise" },
      {
        name: "category_group_id",
        evidenceType: "string",
        typeGranularity: "precise",
      },
      {
        name: "category_group_name",
        evidenceType: "string",
        typeGranularity: "precise",
      },
      { name: "name", evidenceType: "string", typeGranularity: "precise" },
      { name: "hidden", evidenceType: "boolean", typeGranularity: "precise" },
      { name: "note", evidenceType: "string", typeGranularity: "precise" },
      { name: "budgeted", evidenceType: "number", typeGranularity: "precise" },
      { name: "activity", evidenceType: "number", typeGranularity: "precise" },
      { name: "balance", evidenceType: "number", typeGranularity: "precise" },
      { name: "goal_type", evidenceType: "string", typeGranularity: "precise" },
      {
        name: "goal_target",
        evidenceType: "number",
        typeGranularity: "precise",
      },
      { name: "first_month", evidenceType: "date", typeGranularity: "precise" },
      {
        name: "goal_percentage_complete",
        evidenceType: "number",
        typeGranularity: "precise",
      },
      { name: "deleted", evidenceType: "date", typeGranularity: "precise" },
    ],
    categoryGroups: [
      { name: "id", evidenceType: "string", typeGranularity: "precise" },
      { name: "name", evidenceType: "string", typeGranularity: "precise" },
      { name: "hidden", evidenceType: "boolean", typeGranularity: "precise" },
      { name: "deleted", evidenceType: "boolean", typeGranularity: "precise" },
    ],
  },
  /**
   * @param {z.infer<typeof CategoryResponseSchema>} data
   * @returns {{categories: Array<z.infer<typeof CategorySchema>>, categoryGroups: Array<z.infer<typeof CategoryGroupSchema> & { categories: undefined } >}}
   */
  transform(data) {
    return {
      categories: data.data.category_groups.map((group) => group.categories).flat(),
      categoryGroups: data.data.category_groups.map((group) => ({ ...group, categories: undefined})),
    }

  }
};

const PayeeSchema = z.object({});
export const payees = {};

const MonthSchema = z.object({});
export const months = {};

const TransactionSchema = z.object({});
export const transactions = {};
