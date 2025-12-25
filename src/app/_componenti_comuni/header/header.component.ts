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
import { ApiService } from 'src/app/_servizi_globali/api.service';

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
   authVisuale: Auth | null = null;
 logoutInCorso = false;
 private shieldLogout: HTMLDivElement | null = null;
  distruggi$ = new Subject<void>();

  paginaLogin = false;
  headerPronto = false;
  cambioLinguaService: CambioLinguaService;
  iconaLingua$!: Observable<string>;

  // ✅ gestione spinner sempre durante cambio lingua
  private spinnerStart = 0;
  private readonly MIN_SPINNER = 300;

  constructor(
    private api: ApiService,
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

   this.paginaLogin = this.router.url.startsWith('/benvenuto/login');

this.router.events
  .pipe(
    takeUntil(this.distruggi$),
    filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd)
  )
  .subscribe((ev: NavigationEnd) => {
    const url = ev.urlAfterRedirects || ev.url;
    this.paginaLogin = url.startsWith('/benvenuto/login');
    this.headerPronto = true; // <-- evita flash al reload
  });

    this.authCorrente = this.authService.leggiObsAuth().value;
    this.authVisuale = this.authCorrente;
    this.authService
      .leggiObsAuth()
      .pipe(takeUntil(this.distruggi$))
      .subscribe((auth: Auth) => {
        this.authCorrente = auth;
               if (!this.logoutInCorso) {
         this.authVisuale = auth;
       }
      });

    // ✅ spinner ON appena parte il cambio lingua
    this.cambioLinguaService.cambioLinguaAvviato$
      .pipe(takeUntil(this.distruggi$))
      .subscribe(() => {
        this.spinnerStart = performance.now();
        this.linguaInCambio = true;
      });

    // ✅ spinner OFF solo quando è applicato tutto (traduzioni + mappa + preload img_titolo)
    this.cambioLinguaService.cambioLinguaApplicata$
      .pipe(takeUntil(this.distruggi$))
      .subscribe(() => {
        const elapsed = performance.now() - this.spinnerStart;
        const restante = Math.max(this.MIN_SPINNER - elapsed, 0);

        setTimeout(() => {
          this.linguaInCambio = false;
        }, restante);
      });
  }

  ngOnDestroy(): void {
    try { this.shieldLogout?.remove(); } catch {}
    this.distruggi$.next();
    this.distruggi$.complete();
  }

  onClickCategoria(): void {
    if (this.logoutInCorso) return;
    this.menuCategorieAperto = false;
  }

  clickSbloccoProvvisorio(_ev: Event): void {
    if (this.logoutInCorso) return;
    this.solo_brawser_blocca = false;
  }

  onClickScollegati(): void {
    this.avviaFreezeLogout();
    this.logoutInCorso = true;
    this.api.logout()
      .pipe(take(1))
      .subscribe({
        next: () => this.eseguiLogoutLocale(),
        error: () => this.eseguiLogoutLocale()
      });
  }

   private avviaFreezeLogout(): void {
   if (this.logoutInCorso) return;

   this.logoutInCorso = true;

   // tieni aperto il menu utente (quello dove hai cliccato "Scollegati")
   this.menuUtenteAperto = true;
   // opzionale: blocca anche gli altri stati "hover"
   this.mostraRicerca = false;
   this.menuCategorieAperto = false;

   // blocca QUALSIASI interazione su tutta la pagina
   const shield = document.createElement('div');
   shield.id = 'logout_shield';
   shield.style.position = 'fixed';
   shield.style.top = '0';
   shield.style.left = '0';
   shield.style.width = '100vw';
   shield.style.height = '100vh';
   shield.style.zIndex = '9999';
   shield.style.background = 'transparent';
   shield.style.pointerEvents = 'all';
   // opzionale: cursore "wait"
   shield.style.cursor = 'progress';
   document.body.appendChild(shield);
   this.shieldLogout = shield;
 }

  // onClickScollegati(): void {
  //   this.http.get('/api/v1/logout')
  //     .pipe(take(1))
  //     .subscribe({
  //       next: (response) => {
  //         // Se la risposta è positiva (logout eseguito correttamente)
  //         console.log('Sessione eliminata correttamente, eseguendo logout locale');
  //         this.eseguiLogoutLocale();
  //       },
  //       error: (err) => {
  //         // In caso di errore sul logout, esegui comunque il logout locale
  //         console.error('Errore durante il logout:', err);
  //         this.eseguiLogoutLocale();
  //       }
  //     });
  // }

  // onClickScollegati(): void {
  //
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
    if (this.logoutInCorso) return;
    if (this.disabilitaLingua || this.linguaInCambio) {
      return;
    }

    // ✅ ora lo spinner lo gestiscono gli eventi del service (sempre)
    this.cambioLinguaService.cambiaLingua();
  }
}
