export const USER_ROLES = {
  ADMIN: 'admin',
  PROPERTY_MANAGER: 'propertyManager',
  UNIT_OWNER: 'unitOwner',
  TENANT: 'tenant',
  SERVICE_PROVIDER: 'serviceProvider',
  PUBLIC: 'public',
};

export const UNIT_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  RENTED: 'rented',
};

export const TICKET_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  RATED: 'rated',
  CLOSED: 'closed',
};

export const HOTSPOT_TYPES = {
  SALE_EXTERNAL: 'saleExternal',
  SALE_INTERNAL: 'saleInternal',
  RENT_EXTERNAL: 'rentExternal',
  RENT_INTERNAL: 'rentInternal',
};

export const HOTSPOT_COLORS = {
  [HOTSPOT_TYPES.SALE_EXTERNAL]: '#22c55e',
  [HOTSPOT_TYPES.SALE_INTERNAL]: '#22c55e',
  [HOTSPOT_TYPES.RENT_EXTERNAL]: '#3b82f6',
  [HOTSPOT_TYPES.RENT_INTERNAL]: '#3b82f6',
};

export const CONTRACT_TYPES = {
  RENT: 'rent',
  OPERATIONS: 'operations',
  MAINTENANCE: 'maintenance',
};

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
};

export const BILL_TYPES = {
  RENT: 'rent',
  COMMISSION: 'commission',
  SERVICE_FEES: 'serviceFees',
  OTHER: 'other',
};

export const BILL_STATUS = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const NOTIFICATION_CHANNELS = {
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
};

export const NOTIFICATION_TYPES = {
  BILL_ISSUED: 'billIssued',
  PAYMENT_REMINDER: 'paymentReminder',
  PAYMENT_CONFIRMED: 'paymentConfirmed',
  PAYMENT_FAILED: 'paymentFailed',
  OVERDUE_NOTICE: 'overdueNotice',
};

export const PAYMENT_METHODS = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  MADA: 'mada',
  CASH: 'cash',
  BANK_TRANSFER: 'bankTransfer',
};

export const CURRENCY = {
  USD: 'USD',
  SAR: 'SAR',
  AED: 'AED',
};
