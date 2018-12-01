import { TelemetryModule } from '@sunbird/telemetry';
import { LearnRoutingModule } from './learn-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@sunbird/shared';
import { SuiModule } from 'ng2-semantic-ui/dist';
import { SlickModule } from 'ngx-slick';
import { NgInviewModule } from 'angular-inport';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  LearnPageComponent, CoursePlayerComponent, CourseConsumptionHeaderComponent,
  CourseConsumptionPageComponent, BatchDetailsComponent, EnrollBatchComponent, CreateBatchComponent,
  UpdateCourseBatchComponent, CarriculumCardComponent } from './components';
import { CourseConsumptionService, CourseBatchService, CourseProgressService } from './services';
import { CoreModule } from '@sunbird/core';
import { NotesModule } from '@sunbird/notes';
import { DashboardModule } from '@sunbird/dashboard';
import { NgxY2PlayerModule } from 'ngx-y2-player';

// Julia Related services
import { CourseBadgeService, JuliaNoteBookService, CoursePriceService, CourseCertificateService } from './services';
import { CourseBadgeComponent, CoursePriceComponent, CourseCertificateComponent, CourseBenefitComponent,
  CourseInstructorComponent } from './components';

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
    ReactiveFormsModule,
    NotesModule,
    TelemetryModule,
    NgInviewModule,
    NgxY2PlayerModule
  ],
  providers: [CourseConsumptionService, CourseBatchService, CourseProgressService,
    CourseBadgeService,
    JuliaNoteBookService,
    CoursePriceService,
    CourseCertificateService
  ],
  declarations: [LearnPageComponent, CoursePlayerComponent, CourseConsumptionHeaderComponent,
    CourseConsumptionPageComponent, BatchDetailsComponent, EnrollBatchComponent, CreateBatchComponent,
    UpdateCourseBatchComponent, CarriculumCardComponent,
    CourseBadgeComponent,
    CoursePriceComponent,
    CourseCertificateComponent,
    CourseBenefitComponent,
    CourseInstructorComponent
  ]
})
export class LearnModule { }
