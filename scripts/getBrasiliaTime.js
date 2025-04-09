const getBrasiliaTime = () => {
  const now = new Date();
  const utcOffset = -3;
  now.setHours(now.getUTCHours() + utcOffset);
  return now.toISOString();
};
export default getBrasiliaTime;
