import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';

import { Header } from '../header/header';
import { Hero } from '../hero/hero';

import { LoadingOverlay } from '../loading-overlay/loading-overlay';
import { ProfileDashboard } from '../profile-dashboard/profile-dashboard';
import { ProfileComparison } from '../profile-comparison/profile-comparison';

// ─── Particle interface ───────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;  // velocity x
  vy: number;  // velocity y
  originX: number;
  originY: number;
  size: number;
  opacity: number;
  color: string;
}

@Component({
  selector: 'app-profile-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
    Hero,
    LoadingOverlay,
    ProfileDashboard,
    ProfileComparison
  ],
  templateUrl: './profile-search.component.html',
  styleUrls: ['./profile-search.component.scss']
})
export class ProfileSearchComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;

  profile: any = null;
  comparison: any = null;
  loading: boolean = false;
  error: string | null = null;
  isJsonView: boolean = false;

  // ─── Canvas state ───────────────────────────────────────────────────────────
  private ctx!: CanvasRenderingContext2D;
  private animFrameId!: number;
  private particles: Particle[] = [];
  private mouse = { x: -1000, y: -1000 };

  // Aurora blobs
  private blobs = [
    { x: 0.5, y: 0.3, r: 0.35, hue: 270, phase: 0 },   // purple center-top
    { x: 0.2, y: 0.7, r: 0.3,  hue: 250, phase: 1.5 },  // purple-blue left
    { x: 0.8, y: 0.6, r: 0.28, hue: 285, phase: 3 },    // violet right
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const user1 = params.get('user') || params.get('user1');
      const user2 = params.get('user2');
      this.isJsonView = params.get('json') === 'json';

      // If user wants raw JSON, redirect directly to the backend API
      if (this.isJsonView) {
        if (user1 && user2) {
          window.location.href = `/api/profile/compare?left=${user1}&right=${user2}`;
        } else if (user1) {
          window.location.href = `/api/profile/${user1}`;
        }
        return;
      }

      if (user1 && user2) {
        this.fetchComparison(user1, user2);
      } else if (user1) {
        this.fetchProfile(user1);
      } else {
        this.resetView(false); // don't navigate, just reset state
      }
    });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.spawnParticles();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
  }

  // ─── Mouse tracking ─────────────────────────────────────────────────────────
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  // ─── Canvas setup ───────────────────────────────────────────────────────────
  private initCanvas() {
    const canvas = this.bgCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
  }

  private resizeCanvas() {
    const canvas = this.bgCanvasRef.nativeElement;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
    this.particles = [];
    this.spawnParticles();
  }

  // ─── Particle system ────────────────────────────────────────────────────────
  private spawnParticles() {
    const canvas = this.bgCanvasRef.nativeElement;
    const count  = Math.floor((canvas.width * canvas.height) / 10000);
    const colors = [
      'rgba(200,152,253,',  // Purple 1
      'rgba(184,112,255,',  // Purple 2
      'rgba(133,52,243,',   // Copilot Purple
      'rgba(242,245,243,',  // Gray 1 (white particles)
      'rgba(184,112,255,',  // Purple 2 again (more weight)
    ];

    for (let i = 0; i < count; i++) {
      const ox = Math.random() * canvas.width;
      const oy = Math.random() * canvas.height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: ox, y: oy,
        originX: ox, originY: oy,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color
      });
    }
  }

  // ─── Main animation loop ────────────────────────────────────────────────────
  private time = 0;

  private animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());
    this.time += 0.004;

    const canvas = this.bgCanvasRef.nativeElement;
    const ctx    = this.ctx;
    const W = canvas.width, H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0c0c10';
    ctx.fillRect(0, 0, W, H);

    // ── Aurora blobs ────────────────────────────────────────────────────
    for (const blob of this.blobs) {
      const t  = this.time + blob.phase;
      const bx = ((blob.x + Math.sin(t * 0.7) * 0.12) * W);
      const by = ((blob.y + Math.cos(t * 0.5) * 0.1) * H);
      const br = blob.r * Math.min(W, H);

      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, `hsla(${blob.hue},80%,55%,0.18)`);
      grad.addColorStop(0.4, `hsla(${blob.hue + 20},70%,45%,0.08)`);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(bx, by, br * 1.4, br, Math.sin(t * 0.3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Particles (mouse repel) ─────────────────────────────────────────
    const REPEL_RADIUS = 120;
    const REPEL_FORCE  = 3.5;
    const RETURN_EASE  = 0.04;

    for (const p of this.particles) {
      // Distance from mouse
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS) {
        // Repel away from mouse
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
        p.vx += (dx / dist) * force * REPEL_FORCE;
        p.vy += (dy / dist) * force * REPEL_FORCE;
      }

      // Return to origin (spring)
      p.vx += (p.originX - p.x) * RETURN_EASE;
      p.vy += (p.originY - p.y) * RETURN_EASE;

      // Damping
      p.vx *= 0.88;
      p.vy *= 0.88;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Draw particle
      const alphaMod = dist < REPEL_RADIUS
        ? p.opacity * (1 + (REPEL_RADIUS - dist) / REPEL_RADIUS * 1.5)
        : p.opacity;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${Math.min(alphaMod, 0.9)})`;
      ctx.fill();
    }

    // ── Spotlight at mouse ──────────────────────────────────────────────
    if (this.mouse.x > 0) {
      const spotlight = ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, 200
      );
      spotlight.addColorStop(0, 'rgba(184,112,255,0.04)');
      spotlight.addColorStop(1, 'transparent');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ─── App logic & Routing ────────────────────────────────────────────────────
  searchProfile(user: string) {
    if (!user) return;
    this.router.navigate(['/dashboard', user]);
  }

  handleCompare(event: {left: string, right: string}) {
    if (!event.left || !event.right) return;
    this.router.navigate(['/dashboard/compare', event.left, event.right]);
  }

  resetView(navigate: boolean = true) {
    this.profile = null;
    this.comparison = null;
    this.error = null;
    this.isJsonView = false;
    if (navigate) {
      this.router.navigate(['/']);
    }
  }

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  private fetchProfile(user: string) {
    this.loading = true;
    this.error = null;
    this.comparison = null;

    this.http.get(`/api/profile/${user}`).subscribe({
      next: (data) => { this.profile = data; this.loading = false; },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao buscar perfil. Verifique se o usuário existe.';
        this.loading = false;
      }
    });
  }

  private fetchComparison(user1: string, user2: string) {
    this.loading = true;
    this.error = null;
    this.profile = null;

    this.http.get(`/api/profile/compare?left=${user1}&right=${user2}`).subscribe({
      next: (data) => { this.comparison = data; this.loading = false; },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao buscar dados. Verifique os usuários.';
        this.loading = false;
      }
    });
  }

  downloadAsImage(element: HTMLElement) {
    if (!element) return;
    html2canvas(element, { backgroundColor: '#0c0c10', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `devprofile-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }
}
