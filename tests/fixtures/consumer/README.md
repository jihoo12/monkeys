# Monkey consumer fixture

This directory stands in for a completely separate repository that uses
`jihoo12/monkeys@v1`. The action tests copy it to a temporary workspace and run
the action from a copied action checkout.

The `package.json` here is intentionally a normal consumer manifest with a
dependency. The action must not modify it, create `node_modules`, or run any
install command.
