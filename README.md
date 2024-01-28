
# Evidence Connector YNAB

Easy to use connector for [Evidence](https://evidence.dev) to vizualize and explore your [YNAB](https://ynab.com) budgets.




## Usage

To use this project, install it into your Evidence project

```bash
  npm i evidence-connector-ynab
```

Then add it to your `evidence.plugins.yaml` as a datasource:

```yaml
datasources:
    # ...
    evidence-connector-ynab: {}
```

Run your Evidence project, and navigate to the [settings page](http://localhost:3000), and add a new YNAB source.

Add a YNAB Personal Access Token (get one from the [Developer Settings](https://app.ynab.com/settings/developer)) to your source.

Open the [schema explorer](http://localhost:3000/explore/schema) to see the new tables imported from your budget!

## Examples


See transactions by category by week
```sql
SELECT  c.name,
        date_trunc('week', t.date) as weekof,
        COUNT(DISTINCT t.id) as transactions,
        SUM(t.amount) as total,
        AVG(t.amount) as avg 
FROM ynab.transactions t
    INNER JOIN ynab.categories c on t.category_id = c.id
GROUP BY ALL
```

See number of transactions by payee
```sql
SELECT
        p.name,
        count(distinct t.id) as transactions
FROM ynab.transactions t
    INNER JOIN ynab.payees p on t.payee_id = p.id
GROUP BY ALL
```