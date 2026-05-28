export const useRoleAccess = (userRole) => {
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isSecurity = userRole === 'SECURITY';
  const isAnalyst = userRole === 'ANALYST';
  const isViewer = userRole === 'VIEWER';

  const canEdit = isAdmin || isManager;
  const canViewFraud = isAdmin || isSecurity;
  const canViewAlerts = isAdmin || isSecurity;
  const canDelete = isAdmin;

  return {
    isAdmin,
    isManager,
    isSecurity,
    isAnalyst,
    isViewer,
    canEdit,
    canViewFraud,
    canViewAlerts,
    canDelete,
  };
};