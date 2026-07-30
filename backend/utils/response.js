export function sendSuccess(response, data, message = "OK", statusCode = 200) {
  response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
