import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-form.component.html',
  styleUrl: './input-form.component.scss'
})
export class InputFormComponent {
  @Input() nomeCompleto = '';
  @Output() nomeCompletoChange = new EventEmitter<string>();

  @Input() idade = 0;
  @Output() idadeChange = new EventEmitter<number>();

  @Input() cenarioAtendimento = 'PS';
  @Output() cenarioAtendimentoChange = new EventEmitter<string>();

  @Input() textoTranscrito = '';
  @Output() textoTranscritoChange = new EventEmitter<string>();

  @Input() gravando = false;
  @Input() processando = false;
  @Input() tempoGravacao = 0;
  @Input() hasResult = false;

  @Output() gravar = new EventEmitter<void>();
  @Output() analisar = new EventEmitter<void>();
  @Output() limpar = new EventEmitter<void>();

  onGravar() { this.gravar.emit(); }
  onAnalisar() { this.analisar.emit(); }
  onLimpar() { this.limpar.emit(); }
}
