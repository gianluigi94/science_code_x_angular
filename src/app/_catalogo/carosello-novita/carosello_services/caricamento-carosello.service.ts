import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CaricamentoCaroselloService {
  caroselloPronto$ = new BehaviorSubject<boolean>(false);

  sfondiPronti = false;
  titoliPronti = false;

  resetta(): void {
    this.sfondiPronti = false;
    this.titoliPronti = false;
    this.caroselloPronto$.next(false);
  }

  segnalaSfondiPronti(): void {
    this.sfondiPronti = true;
    this.verificaPronto();
  }

  segnalaTitoliPronti(): void {
    this.titoliPronti = true;
    this.verificaPronto();
  }

  verificaPronto(): void {
    if (this.sfondiPronti && this.titoliPronti) {
      this.caroselloPronto$.next(true);
    }
  }
}
