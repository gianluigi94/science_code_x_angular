// src/app/_benvenuto/login/_login_service/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Auth } from 'src/app/_type/auth.type';
import { StatoSessioneClientService } from 'src/app/_servizi_globali/stato-sessione-client.service';

@Injectable({
  providedIn: 'root',
})
export class Authservice {
  static auth: Auth;
  private obsAuth$: BehaviorSubject<Auth>;

  constructor(
    private statoSessione: StatoSessioneClientService
  ) {
    Authservice.auth = this.leggiAuthDaLocalStorage();
    this.obsAuth$ = new BehaviorSubject<Auth>(Authservice.auth);
  }

  leggiObsAuth() {
    return this.obsAuth$;
  }

  settaObsAuth(dati: Auth) {
    Authservice.auth = dati;
    this.obsAuth$.next(dati);
  }

  leggiAuthDaLocalStorage(): Auth {
    const tmp: string | null = localStorage.getItem('auth');
    let auth: Auth;
    if (tmp != null) {
      auth = JSON.parse(tmp);
    } else {
      auth = {
        idUtente: null,
        idRuolo: null,
        idStato: null,
        tk: null,
        nome: null,
        abilita: null,
      };
    }
    return auth;
  }

  scriviAuthSuLocalStorage(auth: Auth): void {
    const tmp: string = JSON.stringify(auth);
    localStorage.setItem('auth', tmp);
  }

 // DOPO
logout(consideraSessioneGiaVerificata: boolean = true): void {
  const authVuoto: Auth = {
    idUtente: null,
    idRuolo: null,
    idStato: null,
    tk: null,
    nome: null,
    abilita: null,
  };
  this.settaObsAuth(authVuoto);
  localStorage.removeItem('auth');

  // reset stato client (nuova "istanza logica")
  this.statoSessione.reset(consideraSessioneGiaVerificata);
}

}
