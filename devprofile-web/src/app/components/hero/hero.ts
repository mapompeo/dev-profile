import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero {
  @Input() error: string | null = null;
  @Output() onSearch = new EventEmitter<string>();
  @Output() onCompare = new EventEmitter<{left: string, right: string}>();

  username: string = '';
  leftUser: string = '';
  rightUser: string = '';
  mode: 'single' | 'vs' = 'single';
  isAnimating: boolean = false;

  setMode(newMode: 'single' | 'vs') {
    if (this.mode === newMode || this.isAnimating) return;
    this.isAnimating = true;
    setTimeout(() => {
      this.mode = newMode;
      this.isAnimating = false;
    }, 300); // Half of the spin animation duration
  }

  submit() {
    if (this.mode === 'single' && this.username) {
      this.onSearch.emit(this.username);
    } else if (this.mode === 'vs' && this.leftUser && this.rightUser) {
      this.onCompare.emit({ left: this.leftUser, right: this.rightUser });
    }
  }
}
