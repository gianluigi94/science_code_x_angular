import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/_servizi_globali/api.service';
import { Observable, map } from 'rxjs';
import { IRispostaServer } from 'src/app/_interfacce/IRispostaServer.interface';
import { film } from 'src/app/_type/film.type';

@Component({
  selector: 'app-film',
  templateUrl: './film.component.html',
  styleUrls: ['./film.component.scss'],
})
export class FilmComponent implements OnInit {
  elencoFilm$: Observable<IRispostaServer>;
  dati: film[] = [];

  constructor(private api: ApiService) {
    this.elencoFilm$ = this.api.getElencoFilm();
  }

  ngOnInit(): void {
    this.elencoFilm$.pipe(map((x) => x.data)).subscribe({
      next: (x) => (this.dati = x),
    });
  }
}
