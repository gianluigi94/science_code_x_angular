//questo servizio serve per capire la potenza della gpu dell'utente, ma purtroppo ottengo un risultato diverso da browser a browser

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private performanceLevel = new BehaviorSubject<string>('Calcolando...'); //mantiene l'ultimo valore emesso, all'inizio è calcolando, ma cambierà quando sarà pronto, uso ascoltatori perche avere eventuali messaggi dinamici in più eventuali parti nel progetto
  performanceLevel$ = this.performanceLevel.asObservable(); //ottengo il valore in una proprietà

  private isLowEndPC = new BehaviorSubject<boolean>(false); //inizia con false ma può cambiare se è un pc scarso
  isLowEndPC$ = this.isLowEndPC.asObservable();

  constructor() {
    this.detectGPU();
  }

  private async detectGPU(): Promise<void> { // apetta il caricamento della libreria detect-gpu
    const { getGPUTier } = await import('detect-gpu');
    const gpuTier = await getGPUTier({
  benchmarksURL: '/assets/detect-gpu/benchmarks'
});

    const fps = gpuTier.fps ?? 0; //ottengo fps stimati

    //lista di possibili livelli
    let level = 'GPU non trovata';
    if (!gpuTier.gpu) {
      level = 'GPU non trovata';
    } else if (fps >= 144) {
      level = 'Estremamente alta';
    } else if (fps >= 90) {
      level = 'Molto alta';
    } else if (fps >= 60) {
      level = 'Alta';
    } else if (fps >= 45) {
      level = 'Medio alta';
    } else if (fps >= 30) {
      level = 'Medio';
    } else if (fps >= 20) {
      level = 'Medio bassa';
    } else if (fps >= 15) {
      level = 'Bassa';
    } else if (fps >= 10) {
      level = 'Molto bassa';
    } else {
      level = 'Estremamente bassa'; // uno dei pochi attendibili
    }

    this.performanceLevel.next(level); //agiorna osservable
    this.isLowEndPC.next(fps < 15 && this.isPC()); //imposta true se il dispositivo è un pc e gli fps sono bassi
  }

  private isPC(): boolean {
    const userAgent = window.navigator.userAgent; // controlla se è un pc e ritorna il sistema operativo
    return userAgent.includes('Win') || userAgent.includes('Mac') || userAgent.includes('Linux');
  }
}
