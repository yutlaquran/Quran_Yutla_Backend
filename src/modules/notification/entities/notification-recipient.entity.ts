import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../../user/entities/user.entity';

@Entity('notification_recipients')
export class NotificationRecipient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, (notification) => notification.recipients)
  notification: Notification;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}