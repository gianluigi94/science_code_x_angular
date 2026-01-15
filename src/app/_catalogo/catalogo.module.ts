import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CatalogoRoutingModule } from './catalogo-routing.module';
import { CatalogoComponent } from './catalogo/catalogo.component';
import { FilmComponent } from './film/film.component';
import { SerieComponent } from './serie/serie.component';
import { ComponentiComuniModule } from '../_componenti_comuni/componenti-comuni.module';
import { SaturnoModule } from '../_componenti_comuni/saturno/saturno.module';
import { RigaCategoriaComponent } from './app-riga-categoria/riga-categoria.component';
@NgModule({
  declarations: [
    CatalogoComponent,
    FilmComponent,
    SerieComponent,
    RigaCategoriaComponent,

  ],
  imports: [
    CommonModule,
    CatalogoRoutingModule,
    ComponentiComuniModule, // utilizzo dei componenti comunti
    SaturnoModule, // utilizzo di saturno
  ],
})
export class CatalogoModule {}
