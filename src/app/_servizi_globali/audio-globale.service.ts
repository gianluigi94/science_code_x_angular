import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioGlobaleService {
  CHIAVE_STORAGE = 'audio_consentito';
  statoAudioAttivo$ = new BehaviorSubject<boolean>(this.leggiDaStorage()); // coerente all'avvio
  statoBrowserBlocca$ = new BehaviorSubject<boolean>(false);
  leggiDaStorage(): boolean {
    try {
      const v = localStorage.getItem(this.CHIAVE_STORAGE);
      if (v === null) return true; // default: consentito
      return v === 'true';
    } catch {
      return true;
    }
  }

  scriviSuStorage(attivo: boolean) {
    try {
      localStorage.setItem(this.CHIAVE_STORAGE, attivo ? 'true' : 'false');
    } catch {}
  }
  leggiAudioAttivo$(): Observable<boolean> {
    return this.statoAudioAttivo$.asObservable();
  }

  leggiAudioAttivo(): boolean {
    return this.statoAudioAttivo$.value;
  }

  impostaAudioAttivo(attivo: boolean) {
    this.statoAudioAttivo$.next(attivo);
    this.scriviSuStorage(attivo);
    if (!attivo) this.statoBrowserBlocca$.next(false);
  }

  toggleAudio() {
        const nuovo = !this.statoAudioAttivo$.value;
    this.statoAudioAttivo$.next(nuovo);
    this.scriviSuStorage(nuovo);
    if (!nuovo) this.statoBrowserBlocca$.next(false);
  }

  leggiBrowserBlocca$(): Observable<boolean> {
    return this.statoBrowserBlocca$.asObservable();
  }

  impostaBrowserBlocca(blocca: boolean) {
    this.statoBrowserBlocca$.next(!!blocca);
  }
}
