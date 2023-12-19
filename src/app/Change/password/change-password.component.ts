import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';

import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  loggedUser: any = [];
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Change Password';
  subheading = 'Update old password.';
  icon = 'pe-7s-user icon-gradient bg-premium-dark';

  myForm: FormGroup;
  type: string = '';
  ownerPercent = '';
  coOwnerNumber = '';
  submitted = false;
  btnLoader = false;
  selectedType: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.type = params.type;
    });
  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    console.log('sessionStorageCP---', sessionData);
    if (sessionData) {
      this.loggedUser = JSON.parse(sessionData);
    } else {
      this.router.navigateByUrl('/login');
    }
    
    this.createForm();

    if (this.type) {
      this.selectedType = this.type;
      this.myForm.controls['type'].setValue(this.type, {onlySelf: true});
      this.myForm.value.type = this.type;
    }
  }

  get f() { return this.myForm.controls; }

  createForm() {
    this.myForm = this.fb.group({
      old:      ['', [Validators.required]],
      new:      ['', [Validators.required]],
      confirm:  ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.myForm.valid) {
      if (this.myForm.value.old === this.myForm.value.new) {
        $('#errmsg').show();
        $('#errmsg').html('Current password and new password should not be same.');
        return;
      }

      if (this.myForm.value.new != this.myForm.value.confirm) {
        $('#errmsg').show();
        $('#errmsg').html('New password and confirm password must be same.');
        return;
      }

      this.submitted = true;
      this.btnLoader = true;

      const reqData = {
        userId: this.loggedUser.id,
        password: this.myForm.value.old,
        newPassword: this.myForm.value.new
      }
      
      console.log(this.loggedUser);
      console.log(reqData);
      this.apiService.post('/api/auth/password', reqData).subscribe((response: any) => {
        console.log('response---', response);
        if (response.status === 200) {

        }
      });
    } else {
      this.btnLoader = false;
    }
  }

  isCoOwnerHandler(event) {
    $('.formError').hide();
    const val = event.target.value.toLowerCase();
    if (val == 1) {
      $('.showcoowner').show();

      // this.myForm.value.opercent = 50;
      // $('#opercent').val('50');
      // $("#opercent").prop("disabled", false);

      // this.myForm.value.cono = 1;
      // $('#cono').val('1');
      // $("#cono").prop("disabled", false);

      // this.ownerPercent   = this.myForm.value.opercent;
      // this.coOwnerNumber  = this.myForm.value.cono;
    } else {
      $('.showcoowner').hide();

      // this.myForm.value.opercent = 100;
      // $('#opercent').val('100');
      // $("#opercent").prop("disabled", true);

      // this.myForm.value.cono = 0;
      // $('#cono').val('0');
      // $("#cono").prop("disabled", true);

      // this.ownerPercent   = this.myForm.value.opercent;
      // this.coOwnerNumber  = this.myForm.value.cono;
    }

    console.log(event.target.value);
  }

  /* ownerNumberHandler(event) {
    const isCoOwner = this.myForm.value.isco;
    if (isCoOwner === 'yes') {
      if (event.target.value > 0) {
        const val = parseInt(event.target.value) + 1;
        const calc = 100 / val;
        $('#opercent').val(calc);
        this.myForm.value.opercent = calc;

        $('#conoError').hide();
        $('#cono').removeClass('is-invalid');
      } else {
        this.myForm.value.cono = 0;

        $('#opercent').val(100);
        this.myForm.value.opercent = 100;

        $('#conoError').show();
        $('#cono').addClass('is-invalid');
      }
      this.ownerPercent   = this.myForm.value.opercent;
      this.coOwnerNumber  = this.myForm.value.cono;
    } else {
      this.myForm.value.cono = 0;
      $('#cono').val('0');
      $("#cono").prop("disabled", true);

      this.myForm.value.opercent = 100;
      $('#opercent').val('100');
      $("#opercent").prop("disabled", true);

      this.ownerPercent   = this.myForm.value.opercent;
      this.coOwnerNumber  = this.myForm.value.cono;
    }
  } */

  ownerPercentHandler(event) {
    $('.formError').hide();
  }

  errorHandling(error: any) {
    try {
      // this.isLoading = false;
      const errorObj = error ? JSON.parse(error) : '';
      //this.toastr.error(errorObj.message, 'Error');
    } catch (error) {
      //this.toastr.error(error.message, 'Error');
    }
  }
}
