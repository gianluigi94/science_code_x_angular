import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatalogoComponent } from './catalogo/catalogo.component';
import { FilmComponent } from './film/film.component';
import { SerieComponent } from './serie/serie.component';

const routes: Routes = [
  {
    path: '',
    component: CatalogoComponent,
  },
  {
    path: 'film',
    component: FilmComponent,
  },
  {
    path: 'serie',
    component: SerieComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogoRoutingModule {}
