import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AppServicesService } from './../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-login-boxed',
  templateUrl: './login-boxed.component.html',
  styles: []
})
export class LoginBoxedComponent implements OnInit {
  loggedUserId: any = '';
  submitted: boolean = false;
  loginForm: any = FormGroup;
  selectedType: number = 3;
  selectedPortal: any;
  portals: any = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private apiService: AppServicesService
  ) { }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");

    if (sessionData) this.router.navigateByUrl('/');

    /* this.loggedUserId = localStorage.getItem('laUserId'); 
    if (typeof this.loggedUserId === 'string' && this.loggedUserId != 'null') {
      this.router.navigateByUrl('/');
    } else if (typeof this.loggedUserId != 'object' && this.loggedUserId != null) {
      this.router.navigateByUrl('/');
    } */

    this.getPortals();

    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: [''],
    });
  }

  //get f() { return this.loginFormStockist.controls; }

  onSubmit() {
    $('#errmsg').hide();
    $('.invalid-feedback').hide();
    $('.form-control').removeClass("is-invalid");

    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    if (!email || !password) {
      if (!email) {
        $('#err-email').html('Email is required.');
        $('#email').addClass("is-invalid");
        $('#err-email').show();
      }

      if (!password) {
        $('#err-pass').html('Password is required.');
        $('#password2').addClass("is-invalid");
        $('#err-pass').show();
      }
      return;
    }

    var pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!pattern.test(email)) {
      $('#err-email').html('Enter a valid email address.');
      $('#email').addClass("is-invalid");
      $('#err-email').show();
      return;
    }

    this.submitted = true;

    /* Remove all session storage if any */
    sessionStorage.removeItem('laUser')
    sessionStorage.clear();
    /* EOF Remove all session storage */

    const reqData = {
      email: email.trim().toLowerCase(),
      otp:   password.trim(),
      // portal: 'creditNoteApp',
      // type: this.selectedType
    }

    this.apiService.post('/api/auth/verifyotp', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        console.log('response.data---', response.data);
        const storage = {
          id: response.data.id,
          img: response.data.image,
          name: response.data.name,
          type: response.data.type,
          workType: response.data.workType,
          permissions: response.data.permissions
        }
        sessionStorage.setItem('laUser', JSON.stringify(storage));

        this.router.navigateByUrl('/dashboard');
      } else {
        if (response.status === 400) {
          $('#errmsg').show();
          $('#errmsg').html(response.message);
        } else {
          $('#errmsg').show();
          $('#errmsg').html('Something went wrong please try again.');
        }

        this.submitted = false;
      }
    }, (errorResult) => {
      this.errorHandling(errorResult);
    });
  }

  /* onSubmit() {
    $('#errmsg').hide();
    $('.invalid-feedback').hide();
    $('.form-control').removeClass("is-invalid");
    
    const email     = this.loginForm.value.email;
    const password  = this.loginForm.value.password;

    if (!email || !password) {
      if (!email) {
        $('#err-email').html('Email is required.');
        $('#email').addClass("is-invalid");
        $('#err-email').show();
      }

      if (!password) {
        $('#err-pass').html('Password is required.');
        $('#password2').addClass("is-invalid");
        $('#err-pass').show();
      }
      return;
    }

    var pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!pattern.test(email)) {
      $('#err-email').html('Enter a valid email address.');
      $('#email').addClass("is-invalid");
      $('#err-email').show();
      return;
    }

    // if (this.selectedType === 1 && !this.selectedPortal) {
    //   $('#err-portal').html('Portal is required.');
    //   $('#portal').addClass("is-invalid");
    //   $('#err-portal').show();
    //   return;
    // }
    
    // const portal = (this.selectedType === 2 || this.selectedType === 3) ? 'creditNoteApp' : this.selectedPortal.slug;

    this.submitted = true;
    
    const reqData = {
      email:      email,
      // password:   password,
      portal:     'creditNoteApp',
      type:       this.selectedType
    }

    // Remove all session storage if any  
    sessionStorage.removeItem('laUser')
    sessionStorage.clear();
    // EOF Remove all session storage

    this.apiService.post('/api/auth/signin', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        const storage = {
          id: response.data.id,
          img: response.data.image,
          name: response.data.name,
          type: response.data.type,
          workType: response.data.workType,
          permissions: response.data.permissions
        }
        sessionStorage.setItem('laUser', JSON.stringify(storage));

        this.router.navigateByUrl('/dashboard');
      } else {
        if (response.status === 400) {
          $('#errmsg').show();
          $('#errmsg').html(response.message);
        } else {
          $('#errmsg').show();
          $('#errmsg').html('Something went wrong please try again.');
        }

        this.submitted = false;
      }
    }, (errorResult) => {
      this.errorHandling(errorResult);
    });
  } */

  sendOtp() {
    console.log('Send OTP');

    $('#errmsg').hide();
    $('.invalid-feedback').hide();
    $('.form-control').removeClass("is-invalid");

    const email = $('#email').val().trim().toLowerCase();

    if (!email) {
      $('#err-email').html('Email is required.');
      $('#email').addClass("is-invalid");
      $('#err-email').show();
      return;
    }

    var pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!pattern.test(email)) {
      $('#err-email').html('Enter a valid email address.');
      $('#email').addClass("is-invalid");
      $('#err-email').show();
      return;
    }

    const reqData = {
      email: email
    }

    this.apiService.post('/api/auth/generateotp', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        console.log(response);
        $('#otpmsg').show();
        $('#email').attr('readonly', true);
        $('#btnOtp').hide();
        $('#txtOtp').show();
        $('#submitBtn').show();
      } else {
        if (response.status === 400) {
          $('#otpmsg').hide();
          $('#email').attr('readonly', false);
          $('#btnOtp').show();
          $('#txtOtp').hide();
          $('#submitBtn').hide();

          $('#errmsg').show();
          $('#errmsg').html(response.message);
        } else {
          $('#errmsg').show();
          $('#errmsg').html('Something went wrong please try again.');
        }

        //this.submitted = false;
      }
    }, (errorResult) => {
      this.errorHandling(errorResult);
    });
  }

  radioChange(event) {
    $('#portal').hide();

    if (event.target.value === '1') // Employee
      $('#portal').show();

    if (event.target.value === '2') // Stockist
      $('#portal').val('');

    this.selectedType = parseInt(event.target.value);
  }

  changePortal(event) {
    const val = event.target.value;
    const temp = this.portals.filter(function (d) {
      return d.slug.indexOf(val) !== -1 || !val;
    });

    this.selectedPortal = temp[0];
  }

  getPortals() {
    this.apiService.fetch('/api/portal/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.portals = response.data;
        }
      }
    });
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
