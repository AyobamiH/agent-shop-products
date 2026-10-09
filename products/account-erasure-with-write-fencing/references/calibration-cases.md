# Calibration cases

- A fresh session returns 401 after deletion: session rejection is proved; already admitted work remains untested.
- A paused old writer resumes after deletion and recreates state: fencing acceptance fails even if the deletion receipt was successful.
- Registry writes reject but a credential vault accepts the old generation: the credential fence is incomplete.
- A synthetic fixture passes the admit/pause/delete/resume race: report fixture acceptance separately from customer cleanup.
- Fresh indexed reads are empty but an external provider token remains valid: report indexed deletion and separate external revocation.
- A retained tombstone prevents recreation: describe its purpose and retention without exposing deleted personal data.
