import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core'; // 👈 aggiungi questo

import { BenvenutoRoutingModule } from './benvenuto-routing.module';
import { WelcomeComponent } from './welcome/welcome.component';
import { LoginComponent } from './login/login.component';
import { ComponentiComuniModule } from '../_componenti_comuni/componenti-comuni.module';

@NgModule({
  declarations: [
    WelcomeComponent,
    LoginComponent,
  ],
  imports: [
    CommonModule,
    BenvenutoRoutingModule,
    ComponentiComuniModule,
    ReactiveFormsModule,
    TranslateModule, // 👈 e questa riga
  ],
})
export class BenvenutoModule {}
