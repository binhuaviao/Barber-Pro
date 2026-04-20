# Security Specification - BarberPro SaaS

## Data Invariants
1. An unauthenticated user can NOT read or write any data.
2. A user can ONLY read and write data under their own `/users/{userId}` path.
3. Every document in subcollections MUST belong to the user identified by the parent document ID.
4. Financial entries MUST have safe amounts (positive numbers).
5. Appointment statuses MUST be defined enums.

## The "Dirty Dozen" Payloads (Expected to be DENIED)
1. **Unauthenticated Read**: Attempt to read `/users/SOME_UID` without login.
2. **Identity Spoofing**: User A (auth.uid=A) attempts to write to `/users/B`.
3. **Cross-Tenant Subcollection Write**: User A attempts to add a client to `/users/B/clientes/newClient`.
4. **Shadow Field Injection**: Attempt to create a service with an extra `isAdmin: true` field.
5. **Type Poisoning**: Sending a string `"100"` instead of a number `100` for `price`.
6. **Status Escalation**: Updating an appointment status to `"validado_admin"` (non-existent enum).
7. **Negative Ledger**: Creating a financial entry with `amount: -500`.
8. **Resource Exhaustion**: Sending a 1MB string for a client's name.
9. **Creation Timestamp Spoofing**: Providing a `createdAt` date from the past via client.
10. **Orphaned Record**: Creating a financial entry without a `type` field.
11. **Update Gap**: Modifying the `createdAt` field on an existing service.
12. **PII Leak**: Attempting to list all users to find emails.

## The Test Plan
Verify that all operations outside of `/users/$(request.auth.uid)` are rejected.
Verify that schema validation (types and sizes) works for each collection.
