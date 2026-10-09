/** Explicit handlers prevent unsupported writes falling through to HTML 200. */
function rejectWrite() {
  return Response.json(
    { error: "Read-only discovery surface; use GET" },
    {
      status: 405,
      headers: { allow: "GET" },
    },
  );
}

export const readOnlyWriteHandlers = {
  POST: rejectWrite,
  PUT: rejectWrite,
  PATCH: rejectWrite,
  DELETE: rejectWrite,
};
