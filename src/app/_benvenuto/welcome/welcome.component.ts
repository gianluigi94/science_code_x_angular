import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit, OnDestroy {
  isLoading = true;

  @Output() saturnLoadDone = new EventEmitter<void>();

  usaAnimazioniIngresso = true;
  usaAnimazioniScroll = true;

  distruggi$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(evento => evento instanceof NavigationEnd),
        takeUntil(this.distruggi$)
      )
      .subscribe((evento: any) => {
        const url = evento.urlAfterRedirects || evento.url;
        const isLogin = url.endsWith('/login');

        // home: true/true, login: false/false
        this.usaAnimazioniIngresso = !isLogin;
        this.usaAnimazioniScroll = !isLogin;
      });
  }

  onSaturnLoadDone(): void {
    this.isLoading = false;
    this.saturnLoadDone.emit();
  }

  ngOnDestroy(): void {
    this.distruggi$.next();
    this.distruggi$.complete();
  }
}
