import { Timestamp } from 'firebase/firestore';

/**
 * Safely converts a value to a Date object.
 * Handles Firestore Timestamps, strings, and missing values.
 */
export function safeDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date() : date;
}
