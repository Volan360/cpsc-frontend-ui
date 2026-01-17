import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

export interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
  met: boolean;
}

@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './password-requirements.component.html',
  styleUrl: './password-requirements.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(-10px)' }))
      ])
    ])
  ]
})
export class PasswordRequirementsComponent implements OnInit, OnDestroy {
  @Input() passwordControl!: FormControl;
  @Input() visible: boolean = false;
  
  requirements: PasswordRequirement[] = [
    {
      label: 'At least 8 characters',
      validator: (password: string) => password.length >= 8,
      met: false
    },
    {
      label: 'At least one uppercase letter',
      validator: (password: string) => /[A-Z]/.test(password),
      met: false
    },
    {
      label: 'At least one lowercase letter',
      validator: (password: string) => /[a-z]/.test(password),
      met: false
    },
    {
      label: 'At least one number',
      validator: (password: string) => /\d/.test(password),
      met: false
    },
    {
      label: 'At least one special character (!@#$%^&*)',
      validator: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      met: false
    }
  ];

  private subscription?: Subscription;

  ngOnInit(): void {
    if (this.passwordControl) {
      // Check initial value
      this.checkRequirements(this.passwordControl.value || '');
      
      // Subscribe to value changes
      this.subscription = this.passwordControl.valueChanges.subscribe(value => {
        this.checkRequirements(value || '');
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private checkRequirements(password: string): void {
    this.requirements.forEach(req => {
      req.met = req.validator(password);
    });
  }

  get allRequirementsMet(): boolean {
    return this.requirements.every(req => req.met);
  }
}
