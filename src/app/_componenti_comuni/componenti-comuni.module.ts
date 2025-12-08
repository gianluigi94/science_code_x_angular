import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SfondoComponent } from './sfondo/sfondo.component';
import { TitlesMainComponent } from './titles-main/titles-main.component';
import { AppButtonComponent } from '../_benvenuto/shared/app-button/app-button.component';
import { FooterComponent } from './footer/footer.component';
import { MainIntroComponent } from '../_benvenuto/main-intro/main-intro.component';
import { HeaderComponent } from './header/header.component';
import { BottoneAudioComponent } from './bottone-audio/bottone-audio.component';
import { SaturnoComponent } from './saturno/saturno.component';
import { ToastContainerComponent } from './toast-container/toast-container.component';
import { CaroselloNovitaComponent } from '../_catalogo/carosello-novita/carosello-novita.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { PaginaCaricamentoComponent } from './pagina-caricamento/pagina-caricamento.component';

@NgModule({
  declarations: [
    SfondoComponent,
    TitlesMainComponent,
    AppButtonComponent,
    FooterComponent,
    MainIntroComponent,
    HeaderComponent,
    BottoneAudioComponent,
    SaturnoComponent,
    ToastContainerComponent,
    CaroselloNovitaComponent,
    SpinnerComponent,
    PaginaCaricamentoComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
  ],
  exports: [
    SfondoComponent,
    TitlesMainComponent,
    AppButtonComponent,
    FooterComponent,
    MainIntroComponent,
    HeaderComponent,
    BottoneAudioComponent,
    SaturnoComponent,
    ToastContainerComponent,
    CaroselloNovitaComponent,
    SpinnerComponent,
    PaginaCaricamentoComponent, // 👈 aggiunto
  ],
})
export class ComponentiComuniModule {}
