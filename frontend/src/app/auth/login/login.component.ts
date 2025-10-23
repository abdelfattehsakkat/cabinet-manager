import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [SharedModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  returnUrl: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return URL from route parameters or default to '/patients'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/patients';
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackBar.open(
            `Bienvenue ${user.firstName} ${user.lastName}!`, 
            'Fermer', 
            { duration: 3000 }
          );
          
          // Redirect based on user role if no specific return URL
          if (this.returnUrl === '/patients') {
            switch (user.role) {
              case 'ADMIN':
                this.router.navigate(['/dashboard']);
                break;
              case 'DOCTOR':
                this.router.navigate(['/patients']);
                break;
              case 'SECRETARY':
                this.router.navigate(['/patients']);
                break;
              default:
                this.router.navigate(['/patients']);
            }
          } else {
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Erreur de connexion';
          
          if (error.status === 401) {
            errorMessage = 'Email ou mot de passe incorrect';
          } else if (error.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Fermer', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Mot de passe'} requis`;
      }
      if (field.errors['email']) {
        return 'Email invalide';
      }
      if (field.errors['minlength']) {
        return 'Le mot de passe doit contenir au moins 6 caractères';
      }
    }
    return '';
  }
}
