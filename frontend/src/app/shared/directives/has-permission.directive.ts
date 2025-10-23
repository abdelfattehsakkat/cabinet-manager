import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuPermissionService } from '../services/menu-permission.service';
import { AuthService } from '../../auth/services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasView = false;

  @Input() set appHasPermission(permission: string) {
    this.permission = permission;
    this.updateView();
  }

  @Input() set appHasPermissionAction(action: string) {
    this.action = action;
    this.updateView();
  }

  private permission?: string;
  private action?: string;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private menuPermissionService: MenuPermissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    let hasPermission = false;

    if (this.permission) {
      hasPermission = this.menuPermissionService.canAccessMenu(this.permission);
    } else if (this.action) {
      hasPermission = this.menuPermissionService.canPerformAction(this.action);
    }

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}