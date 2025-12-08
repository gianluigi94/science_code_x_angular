import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs'; // 👈 aggiungi questo

@Injectable({
  providedIn: 'root',
})
export class TraduzioniService {
  urlBaseTraduzioni = 'http://localhost:8000/api/v1/traduzioni-lingua';
  //  urlBaseTraduzioni = 'https://api.sciencecodex.net/api/v1/traduzioni-lingua';

  traduzioniCaricate: { [codiceLingua: string]: boolean } = {};

  // 👇 false all'inizio → le traduzioni non sono ancora pronte
  traduzioniInizialiCaricate$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private translateService: TranslateService
  ) {}

  caricaTraduzioni(codiceLingua: string): void {
    // se quella lingua è già stata caricata, basta fare lo switch
    if (this.traduzioniCaricate[codiceLingua]) {
      this.translateService.use(codiceLingua);

      // se per qualche motivo è la prima volta che arriviamo qui
      if (!this.traduzioniInizialiCaricate$.value) {
        this.traduzioniInizialiCaricate$.next(true);
      }
      return;
    }

    // prima volta: chiama backend, salva e poi usa
    this.http
      .get<Record<string, string>>(`${this.urlBaseTraduzioni}/${codiceLingua}`)
      .subscribe((traduzioni) => {
        this.translateService.setTranslation(codiceLingua, traduzioni, true);
        this.traduzioniCaricate[codiceLingua] = true;
        this.translateService.use(codiceLingua);

        // 👇 segna che le traduzioni iniziali sono pronte
        if (!this.traduzioniInizialiCaricate$.value) {
          this.traduzioniInizialiCaricate$.next(true);
        }
      });
  }

  haTraduzioniInCache(codiceLingua: string): boolean {
    return !!this.traduzioniCaricate[codiceLingua];
  }
}
