// src/app/_servizi_globali/stato-sessione-client.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatoSessioneClientService {

  sessioneGiaConfermata = false;
  staRicaricando = false;


  // 👇 parte sempre come NON verificata: loader su
  sessioneVerificata$ = new BehaviorSubject<boolean>(false);

  // 👇 NUOVO: indica se all'avvio c'era un token salvato
  haTokenIniziale = false;

  constructor() {
    const raw = localStorage.getItem('auth');

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.haTokenIniziale = !!parsed?.tk;
      } catch (e) {
        console.warn('[StatoSessioneClientService] errore parse auth da localStorage', e);
        this.haTokenIniziale = false;
      }
    }
  }

  segnaSessioneVerificata(): void {
    if (!this.sessioneVerificata$.value) {
      const now = performance.now();
      console.log('RISPOSTA SERVER CONFERMA STATO SESSIONE alle ' + now + ' ms');
      this.sessioneVerificata$.next(true);
    }
  }

  reset(consideraSessioneGiaVerificata: boolean = true): void {
    this.sessioneGiaConfermata = false;
    this.staRicaricando = false;
    this.sessioneVerificata$.next(consideraSessioneGiaVerificata);
  }
}
