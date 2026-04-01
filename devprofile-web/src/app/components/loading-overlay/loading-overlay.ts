import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export enum LoadingStatus {
  IDLE = 'idle',
  WAKING_UP = 'waking-up',
  FETCHING_DATA = 'fetching-data',
  ANALYZING = 'analyzing',
  THINKING = 'thinking',
  ERROR = 'error'
}

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.html',
  styleUrls: ['./loading-overlay.scss']
})
export class LoadingOverlay implements OnInit, OnDestroy {
  @Input() error: string | null = null;
  @Input() status: LoadingStatus = LoadingStatus.IDLE;
  @Output() onBack = new EventEmitter<void>();

  private messages = [
    'Analisando perfil...',
    'Iniciando conexão segura...',
    'Buscando metadados do GitHub...',
    'Processando grafo de contribuições...',
    'Calculando métricas de performance...',
    'Gerando insights de carreira...',
    'Sincronizando repositórios...',
    'Quase lá...'
  ];

  private wakingUpMessages = [
    'O servidor está acordando (Render)...',
    'Só mais um pouquinho, a instância está subindo...',
    'Quase pronto para a decolagem...',
    'Acordando o Octocat do sono profundo...'
  ];

  private thinkingMessages = [
    'O Octocat está fritando os neurônios...',
    'Processando trilhões de possibilidades...',
    'Consultando a sabedoria dos commits...',
    'Pensando em como te impressionar...'
  ];

  currentMessage = 'Analisando perfil...';
  private messageIndex = 0;
  private intervalId: any;
  private startTime = Date.now();

  ngOnInit() {
    this.intervalId = setInterval(() => {
      if (this.error || this.status === LoadingStatus.ERROR) return;

      const elapsed = Date.now() - this.startTime;

      // Logic based on status or time
      if (this.status === LoadingStatus.WAKING_UP) {
        this.messageIndex = (this.messageIndex + 1) % this.wakingUpMessages.length;
        this.currentMessage = this.wakingUpMessages[this.messageIndex];
      } else if (this.status === LoadingStatus.THINKING) {
        this.messageIndex = (this.messageIndex + 1) % this.thinkingMessages.length;
        this.currentMessage = this.thinkingMessages[this.messageIndex];
      } else {
        this.messageIndex = (this.messageIndex + 1) % this.messages.length;
        this.currentMessage = this.messages[this.messageIndex];
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  handleBack() {
    this.onBack.emit();
  }
}
