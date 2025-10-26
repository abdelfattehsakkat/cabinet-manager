import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { User, UserRole } from '../models/user.model';

@Component({
	selector: 'app-user-form-dialog',
	templateUrl: './user-form-dialog.component.html',
	styleUrls: ['./user-form-dialog.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatIconModule
	]
})
export class UserFormDialogComponent {
	userForm: FormGroup;
	roles: UserRole[] = ['ADMIN', 'DOCTOR', 'SECRETARY'];
	isEditMode: boolean = false;

	constructor(
		private fb: FormBuilder,
		public dialogRef: MatDialogRef<UserFormDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: Partial<User> | null
	) {
		this.isEditMode = !!data && !!data._id;
		this.userForm = this.fb.group({
			firstName: [data?.firstName || '', Validators.required],
			lastName: [data?.lastName || '', Validators.required],
			email: [data?.email || '', [Validators.required, Validators.email]],
			password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
			role: [data?.role || '', Validators.required],
			phoneNumber: [data?.phoneNumber || ''],
			specialization: [data?.specialization || '']
		});
	}

	onSubmit() {
		if (this.userForm.valid) {
			const user = this.userForm.value;
			if (this.isEditMode) {
				delete user.password;
			}
			this.dialogRef.close(user);
		}
	}

	onCancel() {
		this.dialogRef.close();
	}
}
