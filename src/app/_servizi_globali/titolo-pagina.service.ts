import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CambioLinguaService } from './cambio-lingua.service';

@Injectable({ providedIn: 'root' })
export class TitoloPaginaService {
  constructor(
    private title: Title,
    private router: Router,
    private cambioLinguaService: CambioLinguaService,
  ) {}

  avvia(): void {
    // all'avvio
    this.aggiornaTitolo(this.router.url || '');

    // ad ogni navigazione
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((ev: any) => {
        const url = (ev && ev.urlAfterRedirects) ? ev.urlAfterRedirects : (ev && ev.url) ? ev.url : '';
        this.aggiornaTitolo(url);
      });

    // quando cambia lingua (dopo che l'hai applicata)
    this.cambioLinguaService.cambioLinguaApplicata$.subscribe(() => {
      this.aggiornaTitolo(this.router.url || '');
    });
  }

  private aggiornaTitolo(url: string): void {
  const codice = this.cambioLinguaService.leggiCodiceLingua();
  const path = this.pulisciUrl(url);

  const base = 'ScienceCode X';
  let titolo = base;

  if (path === '/benvenuto' || path === '/benvenuto/') {
    titolo = (codice === 'it') ? `Benvenuto - ${base}` : `Welcome - ${base}`;
  } else if (path === '/benvenuto/login') {
    titolo = (codice === 'it') ? `Accedi - ${base}` : `Sign in - ${base}`;
  } else if (path === '/catalogo' || path === '/catalogo/') {
    titolo = (codice === 'it') ? `Film e Serie - ${base}` : `Movies & Series - ${base}`;
  } else if (path === '/catalogo/film') {
    titolo = (codice === 'it') ? `Film - ${base}` : `Movies - ${base}`;
  } else if (path === '/catalogo/serie') {
    titolo = (codice === 'it') ? `Serie - ${base}` : `Series - ${base}`;
  }

  this.title.setTitle(titolo);
}

  private pulisciUrl(url: string): string {
    return (url || '').split('?')[0].split('#')[0];
  }
}
