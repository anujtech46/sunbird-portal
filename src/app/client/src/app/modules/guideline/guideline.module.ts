import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuidelineRoutingModule } from './guideline-routing.module';
import { SuiModule } from 'ng2-semantic-ui/dist';
import { DataPrivacyPolicyComponent, TermsOfUserComponent, AboutForWaterComponent} from './component/index';
import { TelemetryModule } from '@sunbird/telemetry';
@NgModule({
  imports: [
    SuiModule,
    CommonModule,
    TelemetryModule,
    GuidelineRoutingModule
  ],
  declarations: [TermsOfUserComponent, DataPrivacyPolicyComponent, AboutForWaterComponent]
})
export class GuidelineModule { }
