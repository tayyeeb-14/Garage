export const sendSuccess = <T>(res: any, data: T, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

export const sendError = (res: any, message: string, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};
