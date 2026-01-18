import { Component, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSidenavModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'CPSC Cornerstone';
  currentUser = computed(() => this.authService.currentUser());
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile-settings']);
  }

  getUserInitial(): string {
    const user = this.currentUser();
    if (user?.screenName) {
      return user.screenName.charAt(0).toUpperCase();
    }
    return 'U';
  }

  signOut(): void {
    this.authService.signOut();
  }
}
