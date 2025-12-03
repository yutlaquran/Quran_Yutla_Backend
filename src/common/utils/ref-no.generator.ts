export const generateRefNo = (prefix: string): Promise<string> => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return Promise.resolve(`${prefix}-${timestamp}-${random}`);
};
