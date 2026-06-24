/**
 * Format helper utilities
 */

export const formatCurrency = (value: number, currency: 'USD' | 'VND' | 'BRL' = 'BRL') => {
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  } else if (currency === 'VND') {
    // 1 BRL is roughly equal to 4,500 VND in our custom scaling or currency conversion
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value * 4500);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
};

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
