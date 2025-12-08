// codice per logica classe dei bottoni riutilizabili
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './app-button.component.html',
  styleUrls: ['./app-button.component.scss']
})
export class AppButtonComponent {
  @Input() label: string = '';  // Testo del bottone
  @Input() icon?: string;       // Icona opzionale
  @Input() imgSrc?: string;     // Percorso immagine opzionale
  @Input() type: 'button' | 'submit' = 'button';  // Tipo di bottone
  @Input() disabled: boolean = false;  // Disabilita il bottone
  @Input() customClass: string = '';   // Classe CSS personalizzata

  @Output() clicked = new EventEmitter<void>();   // Emette l'evento click

  @Input() buttonTitle?: string;

  onClick(): void {
    this.clicked.emit();  // Emette l'evento quando il bottone viene cliccato
  }
}
