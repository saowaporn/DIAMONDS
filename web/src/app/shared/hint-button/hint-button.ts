import { Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-hint-button',
  standalone: true,
  templateUrl: './hint-button.html',
})
export class HintButton {
  readonly label = input<string>('More info');
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');

  openDialog(): void {
    this.dialogRef()?.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef()?.nativeElement.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef()?.nativeElement) {
      this.close();
    }
  }
}
