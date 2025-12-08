import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter, Observable, take } from 'rxjs';
import { Authservice } from 'src/app/_benvenuto/login/_login_service/auth.service';
import { Auth } from 'src/app/_type/auth.type';
import { CambioLinguaService } from 'src/app/_servizi_globali/cambio-lingua.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { StatoSessioneClientService } from 'src/app/_servizi_globali/stato-sessione-client.service';
import { ErroreGlobaleService } from 'src/app/_servizi_globali/errore-globale.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy {
  mostraRicerca = false;
  menuUtenteAperto = false;
  menuCategorieAperto = false;
  linguaInCambio: boolean = false;

  solo_brawser_blocca = true;
  disabilitaLingua = false;

  authCorrente: Auth | null = null;
  distruggi$ = new Subject<void>();

  paginaLogin = false;

  cambioLinguaService: CambioLinguaService;
  iconaLingua$!: Observable<string>;

  constructor(
    private authService: Authservice,
    private router: Router,
    cambioLinguaService: CambioLinguaService,
    private translate: TranslateService,
    private http: HttpClient,
    private statoSessione: StatoSessioneClientService,
    private erroreGlobale: ErroreGlobaleService
  ) {
    this.cambioLinguaService = cambioLinguaService;
    this.iconaLingua$ = this.cambioLinguaService.iconaLingua$;

    this.paginaLogin = this.router.url.startsWith('/login');

    this.router.events
      .pipe(
        takeUntil(this.distruggi$),
        filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd)
      )
      .subscribe((ev: NavigationEnd) => {
        const url = ev.urlAfterRedirects || ev.url;
        this.paginaLogin = url.startsWith('/login');
      });

    this.authCorrente = this.authService.leggiObsAuth().value;
    this.authService
      .leggiObsAuth()
      .pipe(takeUntil(this.distruggi$))
      .subscribe((auth: Auth) => {
        this.authCorrente = auth;
      });
  }

  ngOnDestroy(): void {
    this.distruggi$.next();
    this.distruggi$.complete();
  }

  onClickCategoria(): void {
    this.menuCategorieAperto = false;
  }

  clickSbloccoProvvisorio(_ev: Event): void {
    this.solo_brawser_blocca = false;
  }

onClickScollegati(): void {
  this.http.get('/api/v1/logout')
    .pipe(take(1))
    .subscribe({
      next: (response) => {
        // Se la risposta è positiva (logout eseguito correttamente)
        console.log('Sessione eliminata correttamente, eseguendo logout locale');
        this.eseguiLogoutLocale();
      },
      error: (err) => {
        // In caso di errore sul logout, esegui comunque il logout locale
        console.error('Errore durante il logout:', err);
        this.eseguiLogoutLocale();
      }
    });
}

// onClickScollegati(): void {

//   this.http.get('https://api.sciencecodex.net/api/v1/logout', { responseType: 'text' as 'json' })
//     .pipe(take(1))
//     .subscribe({
//       next: (response) => {
//         console.log('Sessione eliminata correttamente');
//         this.eseguiLogoutLocale();
//       },
//       error: (err) => {
//         console.error('Errore API (ma procedo al logout locale):', err);
//         this.eseguiLogoutLocale();
//       }
//     });
// }


eseguiLogoutLocale(): void {
  // Reset errore fatale (nessun errore di sessione)
  this.erroreGlobale.resettaErroreFatale();

  // Fai il logout localmente
  this.authService.logout(false);  // Considera che la sessione è già verificata

  // Evita un ricaricamento continuo (per evitare loop di ricarica in caso di errore di backend)
  if (!this.statoSessione.staRicaricando) {
    this.statoSessione.staRicaricando = true;

    // Ricarica solo dopo aver completato tutte le operazioni di logout locale
    setTimeout(() => {
      console.log('Ricaricando la pagina dopo il logout');
      window.location.reload();
    }, 1000); // Ritardo maggiore per dare tempo a tutte le operazioni di completare
  }
}



  cambiaLingua(): void {
    if (this.disabilitaLingua || this.linguaInCambio) {
      return;
    }

    const serveSpinner = this.cambioLinguaService.haBisognoSpinnerProssimoCambio();

    if (!serveSpinner) {
      this.cambioLinguaService.cambiaLingua();
      return;
    }

    this.linguaInCambio = true;
    const start = performance.now();
    const MIN_SPINNER = 300;

    this.translate.onLangChange
      .pipe(take(1))
      .subscribe(() => {
        const elapsed = performance.now() - start;
        const restante = Math.max(MIN_SPINNER - elapsed, 0);

        setTimeout(() => {
          this.linguaInCambio = false;
        }, restante);
      });

    this.cambioLinguaService.cambiaLingua();
  }
}
