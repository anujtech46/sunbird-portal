import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuidelineRoutingModule } from './guideline-routing.module';
import { SuiModule } from 'ng2-semantic-ui/dist';
import { DataPrivacyPolicyComponent, TermsOfUserComponent} from './component/index';

import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  imports: [
    SuiModule,
    CommonModule,
    GuidelineRoutingModule,
    PdfViewerModule
  ],
  declarations: [TermsOfUserComponent, DataPrivacyPolicyComponent]
})
export class GuidelineModule { }
