import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { Authservice } from '../_benvenuto/login/_login_service/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AvvioGuard implements CanActivate {

  private static haGiaLoggatoStato = false;

  constructor(private authService: Authservice, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> {

    const auth = this.authService.leggiObsAuth().value;
    const autenticato = auth && auth.tk !== null;

    // 👇 PRIMA COSA: come il FRONT END considera lo stato di login
    if (!AvvioGuard.haGiaLoggatoStato) {
      AvvioGuard.haGiaLoggatoStato = true;
      console.log('FRONT END LOGGATO: ' + (autenticato ? 'trsue' : 'faslse'));
    }

const url = state.url; // es: '/benvenuto', '/benvenuto/login', '/catalogo'

if (autenticato) {
  if (url === '/' || url === '' || url.startsWith('/benvenuto')) {
    return this.router.parseUrl('/catalogo');
  }
  return true;
} else {
  if (url.startsWith('/catalogo')) {
    return this.router.parseUrl('/benvenuto');
  }
  // opzionale "safety": se qualcuno va su '/' a mano
  if (url === '/' || url === '') {
    return this.router.parseUrl('/benvenuto');
  }
  return true;
}


  }
}
