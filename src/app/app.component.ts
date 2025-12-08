import { Component, OnInit } from '@angular/core';
import { CambioLinguaService } from './_servizi_globali/cambio-lingua.service';
import { TraduzioniService } from './_servizi_globali/traduzioni.service';
import { ErroreGlobaleService } from './_servizi_globali/errore-globale.service';
import { ToastService } from './_servizi_globali/toast.service';
import { StatoSessioneClientService } from './_servizi_globali/stato-sessione-client.service';
import { TranslateService } from '@ngx-translate/core';
import { SaturnoService } from './_servizi_globali/animazioni_saturno/three/saturno.service'; // 👈 NUOVO


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  traduzioniPronte$ = this.traduzioniService.traduzioniInizialiCaricate$;
  erroreFatale$ = this.erroreGlobaleService.erroreFatale$;
  sessioneVerificata$ = this.statoSessioneClient.sessioneVerificata$;
  saturnoPronto$ = this.saturnoService.saturnoPronto$; // 👈 NUOVO

  private loaderVisibile = true;

  constructor(
    private cambioLinguaService: CambioLinguaService,
    private traduzioniService: TraduzioniService,
    private erroreGlobaleService: ErroreGlobaleService,
    private toastService: ToastService,
    private statoSessioneClient: StatoSessioneClientService,
    private translate: TranslateService,
    private saturnoService: SaturnoService, // 👈 NUOVO
  ) {}


  ngOnInit(): void {
  const haToastBenvenuto = localStorage.getItem('toast_benvenuto');

  if (haToastBenvenuto !== null) {
    const codiceLingua = this.cambioLinguaService.leggiCodiceLingua();

    const testo =
      codiceLingua === 'it'
        ? '\nBENTORNATO!\n\nLa tua precedente sessione è scaduta,\nripeti l\'accesso e riprendi la visione dei tuoi contenuti preferiti\n\n'
        : '\nWELCOME BACK!\n\nYour previous session has expired,\nplease sign in again to resume watching your favorite content\n\n';

    this.toastService.successo(testo);
    localStorage.removeItem('toast_benvenuto');
  }

    this.erroreGlobaleService.erroreFatale$.subscribe((isFatal) => {
      if (!isFatal) return;

      const tipo = this.erroreGlobaleService.tipoErrore$.value;

      if (tipo === 'server') {
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
    this.sessioneVerificata$.subscribe((sessioneVerificata) => {
  const erroreFatale = this.erroreGlobaleService.erroreFatale$.value;
  const traduzioniPronte = this.traduzioniService.traduzioniInizialiCaricate$.value;
  const saturnoPronto = this.saturnoService.saturnoPronto$.value;

  const deveMostrareLoader =
    erroreFatale || !traduzioniPronte || !sessioneVerificata || !saturnoPronto;

  if (this.loaderVisibile && !deveMostrareLoader) {
    this.loaderVisibile = false;
    const now = performance.now();
    console.log('LOADER SPARITO alle ' + now + ' ms');
  }
});

  }
}
