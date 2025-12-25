import { Injectable } from '@angular/core';
import { ChiamataHTTP } from '../_type/chiamateHTTP.type';
import { HttpClient } from '@angular/common/http';
import { concatMap, map, Observable, take, tap } from 'rxjs';
import { IRispostaServer } from '../_interfacce/IRispostaServer.interface';
import { UtilityService } from '../_benvenuto/login/_login_service/login_utility.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  //  protected calcolaRisorsa(risorsa: (string | number)[]): string {
  //   const server: string = environment.apiBaseUrl;
  //   const versione: string = 'v1';

  //   // costruiamo i pezzi SENZA slash finale
  //   const segments = [server, versione, ...risorsa.map(String)];
  //   const url = segments.join('/');

  //   return url;
  // }

  // protected calcolaRisorsa(risorsa: (string | number)[]): string {
  //   // const server: string = 'http://localhost/science_codex/public/api';
  //   const server: string = '/api';
  //   const versione: string = 'v1';
  //   let url = server + '/' + versione + '/';
  //   risorsa.forEach((x) => {
  //     url = url + x + '/';
  //   });
  //   return url;
  // }

  //questo sotto
  // protected calcolaRisorsa(risorsa: (string | number)[]): string {
  //   const server: string = 'http://192.168.1.36/science_codex/public/api';
  //   const versione: string = 'v1';

  //   // pezzi tipo: http://localhost/science_codex/public/api/v1/film
  //   const segments = [server, versione, ...risorsa.map(String)];
  //   const url = segments.join('/');

  //   return url;
  // }

  //sotto produzione
  protected calcolaRisorsa(risorsa: (string | number)[]): string {
    const server: string = 'https://api.sciencecodex.net/api';
    const versione: string = 'v1';

    const segments = [server, versione, ...risorsa.map(String)];
    const url = segments.join('/');

    return url;
  }

  protected richiestaGenerica(
    risorsa: (string | number)[],
    tipo: ChiamataHTTP,
    parametri: Object | null = null
  ): Observable<IRispostaServer> {
    const url = this.calcolaRisorsa(risorsa);

    switch (tipo) {
      case 'GET':
        const options = parametri ? { params: parametri as any } : {};
        return this.http.get<IRispostaServer>(url, options);

      default:
        return this.http.get<IRispostaServer>(url);
    }
  }

  public getTipologieIndirizzi(): Observable<IRispostaServer> {
    const risorsa: string[] = ['categorie'];
    return this.richiestaGenerica(risorsa, 'GET');
  }

  public getTipologiaIndirizzo(id: string): Observable<IRispostaServer> {
    const risorsa: string[] = ['categorie', id];
    return this.richiestaGenerica(risorsa, 'GET');
  }

  public getLoginFase1(hashUtente: string): Observable<IRispostaServer> {
    const risorsa: string[] = ['accedi', hashUtente];
    const rit = this.richiestaGenerica(risorsa, 'GET');
    return rit;
  }

  public getLoginFase2(
    hashUtente: string,
    hashPassword: string,
    collegato: boolean
  ): Observable<IRispostaServer> {
    const risorsa: string[] = ['accedi', hashUtente, hashPassword];
    const parametri = collegato ? { collegato: '1' } : {};
    return this.richiestaGenerica(risorsa, 'GET', parametri);
  }

  public login(
    utente: string,
    password: string,
    restaCollegato: boolean
  ): Observable<IRispostaServer> {
    const utenteNorm = utente.trim().toLowerCase();
    const hashUtente: string = UtilityService.hash(utenteNorm);
    const hashPassword: string = UtilityService.hash(password);

    const controllo$ = this.getLoginFase1(hashUtente).pipe(
      take(1),
      tap((x) => console.log('DATI', x)),
      map((rit: IRispostaServer): string => {
        const sale: string = rit.data.sale;
        const passwordNascosta = UtilityService.nascondiPassword(
          hashPassword,
          sale
        );
        return passwordNascosta;
      }),
      concatMap((passwordNascosta: string) => {
        return this.getLoginFase2(hashUtente, passwordNascosta, restaCollegato);
      })
    );

    return controllo$;
  }

  public getElencoFilm(): Observable<IRispostaServer> {
    const risorsa: string[] = ['film'];
    return this.richiestaGenerica(risorsa, 'GET');
  }

  public getElencoSerie(): Observable<IRispostaServer> {
    const risorsa: string[] = ['serie'];
    return this.richiestaGenerica(risorsa, 'GET');
  }

  //  getVnovita(): Observable<IRispostaServer> {
  //     return this.http.get<IRispostaServer>('http://localhost:8000/api/v1/novita');
  //   }

  getVnovita(): Observable<IRispostaServer> {
    const risorsa: string[] = ['novita'];
    return this.richiestaGenerica(risorsa, 'GET');
  }

  public logout(): Observable<IRispostaServer> {
  const risorsa: (string | number)[] = ['logout'];
  return this.richiestaGenerica(risorsa, 'GET');
}

public getTraduzioniLingua(codiceLingua: string): Observable<Record<string, string>> {
  const url = this.calcolaRisorsa(['traduzioni-lingua', codiceLingua]);
  return this.http.get<Record<string, string>>(url);
}

}
