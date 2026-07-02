import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  url = signal('');
  submitting = signal(false);
  created = signal<Link | null>(null);
  error = signal<string | null>(null);
  links = signal<Link[]>([]);

  valid = computed(() => {
    try {
      const { protocol } = new URL(this.url());
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  });

  ngOnInit(): void {
    this.loadLinks();
  }

  setUrl(e: Event): void {
    this.url.set((e.target as HTMLInputElement).value);
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.valid() || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.created.set(null);
    this.svc.shorten(this.url()).subscribe({
      next: (link) => {
        this.created.set(link);
        this.url.set('');
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? err?.message ?? 'Network error');
        this.submitting.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.svc.list().subscribe({
      next: (data) => this.links.set(data),
      error: () => {},
    });
  }
}
