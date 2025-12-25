import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AvvioGuard } from './_guard/avvio.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'benvenuto',
  },
  {
    path: 'benvenuto',
    canActivate: [AvvioGuard],
    loadChildren: () =>
      import('./_benvenuto/benvenuto.module').then((m) => m.BenvenutoModule),
  },
  {
    path: 'catalogo',
    canActivate: [AvvioGuard],
    loadChildren: () =>
      import('./_catalogo/catalogo.module').then((m) => m.CatalogoModule),
  },
  {
    path: '**',
    redirectTo: 'benvenuto',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

