# CI

`ci.yml` runs on every push and pull request: it starts PostgreSQL 16, generates
the Prisma client, builds `@buurklus/shared`, typechecks all three packages and
runs the full test suite (77 tests, including the API integration tests against
the live database).

Not wired up yet, and worth adding before the first release:

- **EAS Build** for iOS and Android binaries, and `eas submit` for the stores.
- **Migration deploy** (`prisma migrate deploy`) as a step in whatever deploys
  the API.
- **Dependency review** on pull requests.
