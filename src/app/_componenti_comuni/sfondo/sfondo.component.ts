import { Component } from '@angular/core';

@Component({
  selector: 'app-sfondo',
  templateUrl: './sfondo.component.html',
  styleUrls: ['./sfondo.component.scss']
})
export class SfondoComponent {

  // codice per aiutare il ridimensionamento su tutti i dispositivi
  ngOnInit(): void {
    // calcolo l’1% dell’altezza visibile del dispositivo e lo salva come variabile CSS
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH(); // chiamo la funzione
    window.addEventListener('resize', setVH); //agiorno le dimensioni
  }


}
