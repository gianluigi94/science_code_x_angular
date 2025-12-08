import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type TipoErrore = 'server' | 'sessione' | null;

@Injectable({
  providedIn: 'root',
})
export class ErroreGlobaleService {
  erroreFatale$ = new BehaviorSubject<boolean>(false);

  // errori server
  messaggioErrore$ = new BehaviorSubject<string | null>(null);

  // tipo errore (server / sessione)
  tipoErrore$ = new BehaviorSubject<TipoErrore>(null);

  // codice per le varie scadenze sessione
  codiceSessione$ = new BehaviorSubject<string | null>(null);

  // 🔹 errori generici di backend (500 / rete)
  segnalaErroreServer(msg: string | null = null): void {
    if (!this.erroreFatale$.value) {
      this.messaggioErrore$.next(msg);
      this.tipoErrore$.next('server');
      this.erroreFatale$.next(true);
    }
  }

  // 🔹 errori di sessione (401/403 con messaggi specifici)
  segnalaErroreSessione(codice: string): void {
    if (!this.erroreFatale$.value) {
      this.codiceSessione$.next(codice);
      this.tipoErrore$.next('sessione');
      this.erroreFatale$.next(true);
    }
  }

  resettaErroreFatale(): void {
    this.erroreFatale$.next(false);
    this.messaggioErrore$.next(null);
    this.tipoErrore$.next(null);
    this.codiceSessione$.next(null);
  }
}
