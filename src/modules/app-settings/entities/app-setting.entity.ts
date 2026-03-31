import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('app_settings')
export class AppSetting extends BaseEntity {
  @PrimaryColumn('text')
  name!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ name: 'maintenance_mode', type: 'boolean', default: false })
  maintenanceMode!: boolean;

  @Column({
    name: 'maintenance_message',
    type: 'text',
    nullable: true,
    default: null,
  })
  maintenanceMessage!: string | null;

  @Column({ name: 'allow_registration', type: 'boolean', default: true })
  allowRegistration!: boolean;

  @Column({
    name: 'min_app_version',
    type: 'varchar',
    length: 20,
    default: '1.0.0',
  })
  minAppVersion!: string;
}
