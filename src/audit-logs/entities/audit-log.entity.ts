import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  // Biometric / facial-recognition attendance events. All of these go to the
  // same audit_log table so admins have a single compliance view.
  BIOMETRIC_CONSENT_GRANTED = 'BIOMETRIC_CONSENT_GRANTED',
  BIOMETRIC_CONSENT_REVOKED = 'BIOMETRIC_CONSENT_REVOKED',
  FACE_ENROLL = 'FACE_ENROLL',
  FACE_UNENROLL = 'FACE_UNENROLL',
  FACE_UNENROLL_ALL = 'FACE_UNENROLL_ALL',
  FACE_MATCH = 'FACE_MATCH',
  FACE_MANUAL_OVERRIDE = 'FACE_MANUAL_OVERRIDE',
}

// Subset of AuditEventType that covers biometric/face-recognition activity.
// Handy for filtering the audit-log UI to just the compliance-relevant events.
export const BIOMETRIC_EVENT_TYPES: readonly AuditEventType[] = [
  AuditEventType.BIOMETRIC_CONSENT_GRANTED,
  AuditEventType.BIOMETRIC_CONSENT_REVOKED,
  AuditEventType.FACE_ENROLL,
  AuditEventType.FACE_UNENROLL,
  AuditEventType.FACE_UNENROLL_ALL,
  AuditEventType.FACE_MATCH,
  AuditEventType.FACE_MANUAL_OVERRIDE,
] as const;

@Entity({ name: 'audit_log' })
export class AuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'enum',
    enum: AuditEventType,
  })
  eventType: AuditEventType;

  @Index()
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userEmail: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userRole: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
