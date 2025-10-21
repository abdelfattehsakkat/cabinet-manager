import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
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
    MatTooltipModule
  ]
})
export class UserManagementComponent implements OnInit {
  @ViewChild('userDetailsDialog') userDetailsDialog!: TemplateRef<any>;
  
  displayedColumns: string[] = ['username', 'email', 'firstName', 'lastName', 'role', 'actions'];
  dataSource: MatTableDataSource<User>;
  selectedUser: User | null = null;
  private userDetailsDialogRef: MatDialogRef<any> | null = null;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<User>();
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    // Temporary mock data for testing
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'ali.gharbi',
        email: 'ali.gharbi@gmail.com',
        firstName: 'Ali',
        lastName: 'Gharbi',
        role: 'ADMIN',
        createdAt: new Date('2025-01-15')
      },
      {
        id: 2, 
        username: 'fatma.sakkat',
        email: 'fatma.sakkat@gmail.com',
        firstName: 'Fatma',
        lastName: 'Sakkat',
        role: 'DOCTOR',
        createdAt: new Date('2025-02-20')
      }
    ];
    this.dataSource.data = mockUsers;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addUser() {
    // TODO: Implement user creation dialog
    console.log('Add user functionality to be implemented');
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
      this.dataSource.data = this.dataSource.data.filter(u => u.id !== user.id);
    }
  }
}