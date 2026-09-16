if (!customElements.get('custom-hero-slider')) {
  customElements.define(
    'custom-hero-slider',
    class CustomHeroSlider extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-hero-track]');
        this.slides = Array.from(this.querySelectorAll('[data-hero-slide]'));
        this.dots = Array.from(this.querySelectorAll('[data-hero-dot]'));
        this.prevButton = this.querySelector('[data-hero-prev]');
        this.nextButton = this.querySelector('[data-hero-next]');
        this.pauseButton = this.querySelector('[data-hero-pause]');
        this.autoplayEnabled = this.dataset.autoplay === 'true';
        this.speed = Number(this.dataset.speed || 4) * 1000;
        this.currentIndex = 0;
        this.intervalId = null;
        this.isPaused = false;
        this.touchStartX = 0;
        this.pauseLabel = this.dataset.pauseLabel || 'Pause slideshow';
        this.playLabel = this.dataset.playLabel || 'Play slideshow';
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (this.slides.length <= 1) return;

        this.onDotClick = (event) => {
          this.goTo(Number(event.currentTarget.dataset.heroDot));
          this.restartAutoplay();
        };
        this.onPrev = () => {
          this.goTo(this.currentIndex - 1);
          this.restartAutoplay();
        };
        this.onNext = () => {
          this.goTo(this.currentIndex + 1);
          this.restartAutoplay();
        };
        this.onPauseToggle = () => {
          this.isPaused = !this.isPaused;
          this.syncAutoplay();
        };
        this.onKeyDown = (event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.onPrev();
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.onNext();
          }
        };
        this.onReducedMotionChange = () => this.syncAutoplay();
        this.onVisibility = () => this.syncAutoplay();
        this.onPointerEnter = () => this.stopAutoplay();
        this.onPointerLeave = () => this.syncAutoplay();
        this.onTouchStart = (event) => {
          this.touchStartX = event.changedTouches[0].screenX;
        };
        this.onTouchEnd = (event) => {
          const dx = event.changedTouches[0].screenX - this.touchStartX;
          if (Math.abs(dx) < 40) return;
          if (dx < 0) this.onNext();
          else this.onPrev();
        };

        this.dots.forEach((dot) => dot.addEventListener('click', this.onDotClick));
        this.prevButton?.addEventListener('click', this.onPrev);
        this.nextButton?.addEventListener('click', this.onNext);
        this.pauseButton?.addEventListener('click', this.onPauseToggle);
        this.addEventListener('keydown', this.onKeyDown);
        this.addEventListener('pointerenter', this.onPointerEnter);
        this.addEventListener('pointerleave', this.onPointerLeave);
        this.addEventListener('touchstart', this.onTouchStart, { passive: true });
        this.addEventListener('touchend', this.onTouchEnd, { passive: true });
        this.reducedMotion.addEventListener('change', this.onReducedMotionChange);
        document.addEventListener('visibilitychange', this.onVisibility);

        this.syncAutoplay();
      }

      disconnectedCallback() {
        this.stopAutoplay();
        this.dots?.forEach((dot) => dot.removeEventListener('click', this.onDotClick));
        this.prevButton?.removeEventListener('click', this.onPrev);
        this.nextButton?.removeEventListener('click', this.onNext);
        this.pauseButton?.removeEventListener('click', this.onPauseToggle);
        this.removeEventListener('keydown', this.onKeyDown);
        this.removeEventListener('pointerenter', this.onPointerEnter);
        this.removeEventListener('pointerleave', this.onPointerLeave);
        this.removeEventListener('touchstart', this.onTouchStart);
        this.removeEventListener('touchend', this.onTouchEnd);
        this.reducedMotion?.removeEventListener('change', this.onReducedMotionChange);
        document.removeEventListener('visibilitychange', this.onVisibility);
      }

      goTo(index) {
        if (!this.slides.length || !this.track) return;
        const count = this.slides.length;
        this.currentIndex = ((index % count) + count) % count;
        this.track.style.transform = `translate3d(-${this.currentIndex * 100}%, 0, 0)`;
        this.dots.forEach((dot, i) => {
          const selected = i === this.currentIndex;
          dot.classList.toggle('is-active', selected);
          dot.setAttribute('aria-current', selected ? 'true' : 'false');
        });
      }

      shouldAutoplay() {
        return this.autoplayEnabled && !this.isPaused && !this.reducedMotion.matches && !document.hidden;
      }

      startAutoplay() {
        this.stopAutoplay();
        if (!this.shouldAutoplay()) return;
        this.intervalId = setInterval(() => this.goTo(this.currentIndex + 1), this.speed);
      }

      stopAutoplay() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }

      syncAutoplay() {
        if (this.shouldAutoplay()) this.startAutoplay();
        else this.stopAutoplay();
        this.updatePauseButton();
      }

      restartAutoplay() {
        if (!this.isPaused) this.syncAutoplay();
      }

      updatePauseButton() {
        if (!this.pauseButton) return;
        const playing = Boolean(this.intervalId);
        this.pauseButton.setAttribute('aria-label', playing ? this.pauseLabel : this.playLabel);
        this.pauseButton.classList.toggle('is-paused', !playing);
      }
    }
  );
}
