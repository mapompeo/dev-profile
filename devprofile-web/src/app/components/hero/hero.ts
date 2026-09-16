import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export enum LoadingStatus {
  IDLE = 'idle',
  WAKING_UP = 'waking-up',
  FETCHING_DATA = 'fetching-data',
  ANALYZING = 'analyzing',
  THINKING = 'thinking',
  ERROR = 'error'
}

interface Sample {
  user: string;
  note: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero implements OnChanges, OnDestroy {
  @Input() error: string | null = null;
  @Input() loading = false;
  @Input() status: LoadingStatus = LoadingStatus.IDLE;

  @Output() onSearch = new EventEmitter<string>();
  @Output() onCompare = new EventEmitter<{ left: string; right: string }>();
  @Output() onErrorClear = new EventEmitter<void>();

  username = '';
  leftUser = '';
  rightUser = '';
  mode: 'single' | 'vs' = 'single';

  /** Perfis de exemplo: ocupam o lugar da antiga cena decorativa com algo acionável. */
  readonly samples: Sample[] = [
    { user: 'torvalds', note: 'criador do Linux e do Git' },
    { user: 'gaearon', note: 'React, anos de open source' },
    { user: 'mapompeo', note: 'o perfil que originou o projeto' }
  ];

  currentLoadingMessage = 'Analisando perfil...';
  private messageIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | undefined;

  // Sem zone.js, o texto trocado dentro do setInterval nao chega na tela sozinho.
  private readonly cdr = inject(ChangeDetectorRef);

  private messages = [
    'Analisando perfil...',
    'Iniciando conexão segura...',
    'Buscando metadados...',
    'Processando grafo...',
    'Calculando métricas...',
    'Sincronizando repo...',
    'Quase lá...'
  ];

  private wakingUpMessages = [
    'Acordando (Render)...',
    'Subindo instância...',
    'Quase pronto...',
    'Acordando Octocat...'
  ];

  private thinkingMessages = [
    'Fritando neurônios...',
    'Processando grafos...',
    'Métricas avançadas...'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      if (this.loading) {
        this.startLoadingTimer();
      } else {
        this.stopLoadingTimer();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopLoadingTimer();
  }

  clearError(): void {
    if (this.error) {
      this.onErrorClear.emit();
    }
  }

  setMode(newMode: 'single' | 'vs'): void {
    this.mode = newMode;
    this.clearError();
  }

  useSample(user: string): void {
    if (this.loading) return;
    if (this.mode === 'single') {
      this.username = user;
      this.onSearch.emit(user);
      return;
    }
    if (!this.leftUser) {
      this.leftUser = user;
    } else {
      this.rightUser = user;
    }
  }

  submit(): void {
    if (this.mode === 'single' && this.username) {
      this.onSearch.emit(this.username);
    } else if (this.mode === 'vs' && this.leftUser && this.rightUser) {
      this.onCompare.emit({ left: this.leftUser, right: this.rightUser });
    }
  }

  private startLoadingTimer(): void {
    this.stopLoadingTimer();
    this.messageIndex = 0;
    this.updateMessage();
    this.intervalId = setInterval(() => {
      this.updateMessage();
      this.cdr.markForCheck();
    }, 2500);
  }

  private stopLoadingTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private updateMessage(): void {
    if (this.status === LoadingStatus.WAKING_UP) {
      this.messageIndex = (this.messageIndex + 1) % this.wakingUpMessages.length;
      this.currentLoadingMessage = this.wakingUpMessages[this.messageIndex];
    } else if (this.status === LoadingStatus.THINKING) {
      this.messageIndex = (this.messageIndex + 1) % this.thinkingMessages.length;
      this.currentLoadingMessage = this.thinkingMessages[this.messageIndex];
    } else {
      this.messageIndex = (this.messageIndex + 1) % this.messages.length;
      this.currentLoadingMessage = this.messages[this.messageIndex];
    }
  }
}
