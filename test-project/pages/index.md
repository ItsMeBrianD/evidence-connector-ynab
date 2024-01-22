```sql budgets
SELECT * FROM ynab.budgets
```

```sql accounts
SELECT * FROM ynab.budgetAccounts ba
ORDER BY ba.type, ba.name
```

```sql non_debt_accounts
SELECT * FROM ynab.budgetAccounts ba
WHERE ba.type IN ('checking', 'savings', 'cash')
AND ba.balance > 1
ORDER BY ba.type, ba.name
```

```sql categoryGroups
SELECT * FROM ynab.categoryGroups cg
```

```sql categories
SELECT cg.id as groupId, cg.name as group, c.name as category, c.budgeted, c.activity, c.balance FROM ynab.categoryGroups cg
    INNER JOIN ynab.categories c ON c.category_group_id = cg.id
```

<BarChart title="Account Summary" data={non_debt_accounts} x="name" series="type" y="balance" yFmt="usd" />

<Accordion>
    {#each categoryGroups as cg}
        {@const cats = categories.where(`groupId = '${cg.id}'`)}
        {#if cats.length}
        <AccordionItem id={cg.id} title={cg.name}>
            <div class="grid grid-cols-4 gap-y-2 items-center justify-center gap-x-4">
            {#each cats as category}
                <span class="text-md font-bold">{category.category}</span>

                <BigValue data={category} value="budgeted" fmt="usd" />
                <BigValue data={category} value="activity" fmt="usd" />
                <BigValue data={category} value="balance" fmt="usd" />
            {/each}
            </div >
        </AccordionItem>
        {/if}
    {/each}
</Accordion>