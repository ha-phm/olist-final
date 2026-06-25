/**
 * Format helper utilities
 */


export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return 'Chưa xác định';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const truncateText = (text: string, length = 15) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
