import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TraduzioniService } from './traduzioni.service';

@Injectable({
  providedIn: 'root',
})
export class CambioLinguaService {
  linguaUtente = 'inglese';
  iconaLingua = 'assets/en.svg';

  iconaLingua$ = new BehaviorSubject<string>(this.iconaLingua);

  constructor(private traduzioniService: TraduzioniService) {
    const linguaSalvata = localStorage.getItem('lingua_utente');

    if (linguaSalvata === 'italiano') {
      this.linguaUtente = 'italiano';
      this.iconaLingua = 'assets/it.svg';
    } else if (linguaSalvata === 'inglese') {
      this.linguaUtente = 'inglese';
      this.iconaLingua = 'assets/en.svg';
    } else {
      const linguaBrowser = (navigator.language || '').toLowerCase();
      const browserItaliano = linguaBrowser.startsWith('it');

      if (browserItaliano) {
        this.linguaUtente = 'italiano';
        this.iconaLingua = 'assets/it.svg';
      } else {
        this.linguaUtente = 'inglese';
        this.iconaLingua = 'assets/en.svg';
      }
      localStorage.setItem('lingua_utente', this.linguaUtente);
    }

    // aggiorna anche lo stream dell'icona
    this.iconaLingua$.next(this.iconaLingua);

    // ⬅️ CARICA SUBITO LE TRADUZIONI PER LA LINGUA INIZIALE
    const codiceLingua = this.leggiCodiceLingua();
    this.traduzioniService.caricaTraduzioni(codiceLingua);
  }

  cambiaLingua(): void {
    if (this.linguaUtente === 'inglese') {
      this.linguaUtente = 'italiano';
      this.iconaLingua = 'assets/it.svg';
    } else {
      this.linguaUtente = 'inglese';
      this.iconaLingua = 'assets/en.svg';
    }

    localStorage.setItem('lingua_utente', this.linguaUtente);
    this.iconaLingua$.next(this.iconaLingua);

    // ⬅️ OGNI VOLTA CHE CAMBIO LINGUA → RICARICO TRADUZIONI
    const codiceLingua = this.leggiCodiceLingua();
    this.traduzioniService.caricaTraduzioni(codiceLingua);
  }

  leggiCodiceLingua(): string {
    return this.linguaUtente === 'italiano' ? 'it' : 'en';
  }

    haBisognoSpinnerProssimoCambio(): boolean {
    const prossimaLingua =
      this.linguaUtente === 'italiano' ? 'inglese' : 'italiano';
    const codiceProssima = prossimaLingua === 'italiano' ? 'it' : 'en';
    return !this.traduzioniService.haTraduzioniInCache(codiceProssima);
  }
}
