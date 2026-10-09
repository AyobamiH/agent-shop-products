# Calibration cases

- App has contents and pull-request grants; customer has read: deny the write objective.
- Customer has write; selected App lacks the required grant: deny the objective.
- Installation metadata omits a push flag: inspect actual App grants and customer permission; do not infer the customer's role from that flag.
- Permission says write but returned actor differs: fail closed.
- Permission read returns 403, 404 or malformed data: deny admission with a scoped reason.
- Repair is merged and deployed, but current customer is read-only: deployment passed; a fresh write journey is still gated.

## Primary references

- [GitHub repository collaborator permissions](https://docs.github.com/en/rest/collaborators/collaborators#get-repository-permissions-for-a-user): effective base permission and role mapping.
- [Choosing permissions for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/choosing-permissions-for-a-github-app): installation capability.

Use the current API contract and existing application policy. Never expose installation credentials in diagnostics.
