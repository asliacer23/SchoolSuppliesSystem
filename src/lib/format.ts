export const formatCurrency = (amount: number): string => {
  return `₱${amount.toFixed(2)}`;
};

export const formatDate = (date: string | Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return new Date(date).toLocaleString('en-PH', options);
};

export const formatDateShort = (date: string | Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleString('en-PH', options);
};

export const formatTime = (date: string | Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return new Date(date).toLocaleString('en-PH', options);
};