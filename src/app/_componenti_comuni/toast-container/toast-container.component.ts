// DOPO (toast-container.component.ts)
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ToastService,
  ToastMessage,
} from 'src/app/_servizi_globali/toast.service';
import { Router } from '@angular/router';
import { Authservice } from 'src/app/_benvenuto/login/_login_service/auth.service';
import { ErroreGlobaleService } from 'src/app/_servizi_globali/errore-globale.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  sub?: Subscription;
  subChiudi?: Subscription;
  subChiudiTutti?: Subscription;
  constructor(
    private toastService: ToastService,
    private router: Router,
    private authService: Authservice,
    private erroreGlobaleService: ErroreGlobaleService
  ) {}

  ngOnInit(): void {
    // DOPO (toast-container.component.ts)
    // DOPO (toast-container.component.ts) ✅ (tutti i toast tornano a sparire come prima)
    this.sub = this.toastService.toast$.subscribe((msg) => {
      this.toasts.push(msg);

      if (msg.persistente) {
        return;
      }

      setTimeout(() => {
        const idx = this.toasts.indexOf(msg);
        if (idx !== -1) {
          this.toasts.splice(idx, 1);
        }
      }, 8000);
    });

    this.subChiudi = this.toastService.chiudi$.subscribe((chiave) => {
      this.toasts = this.toasts.filter((t) => t.chiave !== chiave);
    });

      this.subChiudiTutti = this.toastService.chiudiTutti$.subscribe(() => {
    this.toasts = [];
  });
  }

  onRipetiAccesso(event: MouseEvent): void {
    event.preventDefault();
    window.location.reload();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.subChiudi?.unsubscribe();
    this.subChiudiTutti?.unsubscribe();
  }
}
