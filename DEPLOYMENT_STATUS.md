# Deployment status — 20 November 2026

Source: https://github.com/kolluruvishruth-cpu/silver-octo-guacamole

Railway project: https://railway.com/project/d1af2230-071c-49da-8e02-c6a494524059

Local application: http://localhost:8080

The app builds and all 20 integration tests pass. Actual browser checks cover sign-in, search, overlap rejection, adjacent booking creation, administrator approval, resource editing, reporting, notifications, cancellation and mobile navigation.

Railway project and PostgreSQL template setup were attempted. PostgreSQL is offline, and Railway rejected application deployment with: “We limited this workspace after detecting unusual activity. Upgrade to a paid plan to lift this restriction automatically.” No paid upgrade or billing change was performed. No working hosted URL exists yet.

After resolving the restriction with Railway, deploy the provided repository using its Dockerfile, verify PostgreSQL availability, configure the production service variables described in README, and generate a public domain. Set a unique ADMIN_EMAIL and ADMIN_PASSWORD in the hosting environment. Production demo data defaults to false. Never reuse the local demonstration administrator password in production.

The current report preserves all six original front-matter pages exactly, including their placeholders. Team names, registration numbers, signatures and honest contribution figures remain the team's responsibility.

