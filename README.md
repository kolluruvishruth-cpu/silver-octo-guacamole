# CampusFlow — Smart Campus Resource Booking & Management System

An Advanced Java web project for CSE 213. Java 17-compatible Spring Boot 3.5.7 backend, Spring MVC REST controllers, Spring Security sessions and CSRF protection, Spring Data JPA, a meaningful JdbcTemplate reporting module, and a responsive HTML/CSS/JavaScript frontend. No React, Swing, JavaFX, Node backend, email verification, email notifications or SMS are used.

## Features

Student/faculty registration and login; BCrypt passwords; account profile/password changes; searchable resource catalogue with type, location, capacity and sorting; resource details and occupied daily slots; validated booking requests; personal booking history and cancellation; in-app read/unread notifications. Administrators manage resources, activate/deactivate accounts, approve/reject bookings with reasons, inspect histories, mark ended approved bookings completed, and view database-based reports with filtered CSV exports.

## Structure

```
src/main/java/edu/campus/
  config/        Security configuration and optional sample data
  controller/    REST endpoints and validation errors
  dto/           Validated input records
  entity/        BaseEntity, User, Resource, Booking, Notification
  exception/     DomainException
  repository/    Generic Spring Data JPA repositories
  service/       BookingService contract
  service/impl/  Transactional booking rules
src/main/resources/
  static/        index.html, style.css, app.js
  application*.properties
src/test/java/edu/campus/CampusIntegrationTest.java
output/          Report PDF and actual browser screenshots
Dockerfile       Java container build
railway.json     Railway Docker deployment configuration
```

## Requirements and VS Code

Install JDK 17 or later and Maven 3.6.3 or later. In VS Code, open this directory using File > Open Folder and install Extension Pack for Java. Confirm `java -version` and `mvn -version` in a new terminal. Java 25 was used for the recorded local checks; compilation targets Java 17. A local Maven 3.9.9 was downloaded into `tools/` on this machine.

## Local run

The default `local` profile creates an H2 file database at `data/campusflow`. Tables, keys and indexes are reproducibly generated from the JPA mappings using Hibernate `ddl-auto=update`. No database installation is needed. Production should adopt versioned Flyway migrations before schema evolution.

