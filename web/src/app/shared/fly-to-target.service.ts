import { Injectable } from '@angular/core';

export type FlyTargetKey = 'bag' | 'favorites';

interface ActiveFly {
  animation: Animation;
  ghost: HTMLElement;
}

@Injectable({ providedIn: 'root' })
export class FlyToTargetService {
  private active: ActiveFly | null = null;

  fly(sourceEl: HTMLElement, imageSrc: string, targetKey: FlyTargetKey): void {
    const targetEl = document.querySelector<HTMLElement>(`[data-fly-target="${targetKey}"]`);
    if (!targetEl) return;

    this.cancelActive();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sourceRect = sourceEl.getBoundingClientRect();

    if (reduceMotion || sourceRect.width === 0 || sourceRect.height === 0) {
      this.pulseTarget(targetEl);
      return;
    }

    const startSize = 64;
    const endScale = 14 / startSize;

    const ghost = document.createElement('div');
    ghost.className = 'tr-fly-ghost';
    ghost.style.width = `${startSize}px`;
    ghost.style.height = `${startSize}px`;
    ghost.style.left = `${sourceRect.left + sourceRect.width / 2 - startSize / 2}px`;
    ghost.style.top = `${sourceRect.top + sourceRect.height / 2 - startSize / 2}px`;

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = '';
    ghost.appendChild(img);
    document.body.appendChild(ghost);

    const targetRect = targetEl.getBoundingClientRect();
    const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    const midX = deltaX * 0.5;
    const midY = deltaY * 0.55 - 36;

    const animation = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate(${midX}px, ${midY}px) scale(0.72)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(${endScale})`, opacity: 0, offset: 1 },
      ],
      { duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );

    this.active = { animation, ghost };

    animation.onfinish = () => {
      ghost.remove();
      if (this.active?.animation === animation) this.active = null;
      this.pulseTarget(targetEl);
    };
  }

  private cancelActive(): void {
    if (!this.active) return;
    this.active.animation.onfinish = null;
    this.active.animation.cancel();
    this.active.ghost.remove();
    this.active = null;
  }

  private pulseTarget(targetEl: HTMLElement): void {
    targetEl.classList.remove('tr-fly-pulse');
    void targetEl.offsetWidth;
    targetEl.classList.add('tr-fly-pulse');
    setTimeout(() => targetEl.classList.remove('tr-fly-pulse'), 650);
  }
}
