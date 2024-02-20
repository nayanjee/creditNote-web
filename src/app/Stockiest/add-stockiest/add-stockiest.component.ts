import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;
@Component({
  selector: 'app-add-stockiest',
  templateUrl: './add-stockiest.component.html',
  styleUrls: ['./add-stockiest.component.css']
})
export class AddStockiestComponent implements OnInit {
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create Stockiest';
  subheading = 'Create a stockist';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  stockiestForm: FormGroup;
  submitted = false;
  btnLoader = false;
  portalId: number;
  loggedUserId: any = '';
  plants: any = [];
  status = [
    { id: true, name: 'Active' },
    { id: false, name: 'In-Active' },
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
    this.getuniqueplant();
    this.createForm();
  }
  getuniqueplant() {
    this.apiService.fetch('/api/stockiest/getdistinctplan').subscribe((response: any) => {
      if (response.status === 200) {
        this.plants = response.data;
      }
    });
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
    this.stockiestForm = this.fb.group({
      organization: ['', [Validators.required]],
      plant: [''],
      customerid: ['', [Validators.required]],
      status: [''],
      loggedUserId: this.loggedUserId,

    });
  }
  onSubmit() {

    //console.log('xxxxxxxxxx', this.stockiestForm.value);
    this.submitted = true;
    let error = false;

    const organization = $("#organization").val();
    const plant = $.trim($("#plant").val());
    const customerid = $("#customerid").val();
    const status = $("#status").val();
    if (!organization) {
      error = true;
      $('#organization').addClass('is-invalid');
      $('#err_organization').text('Organization is required').show();
    }
    else {
      $('#organization').removeClass('is-invalid');
      $('#err_organization').text('Organization is required').hide();
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
    //console.log('xxxxxxxxxx', this.divisionform.value);
    if (!error) {
      this.apiService.post('/api/stockiest/add', this.stockiestForm.value).subscribe((response: any) => {
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
