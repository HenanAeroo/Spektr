import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { schema } from './env.validation';
import { EventsModule } from './events/events.module';
import { ApplicationsModule } from './applications/applications.module';
import { FoldersModule } from './folders/folders.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { PromosModule } from './promos/promos.module';
import { ObjectivesModule } from './objectives/objectives.module';
import { ActivityInterceptor } from './shared/interceptors/activity.interceptor';
import { CommunicationsModule } from './communications/communications.module';
import { PromoAccessModule } from './promos/promo-access.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: schema,
    }),
    UsersModule,
    PrismaModule,
    PromoAccessModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 30,
        },
      ],
    }),
    EventsModule,
    ApplicationsModule,
    FoldersModule,
    DocumentsModule,
    NotificationsModule,
    MailModule,
    PromosModule,
    ObjectivesModule,
    CommunicationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
  ],
})
export class AppModule {}
