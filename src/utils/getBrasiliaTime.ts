const getBrasiliaTime = () => {
  const now = new Date();
  const utcOffset = -3; // Horário de Brasília (UTC-3)
  now.setHours(now.getUTCHours() + utcOffset);
  return now.toISOString(); // Retorna no formato ISO
};
export default getBrasiliaTime;
