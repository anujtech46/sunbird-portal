import { TelemetryModule } from '@sunbird/telemetry';
import { LearnRoutingModule } from './learn-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@sunbird/shared';
import { SuiModule } from 'ng2-semantic-ui/dist';
import { SlickModule } from 'ngx-slick';
import { NgInviewModule } from 'angular-inport';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LearnPageComponent, CoursePlayerComponent, CourseConsumptionHeaderComponent,
  CourseConsumptionPageComponent, BatchDetailsComponent, EnrollBatchComponent, CreateBatchComponent,
  UpdateCourseBatchComponent, CarriculumCardComponent, CourseBadgeComponent, CoursePriceComponent,
  CourseCertificateComponent, CourseBenefitComponent } from './components';
import { CourseConsumptionService, CourseBatchService, CourseProgressService, CourseBadgeService,
          JuliaNoteBookService, CoursePriceService, CourseCertificateService } from './services';
import { CoreModule } from '@sunbird/core';
import { DiscussionModule } from '@sunbird/discussion';
import { NotesModule } from '@sunbird/notes';
import { DashboardModule } from '@sunbird/dashboard';

@NgModule({
  imports: [
  CommonModule,
    SharedModule,
    SuiModule,
    DashboardModule,
    SlickModule,
    FormsModule,
    LearnRoutingModule,
    CoreModule,
    // DiscussionModule,
    ReactiveFormsModule,
    NotesModule,
    TelemetryModule,
    NgInviewModule
  ],
  providers: [CourseConsumptionService, CourseBatchService, CourseProgressService, CourseBadgeService,
     JuliaNoteBookService, CoursePriceService, CourseCertificateService],
  declarations: [LearnPageComponent, CoursePlayerComponent, CourseConsumptionHeaderComponent,
    CourseConsumptionPageComponent, BatchDetailsComponent, EnrollBatchComponent, CreateBatchComponent,
    UpdateCourseBatchComponent, CarriculumCardComponent,
     CourseBadgeComponent, CoursePriceComponent, CourseCertificateComponent, CourseBenefitComponent,
     CourseBenefitComponent]
})
export class LearnModule { }
