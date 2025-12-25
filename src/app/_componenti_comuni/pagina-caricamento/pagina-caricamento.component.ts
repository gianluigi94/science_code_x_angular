import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pagina-caricamento',
  templateUrl: './pagina-caricamento.component.html',
  styleUrls: ['./pagina-caricamento.component.scss'],
})
export class PaginaCaricamentoComponent {
  @Input() mostraSpinner = true;
  @Input() stileAvvioCatalogo = false;
  @Input() isFirefox = false;
}
