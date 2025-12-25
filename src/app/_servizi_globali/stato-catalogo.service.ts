import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatoCatalogoService {
  inCatalogo$ = new BehaviorSubject<boolean>(false);
  catalogoPronto$ = new BehaviorSubject<boolean>(true);

  entraInCatalogo(): void {
    this.inCatalogo$.next(true);
    this.catalogoPronto$.next(false); // appena entri, blocca finche' non segnali pronto
  }

  esciDaCatalogo(): void {
    this.inCatalogo$.next(false);
    this.catalogoPronto$.next(true); // fuori catalogo non bloccare
  }

  segnalaPronto(): void {
    this.catalogoPronto$.next(true);
  }
}
