import { Injectable } from '@angular/core';
import { CanDeactivate, Router } from '@angular/router';
import { LoginComponent } from '../_benvenuto/login/login.component';
import { SaturnoService } from 'src/app/_servizi_globali/animazioni_saturno/three/saturno.service';
import { SaturnoRouteAnimazioniService } from 'src/app/_servizi_globali/animazioni_saturno/gsap/saturno-route-animazioni.service';
import { AnimateService } from 'src/app/_servizi_globali/animazioni_saturno/animate.service';

@Injectable({ providedIn: 'root' })
export class LoginUscitaGuard implements CanDeactivate<LoginComponent> {
  constructor(
  private router: Router,
  private saturnoService: SaturnoService,
  private saturnoRouteAnimazioniService: SaturnoRouteAnimazioniService,
  private animateService: AnimateService
) {}


  canDeactivate(
  component: LoginComponent,
  _currentRoute: any,
  _currentState: any,
  nextState?: any
): boolean | Promise<boolean> {

    // se stai uscendo per andare al catalogo dopo login OK → niente animazione qui
    if (component.saltaAnimazioneUscita) {
      return true;
    }

    // cerco di capire dove stai andando (freccia indietro → di solito / o /welcome)
   const targetUrl =
  (nextState?.url as string) ||
  this.router.getCurrentNavigation()?.finalUrl?.toString() ||
  '';

const vaInBenvenuto =
  targetUrl === '/' ||
  targetUrl === '' ||
  targetUrl === '/benvenuto' ||
  targetUrl.startsWith('/benvenuto');

if (vaInBenvenuto) {
  const scene = this.saturnoService.getScene();
  const light = this.saturnoService.getDirectionalLight();

  this.animateService.setXGif();
  this.animateService.animateTitoloVersoCentroGlobal(1.25, 0);

  if (scene) {
    this.saturnoRouteAnimazioniService.animaVerso(
      scene,
      'WELCOME_ALTO',
      1.25,
      light || undefined
    );
  }
}



    // in parallelo parte anche l'uscita del login (GSAP)
    return component.animaUscita().then(() => true);
  }
}
