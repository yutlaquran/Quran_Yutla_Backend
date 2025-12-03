import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('app_settings')
export class AppSetting extends BaseEntity {
  @PrimaryColumn('text')
  name!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;
}
