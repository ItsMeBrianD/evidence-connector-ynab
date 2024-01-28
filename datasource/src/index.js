/**
 * This type describes the options that your connector expects to recieve
 * This could include username + password, host + port, etc
 * @typedef {Object} ConnectorOptions
 * @property {string} accessToken
 */
import fetch from "node-fetch";
import * as endpoints from "./endpoints.js";

/**
 *
 * @param {string} endpoint
 * @param {string} token
 * @returns {Promise<unknown>}
 */
const request = async (endpoint, token) =>
  fetch(`https://api.ynab.com/v1${endpoint}`, {
    headers: { Authorization: `bearer ${token}` },
  }).then((r) => r.json());

/**
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#options-specification
 * @see https://github.com/evidence-dev/evidence/blob/main/packages/postgres/index.cjs#L316
 */
export const options = {
  accessToken: {
    title: "Access Token",
    description:
      "You can generate this token at https://app.ynab.com/settings/developer",
    type: "string", // options: 'string' | 'number' | 'boolean' | 'select' | 'file'
  },
};

/**
 * Implementing this function creates a "simple" connector
 *
 * Each file in the source directory will be passed to this function, and it will return
 * either an array, or an async generator {@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*}
 * that contains the query results
 *
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#simple-interface-arrays
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */
export const getRunner = () => {
  // This function will be called for EVERY file in the sources directory
  // If you are expecting a specific file type (e.g. SQL files), make sure to filter
  // to exclude others.

  // If you are using some local database file (e.g. a sqlite or duckdb file)
  // You may also need to filter that file out as well
  return async () => {
    throw new Error("Query Runner has not yet been implemented");
  };
};

// Uncomment to use the advanced source interface
// This uses the `yield` keyword, and returns the same type as getRunner, but with an added `name` and `content` field (content is used for caching)
// sourceFiles provides an easy way to read the source directory to check for / iterate through files
/** @type {import("@evidence-dev/db-commons").ProcessSource<ConnectorOptions>} */
export async function* processSource(options) {
  const user = await request(endpoints.user.endpoint, options.accessToken);

  const budgetResponse = await request(
    endpoints.budget.endpoint,
    options.accessToken,
  );

  const { budgets, budgetAccounts } = endpoints.budget.transform(
    endpoints.budget.value.parse(budgetResponse),
  );

  const currentMs = new Date().getTime();
  const fiveMinMs = 1000 * 60 * 5;
  const contentHash = (currentMs - (currentMs % fiveMinMs)).toString(); // Floor func

  yield {
    name: "budgets",
    columnTypes: endpoints.budget.columnTypes.budget,
    rows: budgets,
    content: contentHash, // TODO: Actually hash something somewhere
  };

  yield {
    name: "accounts",
    columnTypes: endpoints.budget.columnTypes.budgetAccounts,
    rows: budgetAccounts,
    content: contentHash,
  };

  const allCategories = [];
  const allCategoryGroups = [];
  const allPayees = [];
  const allMonths = [];
  const allTransactions = [];
  const allSubtransactions = [];

  for (const budget of budgets) {
    const categoryResponse = await request(
      endpoints.categories.endpoint.replace(":budgetId", budget.id),
      options.accessToken,
    );

    const { categories, categoryGroups } = endpoints.categories.transform(
      endpoints.categories.value.parse(categoryResponse),
    );
    allCategories.push(...categories);
    allCategoryGroups.push(...categoryGroups);

    const payeeResponse = await request(
      endpoints.payees.endpoint.replace(":budgetId", budget.id),
      options.accessToken,
    );
    const payees = endpoints.payees.value.parse(payeeResponse);
    allPayees.push(...endpoints.payees.transform(payees, budget.id));

    const monthsResponse = await request(
      endpoints.months.endpoint.replace(":budgetId", budget.id),
      options.accessToken,
    );

    const months = endpoints.months.value.parse(monthsResponse);
    allMonths.push(...endpoints.months.transform(months, budget.id));

    const transactionsResponse = await request(
      endpoints.transactions.endpoint.replace(":budgetId", budget.id),
      options.accessToken,
    );
    const { transactions, subtransactions } = endpoints.transactions.transform(
      endpoints.transactions.value.parse(transactionsResponse),
      budget.id,
    );
    allTransactions.push(...transactions);
    allSubtransactions.push(...subtransactions);
  }

  yield {
    name: "categories",
    columnTypes: endpoints.categories.columnTypes.categories,
    rows: allCategories,
    content: contentHash,
  };
  yield {
    name: "categoryGroups",
    columnTypes: endpoints.categories.columnTypes.categoryGroups,
    rows: allCategoryGroups,
    content: contentHash,
  };
  yield {
    name: "payees",
    columnTypes: endpoints.payees.columnTypes,
    rows: allPayees,
    content: contentHash,
  };
  yield {
    name: "months",
    columnTypes: endpoints.months.columnTypes,
    rows: allMonths,
    content: contentHash,
  };
  yield {
    name: "transactions",
    columnTypes: endpoints.transactions.columnTypes.transactions,
    rows: allTransactions,
    content: contentHash,
  };
  yield {
    name: "subtransactions",
    columnTypes: endpoints.transactions.columnTypes.subtransactions,
    rows: allSubtransactions,
    content: contentHash,
  };

  return null;
}

/**
 * Implementing this function creates an "advanced" connector
 *
 *
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#advanced-interface-generator-functions
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async (opts) => {
  try {
    const r = await request(endpoints.user.endpoint, opts.accessToken);
    endpoints.user.value.parse(r);
    return true;
  } catch (e) {
    return {
      reason: e instanceof Error ? e.message : e,
    };
  }
};
