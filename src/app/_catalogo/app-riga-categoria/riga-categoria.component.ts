import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-riga-categoria',
  templateUrl: './riga-categoria.component.html',
  styleUrls: ['./riga-categoria.component.scss'],
})
export class RigaCategoriaComponent implements OnChanges {
  @Input() locandine: string[] = [];
  @Input() categoria = '';

  locandineVisibili = 5;
  indicePagina = 0;
  numeroMassimoPagine = 0;
  trasformazioneWrapper = '';

  ngOnChanges(_changes: SimpleChanges): void {
    this.calcolaNumeroMassimoPagine();
    if (this.indicePagina > this.numeroMassimoPagine) this.indicePagina = 0;
    this.aggiornaTrasformazioneWrapper();
  }

  calcolaNumeroMassimoPagine(): void {
    const totale = this.locandine.length;
    this.numeroMassimoPagine = Math.max(Math.ceil(totale / this.locandineVisibili) - 1, 0);
  }

  aggiornaTrasformazioneWrapper(): void {
    this.trasformazioneWrapper = `translateX(${-this.indicePagina * 100}%)`;
  }

  paginaSuccessiva(): void {
    if (this.indicePagina < this.numeroMassimoPagine) {
      this.indicePagina++;
      this.aggiornaTrasformazioneWrapper();
    }
  }

  paginaPrecedente(): void {
    if (this.indicePagina > 0) {
      this.indicePagina--;
      this.aggiornaTrasformazioneWrapper();
    }
  }
}
