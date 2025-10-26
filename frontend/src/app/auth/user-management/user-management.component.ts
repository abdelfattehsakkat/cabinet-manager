import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
// import { UserFormDialogComponent } from './user-form-dialog.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatTooltipModule,
    MatCardModule
  ]
})
export class UserManagementComponent implements OnInit {
  @ViewChild('userDetailsDialog') userDetailsDialog!: TemplateRef<any>;
  
  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'role', 'actions'];
  dataSource: MatTableDataSource<User>;
  selectedUser: User | null = null;
  private userDetailsDialogRef: MatDialogRef<any> | null = null;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private userService: UserService
  ) {
    this.dataSource = new MatTableDataSource<User>();
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addUser() {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: (user) => {
            this.loadUsers();
          },
          error: (err) => {
            console.error('Erreur création utilisateur', err);
          }
        });
      }
    });
  }

  editUser(user: User) {
    // TODO: Implement user edit dialog
    console.log('Edit user functionality to be implemented', user);
  }

  viewUser(user: User) {
    this.selectedUser = user;
    this.userDetailsDialogRef = this.dialog.open(this.userDetailsDialog, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'user-details-dialog-panel'
    });
  }

  editUserFromDialog() {
    if (this.selectedUser && this.userDetailsDialogRef) {
      this.userDetailsDialogRef.close();
      this.editUser(this.selectedUser);
    }
  }

  deleteUser(user: User) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      // TODO: Implement actual delete functionality
      console.log('Delete user functionality to be implemented', user);
      // Remove from mock data for now
  this.dataSource.data = this.dataSource.data.filter(u => u._id !== user._id);
    }
  }
}