Windows PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE='local'
$env:DEMO_DATA='true'
$env:ADMIN_EMAIL='admin@campus.test'
$env:ADMIN_PASSWORD='CampusAdmin!2026'
mvn spring-boot:run
```

Or run `powershell -ExecutionPolicy Bypass -File ./run-demo.ps1`. That development-only helper can use the downloaded Maven under `tools/`.

Linux/macOS:

```sh
SPRING_PROFILES_ACTIVE=local DEMO_DATA=true \
ADMIN_EMAIL=admin@campus.test ADMIN_PASSWORD='CampusAdmin!2026' \
mvn spring-boot:run
```

Open http://localhost:8080. Demonstration credentials are documented here, never displayed by the website. With DEMO_DATA=true: student@campus.test and faculty@campus.test both use `CampusDemo!2026`. The administrator is created from ADMIN_EMAIL and ADMIN_PASSWORD only if that email does not already exist. Changing the environment password later does not reset an existing administrator. Use a private, unique password in production. `DEMO_DATA=false` is the default and disables creation of demonstration users, resources and bookings. Demo data already stored in a database remains until that development database is reset deliberately. The fixed demo dates are relative to its first initialization.

## PostgreSQL / Neon

Create a PostgreSQL database. Convert the host/database part of the Neon connection string to a JDBC URL. Use the pooled hostname if desired and retain `sslmode=require`. Set variables in the terminal or hosting dashboard; Spring Boot does not automatically load `.env` files. `.env.example` contains names only.

```powershell
$env:SPRING_PROFILES_ACTIVE='prod'
$env:DB_URL='jdbc:postgresql://YOUR-HOST/neondb?sslmode=require'
$env:DB_USERNAME='YOUR_USERNAME'
$env:DB_PASSWORD='YOUR_PASSWORD'
$env:ADMIN_EMAIL='your-admin@university.edu'
$env:ADMIN_PASSWORD='YOUR_LONG_RANDOM_PASSWORD'
$env:DEMO_DATA='false'
mvn spring-boot:run
```

Linux uses `export NAME='value'` for each variable. The prod profile requires HTTPS because session cookies are secure. For PostgreSQL development on plain localhost use `local` plus explicit `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` overrides. Do not commit secrets.

## Build and tests

```
mvn test
mvn package
java -jar target/campusflow-1.0.0.jar
```

20 integration tests passed locally: free slot, overlap, adjacency, past/reversed times, inactive resource, capacity, cancellation release/history, owner-only cancellation/viewing, approval, rejection/release, simultaneous conflicts, role protection, anonymous protection, valid registration/BCrypt, duplicate email, admin self-registration rejection, short password, CSRF protection. Test results are in `target/surefire-reports`. Browser walkthrough additionally verified student login, resource search, booking conflict feedback, adjacent booking creation, administrator login and approval. PostgreSQL and deployed hosting are separate checks and are not implied by passing H2 tests.

## Booking concurrency and statuses

`BookingServiceImpl.request()` opens one transaction, acquires `PESSIMISTIC_WRITE` on the resource row, checks active status/capacity/time and overlap, then inserts the booking and its notification before commit. Every booking writer locks the same resource row. This serializes requests even when a resource has no previous bookings. Two active slots conflict when `existingStart < requestedEnd && existingEnd > requestedStart`. Equality at the boundary is allowed. PENDING and APPROVED block; REJECTED, CANCELLED and COMPLETED do not. Cancellation and administrator transitions also lock the resource; refreshing the loaded booking after acquiring the lock avoids stale status checks. Direct manual database writes bypass this application-level protocol.

Approved ended bookings are marked COMPLETED explicitly by an administrator. No scheduled background completion job is claimed. Deactivating resources or users does not cancel existing bookings. Resource approval is blocked while the resource is inactive; existing approved reservations are retained. Users can cancel only their own future pending or approved bookings. No physical deletion endpoint is exposed, preserving audit history.

## OOP and Advanced Java coverage

| Concept | Actual location | Explanation |
|---|---|---|
| Classes/objects | All entities, DataInitializer | Instances represent real users, resources and reservations |
| Encapsulation | User private password with accessors | The hash is hidden from JSON; modification goes through encoder-backed account flows |
| Inheritance | Entities extend BaseEntity | Shared identity, timestamps and lifecycle callback |
| Polymorphism | label() overrides; injected BookingService | Entity-specific labels and service implementation through a contract |
| Abstraction | abstract BaseEntity | Common persistence state with an abstract label method |
| Interfaces | BookingService, JpaRepository extensions | Business contract and generic persistence abstractions |
| Exception handling | DomainException, ErrorHandler | Validation failures become understandable HTTP 400 responses |
| Collections/generics | List<Booking>, Map<String,Object>, repositories | Typed records and reporting data |
| Streams | reports/export/catalogue and conflict filtering | Filter and summarize actual collections |
| JDBC | ApiController.reports() | JdbcTemplate runs four real aggregate SELECT queries against the configured database |
| Transactions | BookingServiceImpl | Booking validation, insert and notification commit atomically |
| Concurrent request handling | Servlet request threads and resource row locks | Important state is protected by database locking; test uses ExecutorService |

Spring Data JPA performs the entity CRUD operations using prepared parameters. JdbcTemplate, backed by the same DataSource/Hikari connection pool, performs reporting; it handles statement/result-set cleanup and returns borrowed connections. The aggregate SQL has no interpolated user input. CSV exports include names and booking details but omit email, university IDs and password hashes; spreadsheet formula prefixes are neutralized. Reports count all historical bookings rather than pretending to measure attended sessions.

## Administrator access and viva demonstration

Log in using the configured administrator email/password. Role is loaded server-side; ordinary users receive 403 on `/api/admin/**`. Registering with role ADMIN is rejected. Student/faculty roles are assigned only from the validated registration input. CSRF tokens are obtained from `/api/csrf` and renewed after sign-in/sign-out.

Demonstrate: sign in as a student, filter the catalogue, inspect a resource/date, create a future request, try an overlapping interval, then an adjacent interval. Sign in as administrator, approve/reject requests, edit/deactivate a resource, review account history, view JdbcTemplate report charts and download a filtered CSV. Return to the student account to see the status and notifications, then cancel an eligible booking. Run `mvn test` and show the concurrency test during viva.

## Railway deployment

Push this source (exclude `data`, `tools`, `target`, private environment files and generated report outputs if desired) to a GitHub repository connected to Railway. Create a Railway service from it; the Dockerfile builds the Java executable. Attach PostgreSQL/Neon, set prod variables above, and generate a public domain targeting PORT 8080 (or Railway's assigned PORT). Keep DEMO_DATA=false on production. Provision an administrator through variables. The application does not require a Node runtime. A permanent deployment URL is only valid after the service successfully starts and is verified; localhost is not a deployed link.

## Troubleshooting and limits

- `mvn`/Java not found: install the prerequisites, reopen VS Code, check JAVA_HOME and PATH.
- Port 8080 busy: set PORT=8081. Do not run two processes against the same H2 file.
- Login fails: check email, active status and original configured administrator password. Existing account passwords are not reset on restart.
- Database connection fails: check JDBC prefix, credentials, SSL and database reachability.
- HTTPS production login fails over HTTP: the prod cookie requires HTTPS.
- An overlapping request is intentionally blocked even if the existing booking is still pending.
- The app validates email syntax but does not verify university ownership or send verification emails. Password recovery, email/SMS, recurring reservations and SSO are future extensions.
- Schema initialization uses Hibernate, not versioned migrations. PostgreSQL execution and production load testing must be verified on the destination database. No claim of verified production scalability is made.
- Images use reliable CSS illustrations. Optional image URLs are stored but not rendered yet.
- The dashboard/reports show database values. Demo records are optional; no random statistics are fabricated.
- University/team placeholders in the template front pages remain unchanged as requested. Complete them manually before submission if needed. Team effort percentages/signatures must be supplied honestly by the team.
- The report must describe a browser-based UI, Spring MVC/Security/JPA, PostgreSQL/H2 and JdbcTemplate; replace the template's Swing/JavaFX/SQLite examples. Full source listings are included in boxed, wrapped monospaced report listings.

## References

Spring Boot: https://docs.spring.io/spring-boot/ ; Spring Data JPA locking: https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html ; Spring Security: https://docs.spring.io/spring-security/reference/ ; PostgreSQL: https://www.postgresql.org/docs/ ; H2: https://h2database.com/html/main.html ; Railway: https://docs.railway.com/ . Implementation and report were prepared with AI assistance; team members must review and understand the work before signing the supplied declaration.
