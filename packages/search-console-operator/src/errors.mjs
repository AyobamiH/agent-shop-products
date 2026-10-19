const group = (codes, message, retryable = false) => Object.fromEntries(codes.map(code => [code, [message, retryable]]));

const messages = Object.freeze({
  INVALID_ARGUMENT: ['Check the command arguments against the tool schema.', false],
  UNKNOWN_TOOL: ['Choose an implemented tool from the tools command.', false],
  UNKNOWN_COMMAND: ['Use help to see the supported commands.', false],
  FEATURE_NOT_IMPLEMENTED: ['This option is not implemented in this version. Use the supported filters shown by get_filter_options.', false],
  AUTH_REQUIRED: ['Connect your Google account with the auth command, or explicitly select an existing owner credential directory.', false],
  AUTHENTICATION_REQUIRED: ['Connect your Google account with the auth command.', false],
  AUTH_FAILED: ['Google authorisation could not be completed. Start a new auth command.', false],
  AUTH_TIMEOUT: ['Google authorisation expired. Start a new auth command.', false],
  AUTH_CALLBACK_INVALID: ['The authorisation callback was invalid. Start a new auth command.', false],
  AUTHORIZATION_DENIED: ['Google authorisation was declined. Start a new auth command when ready.', false],
  CREDENTIALS_NOT_FOUND: ['No credential was found in the selected directory. Run auth or select the correct owner credential directory.', false],
  CREDENTIALS_INVALID: ['The selected credential is invalid. Reconnect with the auth command.', false],
  CREDENTIAL_STORAGE_ERROR: ['The private credential directory could not be accessed safely. Check its ownership and permissions.', false],
  GRANT_REVOKED: ['Google access expired or was revoked. Reconnect with the auth command.', false],
  GOOGLE_GRANT_EXPIRED_OR_REVOKED: ['Google access expired or was revoked. Reconnect with the auth command.', false],
  PERMISSION_DENIED: ['The connected Google account does not have permission for this operation.', false],
  PROPERTY_ACCESS_DENIED: ['The connected Google account cannot read this property. Check access using list_sites.', false],
  PROPERTY_NOT_FOUND: ['Choose an exact accessible property from list_sites.', false],
  PROPERTY_UNVERIFIED: ['Verify this property in Google Search Console before requesting reports.', false],
  API_DISABLED: ['Enable the Google Search Console API in the OAuth application project.', false],
  GOOGLE_API_DISABLED: ['Enable the required Google API in the OAuth application project.', false],
  QUOTA_EXCEEDED: ['Google quota is exhausted. Wait for the quota to recover before retrying.', true],
  PROVIDER_RATE_LIMITED: ['Google limited this request. Wait before retrying.', true],
  PROVIDER_UNAVAILABLE: ['Google is temporarily unavailable. Retry later.', true],
  PROVIDER_REQUEST_FAILED: ['The provider request failed. Check the connection and selected property.', false],
  PROVIDER_REQUEST_TIMEOUT: ['The provider request timed out. Retry later or request a shorter period.', true],
  PROVIDER_RESPONSE_INVALID: ['The provider response could not be validated. No report was inferred from it.', false],
  PROVIDER_RESPONSE_TOO_LARGE: ['The provider response was too large. Request a smaller page or date range.', false],
  REQUEST_ABORTED: ['The request was cancelled before completion.', false],
  OPERATION_CANCELLED: ['The operation was cancelled before completion.', false],
  OPERATION_IN_PROGRESS: ['Another operation holds the private store lock. Wait for that operation to finish.', true],
  DATA_NOT_AVAILABLE: ['No usable data is available for the requested scope and period.', false],
  DATE_RANGE_UNAVAILABLE: ['The requested date range is outside the available reporting window.', false],
  SNAPSHOT_NOT_FOUND: ['No snapshot matches that identifier. Use snapshots to list retained reports.', false],
  SNAPSHOT_INVALID: ['The retained snapshot failed validation and cannot be replayed.', false],
  SNAPSHOT_READ_FAILED: ['The retained snapshot could not be read safely.', false],
  SNAPSHOT_WRITE_FAILED: ['The report could not be retained. Check storage before retrying.', false],
  SNAPSHOT_STORE_UNAVAILABLE: ['The selected snapshot store could not be opened safely.', false],
  SNAPSHOT_STORE_CORRUPT: ['The snapshot store failed an integrity check. Restore a verified backup before using it.', false],
  STORAGE_ERROR: ['The private store could not be accessed safely. Check ownership, permissions and available space.', false],
  CONFIGURATION_REQUIRED: ['Complete the required local configuration before using this command.', false],
  TOOL_RESULT_TOO_LARGE: ['The result is too large for one MCP message. Request fewer rows or a shorter period.', false],
  INTERNAL_ERROR: ['The operation could not be completed. No unverified result is being returned.', false],
  ...group(['GOOGLE_REQUIRED_SCOPE_MISSING', 'GOOGLE_SCOPE_TOO_BROAD', 'GOOGLE_CREDENTIAL_NOT_VERIFIED', 'GOOGLE_OFFLINE_GRANT_MISSING'], 'The selected Google grant does not meet this operator\'s requirements. Connect using the auth command.'),
  ...group(['GOOGLE_ENDPOINT_NOT_PERMITTED', 'PRIVATE_PATH_INVALID', 'PRIVATE_STORE_SYMLINK', 'PRIVATE_STORE_PERMISSION_UNSAFE', 'PRIVATE_FILE_PERMISSION_OR_SIZE_UNSAFE', 'PRIVATE_FILE_INVALID'], 'The operation failed a local access or configuration check. Check the selected paths and private file permissions.'),
  ...group(['GOOGLE_TRANSPORT_UNAVAILABLE', 'GOOGLE_TEMPORARILY_UNAVAILABLE'], 'Google is temporarily unavailable. Retry later.', true),
  ...group(['GOOGLE_RESPONSE_EMPTY', 'GOOGLE_RESPONSE_TOO_LARGE', 'GOOGLE_RESPONSE_NOT_JSON', 'GOOGLE_ACCESS_TOKEN_INVALID'], 'The Google response could not be validated. No report was inferred from it.'),
  ...group(['GOOGLE_AUTHENTICATION_FAILED', 'GOOGLE_OWNER_IDENTITY_MISMATCH'], 'The selected Google connection could not be verified. Reconnect using the auth command.'),
  ...group(['GOOGLE_ACCESS_DENIED', 'GOOGLE_REQUEST_REJECTED'], 'Google refused the request. Check the selected property, account access and request options.'),
  ...group(['GOOGLE_RATE_LIMITED'], 'Google limited this request. Wait before retrying.', true),
  ...group(['GOOGLE_OPERATION_ALREADY_LOCKED'], 'Another Google operation holds the private credential lock. Wait for it to finish.', true),
  ...group(['DESKTOP_OAUTH_CLIENT_REQUIRED', 'OAUTH_LOCAL_CONFIGURATION_INVALID'], 'Use a valid private Google Desktop OAuth client file and local connection settings.'),
  ...group(['OAUTH_STATE_INVALID', 'OAUTH_CODE_INVALID', 'GOOGLE_CONSENT_DECLINED', 'GOOGLE_AUTHORIZATION_EXPIRED', 'GOOGLE_AUTHORIZATION_FAILED', 'GOOGLE_AUTHORIZATION_CANCELLED'], 'Google authorisation did not complete. Start a new auth command when ready.'),
  ...group(['GOOGLE_LOCAL_LISTENER_UNAVAILABLE'], 'The local authorisation listener could not start. Check the selected port and retry.'),
  ...group(['GOOGLE_AUTHORIZATION_STATUS_UNAVAILABLE'], 'The connection outcome is reported, but its local status receipt or cleanup could not be completed. Check status and the private filesystem before starting another auth command.'),
  ...group(['PROVIDER_SECTION_FAILED'], 'A required provider report section failed. No complete report was inferred.', true),
  ...group(['SNAPSHOT_SAVE_FAILED'], 'The report could not be retained. Check the private snapshot store before retrying.'),
  ...group(['TOOL_NOT_FOUND'], 'Choose an implemented tool from the tools command.'),
  ...group(['SC_ABORTED'], 'The request was cancelled before completion.'),
  ...group(['SC_SIGNAL_INVALID', 'SC_DATE_INVALID', 'SC_CLOCK_INVALID', 'SC_DATE_SHIFT_INVALID', 'SC_WINDOW_INVALID', 'SC_WINDOW_IN_FUTURE', 'SC_WINDOW_DAYS_INVALID', 'SC_PROPERTY_INVALID', 'SC_QUERY_INVALID', 'SC_QUERY_FIELD_UNSUPPORTED', 'SC_DIMENSIONS_INVALID', 'SC_FILTERS_INVALID', 'SC_FILTER_INVALID', 'SC_FILTER_OPERATOR_INVALID', 'SC_SEARCH_TYPE_INVALID', 'SC_DATA_STATE_INVALID', 'SC_AGGREGATION_INVALID', 'SC_ROW_LIMIT_INVALID', 'SC_START_ROW_INVALID'], 'Check the report scope, dates and filters against the tool schema.'),
  ...group(['SC_METRIC_INVALID', 'SC_ROWS_INVALID', 'SC_ROW_INVALID', 'SC_METRIC_OVERFLOW', 'SC_RESPONSE_INVALID', 'SC_RESPONSE_TOO_LARGE', 'SC_RESPONSE_ROW_LIMIT_VIOLATION', 'SC_SITE_LIST_INVALID', 'SC_SITE_LIST_DUPLICATE'], 'The provider data failed validation. No reliable report can be inferred from it.'),
  ...group(['SC_SESSION_INVALID'], 'The Google connection is unavailable. Connect using the auth command.'),
  ...group(['SC_PROVIDER_REQUEST_FAILED'], 'The Google report request failed. Check the connection and selected property.'),
  ...group(['SC_PROVIDER_AGGREGATION_CHANGED', 'SC_PROVIDER_DUPLICATE_KEYS', 'SC_COLLECTION_BYTE_LIMIT', 'SC_COLLECTION_REQUEST_LIMIT', 'SC_COLLECTION_ROW_LIMIT'], 'The requested collection could not be completed. Use a narrower report and inspect its coverage.'),
  ...group(['SNAPSHOT_INVALID_BYTE_LIMIT', 'SNAPSHOT_INVALID_CAPTURE_TIME', 'SNAPSHOT_INVALID_ID', 'SNAPSHOT_INVALID_TOOL', 'SNAPSHOT_INVALID_LIST_LIMIT'], 'Check the snapshot identifier, options and supported limits.'),
  ...group(['SNAPSHOT_JSON_CYCLE', 'SNAPSHOT_JSON_TOO_DEEP', 'SNAPSHOT_NON_JSON_VALUE', 'SNAPSHOT_TOO_LARGE', 'SNAPSHOT_INVALID_ENVELOPE'], 'The report could not be retained as a valid bounded snapshot.'),
  ...group(['SNAPSHOT_ALGORITHM_UNSUPPORTED', 'SNAPSHOT_SCHEMA_UNSUPPORTED'], 'This version cannot read that snapshot schema or algorithm. Use a compatible operator version.'),
  ...group(['SNAPSHOT_DIRECTORY_CREATE_FAILED', 'SNAPSHOT_DIRECTORY_NOT_FOUND', 'SNAPSHOT_DIRECTORY_UNSAFE', 'SNAPSHOT_INVALID_DIRECTORY', 'SNAPSHOT_FILE_UNSAFE'], 'The private snapshot directory or file could not be accessed safely. Check its ownership and permissions.'),
  ...group(['SNAPSHOT_CHANGED_DURING_READ', 'SNAPSHOT_ID_MISMATCH', 'SNAPSHOT_CORRUPT', 'SNAPSHOT_EXISTING_CORRUPT'], 'The retained snapshot failed an integrity check. No report was replayed.'),
  ...group(['SNAPSHOT_LIST_FAILED', 'SNAPSHOT_LIST_LIMIT_EXCEEDED'], 'The snapshot listing could not be completed within its supported storage limits.'),
});

export function publicError(error) {
  let candidate;
  try { candidate = error && typeof error === 'object' ? error.code : undefined; } catch { /* Untrusted exception accessor. */ }
  const code = typeof candidate === 'string' && Object.hasOwn(messages, candidate) ? candidate : 'INTERNAL_ERROR';
  const [message, retryable] = messages[code];
  return { code, message, retryable };
}

export function operationError(code) {
  const safe = publicError({ code });
  return Object.assign(new Error(safe.message), { code: safe.code });
}
