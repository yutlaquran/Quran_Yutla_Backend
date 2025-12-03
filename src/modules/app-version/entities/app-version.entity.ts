import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('app_versions')
export class AppVersion extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'android_version' })
  androidVersion: string;

  @Column({ name: 'android_end_date', type: 'date' })
  androidEndDate: string;

  @Column({ name: 'android_url' })
  androidUrl: string;

  @Column({ name: 'ios_version' })
  iosVersion: string;

  @Column({ name: 'ios_end_date', type: 'date' })
  iosEndDate: string;

  @Column({ name: 'ios_url' })
  iosUrl: string;
}
