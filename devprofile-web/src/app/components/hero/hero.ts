import { Component, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges } from '@angular/core';
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

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero implements OnChanges {
  @Input() error: string | null = null;
  @Input() loading: boolean = false;
  @Input() status: LoadingStatus = LoadingStatus.IDLE;
  
  @Output() onSearch = new EventEmitter<string>();
  @Output() onCompare = new EventEmitter<{left: string, right: string}>();
  @Output() onErrorClear = new EventEmitter<void>();

  username: string = '';
  leftUser: string = '';
  rightUser: string = '';
  mode: 'single' | 'vs' = 'single';
  isAnimating: boolean = false;

  // Propriedades para o efeito de inclinação e paralaxe (Tilt)
  tiltX: number = 0;
  tiltY: number = 0;
  translateX: number = 0;
  translateY: number = 0;

  // Polling / Loading Mechanism
  currentLoadingMessage: string = 'Analisando perfil...';
  private messageIndex = 0;
  private intervalId: any;

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['loading']) {
      if (this.loading) {
        this.startLoadingTimer();
      } else {
        this.stopLoadingTimer();
      }
    }
  }

  private startLoadingTimer() {
    this.stopLoadingTimer();
    this.messageIndex = 0;
    this.updateMessage();
    this.intervalId = setInterval(() => {
      this.updateMessage();
    }, 2500); // Rapid dynamic updates for actionable UI
  }

  private stopLoadingTimer() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateMessage() {
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

  clearError() {
    if (this.error) {
      this.onErrorClear.emit();
    }
  }

  setMode(newMode: 'single' | 'vs') {
    if (this.mode === newMode || this.isAnimating) return;
    this.mode = newMode; // Instant state change
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, 400); // Animation duration
  }

  @HostListener('window:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent) {
    // Calcula a posição do mouse relativa ao centro da tela (-0.5 a 0.5)
    const x = (event.clientX / window.innerWidth) - 0.5;
    const y = (event.clientY / window.innerHeight) - 0.5;

    // Rotação (Tilt) - Máximo 30 graus
    this.tiltX = y * -30; 
    this.tiltY = x * 30;

    // Deslocamento (Paralaxe) - Máximo 40px
    this.translateX = x * 40;
    this.translateY = y * 40;
  }

  @HostListener('window:mouseleave')
  resetMouse() {
    this.tiltX = 0;
    this.tiltY = 0;
    this.translateX = 0;
    this.translateY = 0;
  }

  submit() {
    if (this.mode === 'single' && this.username) {
      this.onSearch.emit(this.username);
    } else if (this.mode === 'vs' && this.leftUser && this.rightUser) {
      this.onCompare.emit({ left: this.leftUser, right: this.rightUser });
    }
  }
}
