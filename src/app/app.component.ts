import { Component, OnInit, Inject } from '@angular/core';
import { CambioLinguaService } from './_servizi_globali/cambio-lingua.service';
import { TraduzioniService } from './_servizi_globali/traduzioni.service';
import { ErroreGlobaleService } from './_servizi_globali/errore-globale.service';
import { ToastService } from './_servizi_globali/toast.service';
import { StatoSessioneClientService } from './_servizi_globali/stato-sessione-client.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { PerformanceService } from './_servizi_globali/performance.service'; // <-- metti il path giusto
import { filter, take } from 'rxjs/operators';
import { CaricamentoCaroselloService } from './_catalogo/carosello-novita/carosello_services/caricamento-carosello.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { TitoloPaginaService } from './_servizi_globali/titolo-pagina.service';
import { SaturnoStatoService } from './_servizi_globali/animazioni_saturno/saturno-stato.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  traduzioniPronte$ = this.traduzioniService.traduzioniInizialiCaricate$;
  erroreFatale$ = this.erroreGlobaleService.erroreFatale$;
  sessioneVerificata$ = this.statoSessioneClient.sessioneVerificata$;
  saturnoPronto$ = this.saturnoStatoService.saturnoPronto$;
    caroselloPronto$ = this.caricamentoCaroselloService.caroselloPronto$;
forzaLoaderExtra = false;

