```sql checking_account_activity
SELECT a.name, date_trunc('week', t.date) as weekof, COUNT(DISTINCT t.id) as transactions, SUM(t.amount) as total, AVG(t.amount) as avg  FROM ynab.transactions t
    INNER JOIN ynab.accounts a on t.account_id = a.id
WHERE a.type in ('checking') AND (${inputs.selected_month} IS null OR '${inputs.selected_month}' = DATE_TRUNC('month', t.date))
GROUP BY ALL
```

```sql category_activity
SELECT c.name, date_trunc('week', t.date) as weekof, COUNT(DISTINCT t.id) as transactions, SUM(t.amount) as total, AVG(t.amount) as avg  FROM ynab.transactions t
    INNER JOIN ynab.categories c on t.category_id = c.id
WHERE ${inputs.selected_month} IS null OR '${inputs.selected_month}' = DATE_TRUNC('month', t.date)
GROUP BY ALL
```

```sql months
SELECT DATE_TRUNC('month', m.month)::text as value,
        strftime(m.month, '%b %Y')  as label FROM ynab.months m
```

<Dropdown name="selected_month" data={months} value="value" label="label" title="Selected Month">
        <DropdownOption valueLabel="All Time" value="null" />
</Dropdown>


<BarChart title="Checking Account Activity" data={checking_account_activity} x="weekof" series="name" y="transactions" handleMissing="zero" />
<BarChart title="Category Activity" data={category_activity} x="weekof" series="name" y="transactions" handleMissing="zero" />
