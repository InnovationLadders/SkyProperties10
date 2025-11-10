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