private extraLoaderTimer: any = null;
private readonly EXTRA_LOADER_MS = 2600;
devoCaricareTexturePrimaVolta = false;
    deveCaricareImmaginiCarosello = false;
  deveCaricareImmaginiCarosello$ = new BehaviorSubject<boolean>(false);

  caricamentoDisabilitato = false;
  caricamentoDisabilitato$ = new BehaviorSubject<boolean>(false);
  ultimaUrl = '';

  private loaderVisibile = true;
      isFirefox = false;
  loaderAvvioCatalogo = false;



  constructor(
    private cambioLinguaService: CambioLinguaService,
    private traduzioniService: TraduzioniService,
    private erroreGlobaleService: ErroreGlobaleService,
    private toastService: ToastService,
    private statoSessioneClient: StatoSessioneClientService,
    private translate: TranslateService,
     private saturnoStatoService: SaturnoStatoService,
    private router: Router,
    private caricamentoCaroselloService: CaricamentoCaroselloService,
    private titoloPaginaService: TitoloPaginaService,
    private performanceService: PerformanceService,
    @Inject(DOCUMENT) private documento: Document
  ) {}



     ngOnInit(): void {
      this.isFirefox = this.rilevaFirefox();
  const urlIniziale = this.router.url || '';
  this.devoCaricareTexturePrimaVolta = localStorage.getItem('saturnoTextureLoaded') !== 'true';

  this.titoloPaginaService.avvia();
this.performanceService.performanceLevel$
  .pipe(
    filter(level => level !== 'Calcolando...'),
    take(1)
  )
  .subscribe(level => {
    console.log('[Performance] Classificazione GPU:', level);
  });

  this.impostaLangHtml(this.cambioLinguaService.leggiCodiceLingua());
  this.ultimaUrl = urlIniziale;
this.cambioLinguaService.cambioLinguaApplicata$.subscribe(({ codice }) => {
  this.impostaLangHtml(codice);
});



  this.caricamentoDisabilitato = urlIniziale.startsWith('/benvenuto/login');
  this.caricamentoDisabilitato$.next(this.caricamentoDisabilitato);

  this.deveCaricareImmaginiCarosello = urlIniziale.startsWith('/catalogo');
  this.deveCaricareImmaginiCarosello$.next(this.deveCaricareImmaginiCarosello);
  if (this.deveCaricareImmaginiCarosello) this.caricamentoCaroselloService.resetta();



  this.router.events
  .pipe(filter((ev) => ev instanceof NavigationEnd))
  .subscribe((ev: any) => {
    const url = (ev && ev.urlAfterRedirects) ? ev.urlAfterRedirects : (ev && ev.url) ? ev.url : '';
    const precedente = this.ultimaUrl;
    this.ultimaUrl = url;

       if (url.startsWith('/benvenuto/login')) {
     this.toastService.chiudi('toast_benvenuto');
   }

    const disabilitaLoader =
      url.startsWith('/benvenuto/login') ||
      (url.startsWith('/catalogo') && precedente.startsWith('/benvenuto/login'));

    this.caricamentoDisabilitato = disabilitaLoader;
    this.caricamentoDisabilitato$.next(disabilitaLoader);

    const deve = this.isCatalogoHome(url);

    this.deveCaricareImmaginiCarosello = deve;
    this.deveCaricareImmaginiCarosello$.next(deve);

    if (deve && !this.isAreaCatalogo(precedente)) {
      this.caricamentoCaroselloService.resetta();
    }
  });


  const haToastBenvenuto = localStorage.getItem('toast_benvenuto');


  if (haToastBenvenuto !== null) {
    const chiave = 'toast_benvenuto';
    const codiceLingua = this.cambioLinguaService.leggiCodiceLingua();

    const testo =
      codiceLingua === 'it'
        ? '\nBENTORNATO!\n\nLa tua precedente sessione è scaduta,\nripeti l\'accesso e riprendi la visione dei tuoi contenuti preferiti\n\n'
        : '\nWELCOME BACK!\n\nYour previous session has expired,\nplease sign in again to resume watching your favorite content\n\n';

    this.toastService.successo(testo, chiave);
    localStorage.removeItem('toast_benvenuto');
  }



    this.erroreGlobaleService.erroreFatale$.subscribe((isFatal) => {
      if (!isFatal) return;

      const tipo = this.erroreGlobaleService.tipoErrore$.value;

      if (tipo === 'server') {
          // Se stiamo facendo reload per sessione scaduta (caso "toast_benvenuto"),
  // su Firefox possono arrivare errori transitori (es. richieste abortite) che non vanno mostrati.
  if (this.statoSessioneClient.staRicaricando || localStorage.getItem('toast_benvenuto') !== null) {
    return;
  }

        const msg = this.erroreGlobaleService.messaggioErrore$.value;
        const codiceLingua = this.cambioLinguaService.leggiCodiceLingua();
        const base =
          codiceLingua === 'it'
            ? 'Errore imprevisto del server'
            : 'Unexpected server error';
        const suffix =
          codiceLingua === 'it'
            ? " Riprova piu tardi o contatta l'amministratore."
            : ' Please try again later or contact the administrator.';
        const testo = msg ? `${base}: ${msg}.${suffix}` : `${base}.${suffix}`;
        this.toastService.errorePersistente(testo);
        return;
      }

     if (tipo === 'sessione') {
      const codice = this.erroreGlobaleService.codiceSessione$.value;

      let chiave: string;

      if (codice === 'STANDARD') {
        chiave = 'ui.toast.sessione.scollegato';
      } else if (codice === 'INATTIVITA') {
        chiave = 'ui.toast.sessione.inattivita';
      } else if (codice === 'COLLEGATO') {
        chiave = 'ui.toast.sessione.collegato';
      } else {
        chiave = 'ui.toast.sessione.generico';
      }

      const testoSessione = this.translate.instant(chiave);
      this.toastService.allarmPersistenteRipetiAccesso(testoSessione);
    }
    });

    // logghiamo quando il loader sparisce
      combineLatest([
  this.erroreFatale$,
  this.traduzioniPronte$,
  this.sessioneVerificata$,
  this.saturnoPronto$,
  this.caroselloPronto$,
  this.deveCaricareImmaginiCarosello$,
  this.caricamentoDisabilitato$,
]).subscribe(([erroreFatale, traduzioniPronte, sessioneVerificata, saturnoPronto, caroselloPronto, deveCaricare, caricamentoDisabilitato]) => {
  const deveMostrareLoader =
    !caricamentoDisabilitato &&
    (
      erroreFatale
      || !traduzioniPronte
      || !sessioneVerificata
      || !saturnoPronto
      || (deveCaricare && !caroselloPronto)
    );

  // IDENTICO A STAMATTINA: attivo solo su RELOAD di /catalogo, ma non su Firefox
  try {
    const nav = performance.getEntriesByType('navigation') as any[];
    const tipo = nav && nav[0] && nav[0].type ? String(nav[0].type) : '';
    const path = this.pulisciUrl(window.location.pathname || '');
    this.loaderAvvioCatalogo = (tipo === 'reload' && path === '/catalogo');
  } catch {
    this.loaderAvvioCatalogo = false;
  }

  // ============================
  // EXTRA 3s: mantieni il loader
  // ============================
  if (caricamentoDisabilitato) {
    // se il loader è disabilitato, non forzare nulla
    this.forzaLoaderExtra = false;
    if (this.extraLoaderTimer) {
      clearTimeout(this.extraLoaderTimer);
      this.extraLoaderTimer = null;
    }
  } else if (deveMostrareLoader) {
    // se il loader deve stare su per condizioni reali, non usare l'extra
    this.forzaLoaderExtra = false;
    if (this.extraLoaderTimer) {
      clearTimeout(this.extraLoaderTimer);
      this.extraLoaderTimer = null;
    }
 } else {
  // qui sarebbe pronto -> tienilo su altri 3s SOLO se è la prima volta che carico le texture
  if (this.devoCaricareTexturePrimaVolta && this.isFirefox && !this.forzaLoaderExtra) {
    this.forzaLoaderExtra = true;

    if (this.extraLoaderTimer) {
      clearTimeout(this.extraLoaderTimer);
      this.extraLoaderTimer = null;
    }

    this.extraLoaderTimer = setTimeout(() => {
      this.forzaLoaderExtra = false;
      this.extraLoaderTimer = null;

      // da questo momento in poi non voglio più applicare l'extra nella sessione corrente
      this.devoCaricareTexturePrimaVolta = false;
    }, this.EXTRA_LOADER_MS);
  }
}

  // ============================

  if (caricamentoDisabilitato) {
    this.loaderVisibile = false;
  }

  // NB: qui non basta più solo !deveMostrareLoader: finché forzaLoaderExtra è true,
  // il loader deve rimanere "visibile" per il template.
  if (this.loaderVisibile && !deveMostrareLoader && !this.forzaLoaderExtra) {
    this.loaderVisibile = false;

    const now = performance.now();
    console.log('LOADER SPARITO alle ' + now + ' ms');
  }
});




  }


 private pulisciUrl(url: string): string {
  return (url || '').split('?')[0].split('#')[0];
}

private isCatalogoHome(url: string): boolean {
  return this.pulisciUrl(url) === '/catalogo';
}

private isAreaCatalogo(url: string): boolean {
  return this.pulisciUrl(url).startsWith('/catalogo');
}

  private rilevaFirefox(): boolean {
    try {
      const ua = (navigator.userAgent || '').toLowerCase();
      return ua.includes('firefox') && !ua.includes('seamonkey');
    } catch {
      return false;
    }
  }

  private impostaLangHtml(codice: string): void {
  const lang = (codice === 'it') ? 'it' : 'en';
  this.documento.documentElement.setAttribute('lang', lang);
}
}
