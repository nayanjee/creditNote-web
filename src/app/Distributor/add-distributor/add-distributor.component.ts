import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;

@Component({
  selector: 'app-add-distributor',
  templateUrl: './add-distributor.component.html',
  styleUrls: ['./add-distributor.component.css']
})
export class AddDistributorComponent implements OnInit {
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create Distributor';
  subheading = 'Create a Distributor';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  distForm: FormGroup;
  submitted = false;
  btnLoader = false;
  portalId: number;
  loggedUserId: any = '';
  plants: any = [];
  status = [
    { id: true, name: 'Active' },
    { id: false, name: 'In-Active' },
  ];
  company = [
    { id: 2200, name: '2200 - La Renon' },
    { id: 3300, name: '3300 - Frimline' },
  ];
  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService) { }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.portalId = JSON.parse(sessionData).portal;

    this.createForm();
  }
  toast(typeIcon, message) {
    // typeIcon = error, success, warning, info, question
    Swal.fire({
      toast: true,
      position: 'top-right',
      showConfirmButton: false,
      icon: typeIcon,
      timerProgressBar: true,
      timer: 5000,
      title: message
    })
  }
  createForm() {
    this.distForm = this.fb.group({
      organization: ['', Validators.required],
      plant: ['', Validators.required],
      customerId: ['', Validators.required],
      status: ['', Validators.required],
      company: ['', Validators.required],
      loggedUserId: this.loggedUserId,
    });
  }

  onSubmit() {

    //console.log('xxxxxxxxxx', this.distForm.value);
    this.submitted = true;
    let error = false;

    const organization = $("#organization").val();
    const plant = $.trim($("#plant").val());
    const customerid = $("#customerid").val();
    const company = $("#company").val();
    const status = $("#status").val();
    if (!organization) {
      error = true;
      $('#organization').addClass('is-invalid');
      $('#err_organization').text('Distributor is required').show();
    }
    else {
      $('#organization').removeClass('is-invalid');
      $('#err_organization').text('Distributor is required').hide();
    }
    if (!company) {
      error = true;
      $('#company').addClass('is-invalid');
      $('#err_company').text('Organization is required').show();
    }
    else {
      $('#company').removeClass('is-invalid');
      $('#err_company').text('Organization is required').hide();
    }
    if (!plant) {
      error = true;
      $('#plant').addClass('is-invalid');
      $('#err_plant').text('Plant is required').show();
    }
    else {
      $('#plant').removeClass('is-invalid');
      $('#err_plant').text('Plant is required').hide();
    }
    if (!customerid) {
      error = true;
      $('#customerid').addClass('is-invalid');
      $('#err_customerid').text('Customer ID is required').show();
    }
    else {
      $('#customerid').removeClass('is-invalid');
      $('#err_customerid').text('Customer ID is required').hide();
    }
    if (!status) {
      error = true;
      $('#status').addClass('is-invalid');
      $('#err_status').text('Status is required').show();
    }
    else {
      $('#status').removeClass('is-invalid');
      $('#err_status').text('Status is required').hide();
    }
    if (!error) {
      this.apiService.post('/api/distributor/add', this.distForm.value).subscribe((response: any) => {
        console.log(response);
        if (response.status === 200) {

          this.toast('success', 'Record has been successfully updated.');

        }
        else if (response.status === 400) {
          this.toast('error', response.message);

        }
        else {
          this.toast('error', 'Something went wrong, Please try again after some time');
        }
        //this.ngOnInit();
      });
    }
  }


}
