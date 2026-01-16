import { Module, forwardRef } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { StudentsModule } from '../students/students.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [
    forwardRef(() => StudentsModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => ClassesModule),
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
