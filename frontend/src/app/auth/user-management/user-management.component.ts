import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { UserFormDialogComponent } from './user-form-dialog.component';

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
    MatSortModule
  ]
})
export class UserManagementComponent implements OnInit {
  displayedColumns: string[] = ['username', 'email', 'firstName', 'lastName', 'role', 'actions'];
  dataSource: MatTableDataSource<User>;

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
    this.authService.getUsers().subscribe(users => {
      this.dataSource.data = users;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addUser() {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.createUser(result).subscribe(() => {
          this.loadUsers();
        });
      }
    });
  }

  editUser(user: User) {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && user.id) {
        this.authService.updateUser(user.id, result).subscribe(() => {
          this.loadUsers();
        });
      }
    });
  }

  deleteUser(user: User) {
    if (confirm('Are you sure you want to delete this user?') && user.id) {
      this.authService.deleteUser(user.id).subscribe(() => {
        this.loadUsers();
      });
    }
  }
}