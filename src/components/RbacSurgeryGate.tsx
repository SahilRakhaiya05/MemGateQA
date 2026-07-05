interface RbacSurgeryGateProps {
  role: 'owner' | 'reviewer';
  onRoleChange: (role: 'owner' | 'reviewer') => void;
  forgetCount: number;
}

export function RbacSurgeryGate({ role, onRoleChange, forgetCount }: RbacSurgeryGateProps) {
  const blocked = role === 'reviewer' && forgetCount > 0;

  return (
    <div className={`rbac-surgery-gate ${blocked ? 'blocked' : ''}`}>
      <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">Cognee RBAC gate</p>
      <div className="rbac-role-toggle">
        <button
          className={`rbac-role-btn ${role === 'owner' ? 'active' : ''}`}
          onClick={() => onRoleChange('owner')}
          type="button"
        >
          Case Owner — can forget()
        </button>
        <button
          className={`rbac-role-btn ${role === 'reviewer' ? 'active' : ''}`}
          onClick={() => onRoleChange('reviewer')}
          type="button"
        >
          Reviewer — read only
        </button>
      </div>
      {blocked ? (
        <p className="rbac-block-msg">
          Structural gate: Reviewer cannot execute forget() on {forgetCount} target(s). Switch to Case Owner to approve deletion.
        </p>
      ) : (
        <p className="text-xs text-slate-500">Mirrors Cognee permissions — surgery requires authorized role.</p>
      )}
    </div>
  );
}