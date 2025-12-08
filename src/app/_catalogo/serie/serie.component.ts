import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/_servizi_globali/api.service';
import { Observable, map } from 'rxjs';
import { IRispostaServer } from 'src/app/_interfacce/IRispostaServer.interface';
import { serie } from 'src/app/_type/serie.type';

@Component({
  selector: 'app-serie',
  templateUrl: './serie.component.html',
  styleUrls: ['./serie.component.scss'],
})
export class SerieComponent implements OnInit {
  elencoSerie$: Observable<IRispostaServer>;
  dati: serie[] = [];

  constructor(private api: ApiService) {
    this.elencoSerie$ = this.api.getElencoSerie();
  }

  ngOnInit(): void {
    this.elencoSerie$.pipe(map((x) => x.data)).subscribe({
      next: (x) => (this.dati = x),
    });
  }
}
