import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class LandingComponent implements OnInit {
  scrollY = 0;
  showContent = false;
  
  isVisible = {
    features: false,
    stats: false,
    howItWorks: false
  };

  features = [
    {
      icon: 'account_balance',
      title: 'Track Your Accounts',
      description: 'Monitor all your bank accounts, credit cards, and investments in one unified dashboard.',
      color: '#4A90E2'
    },
    {
      icon: 'receipt_long',
      title: 'Manage Transactions',
      description: 'Record and categorize every transaction with tags and detailed notes for complete visibility.',
      color: '#7B68EE'
    },
    {
      icon: 'stars',
      title: 'Set Financial Goals',
      description: 'Create savings targets and allocate funds across accounts to achieve your dreams.',
      color: '#FF6B6B'
    },
    {
      icon: 'insights',
      title: 'Smart Analytics',
      description: 'Gain insights with powerful visualizations and reports on your spending patterns.',
      color: '#4ECDC4'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.showContent = true;
    }, 100);
    
    // Set up intersection observers for scroll animations
    if (typeof IntersectionObserver !== 'undefined') {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.classList.contains('features-section')) {
              this.isVisible.features = true;
            } else if (target.classList.contains('stats-section')) {
              this.isVisible.stats = true;
            } else if (target.classList.contains('how-it-works')) {
              this.isVisible.howItWorks = true;
            }
          }
        });
      }, observerOptions);
      
      // Observe sections after view init
      setTimeout(() => {
        const sections = document.querySelectorAll('.features-section, .stats-section, .how-it-works');
        sections.forEach(section => observer.observe(section));
      }, 200);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollY = window.scrollY;
    
    // Apply parallax to background elements
    const heroBackground = document.querySelector('.hero-background') as HTMLElement;
    if (heroBackground) {
      heroBackground.style.transform = `translate3d(0, ${this.scrollY * 0.5}px, 0)`;
    }
  }

  getParallaxTransform(): string {
    return '';
  }

  navigateToSignIn(): void {
    this.router.navigate(['/auth/sign-in']);
  }

  navigateToSignUp(): void {
    this.router.navigate(['/auth/sign-up']);
  }
}
