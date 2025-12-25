import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core'; // 👈 aggiungi questo

import { BenvenutoRoutingModule } from './benvenuto-routing.module';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { ComponentiComuniModule } from '../_componenti_comuni/componenti-comuni.module';
import { SaturnoModule } from '../_componenti_comuni/saturno/saturno.module';
@NgModule({
  declarations: [
    WelcomeComponent,
    LoginComponent,
  ],
  imports: [
    CommonModule,
    BenvenutoRoutingModule,
    ComponentiComuniModule,
    SaturnoModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class BenvenutoModule {}
