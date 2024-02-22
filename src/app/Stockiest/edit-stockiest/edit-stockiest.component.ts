import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;
@Component({
  selector: 'app-edit-stockiest',
  templateUrl: './edit-stockiest.component.html',
  styleUrls: ['./edit-stockiest.component.css']
})
export class EditStockiestComponent implements OnInit {
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Edit / Update Stockiest';
  subheading = 'Update a stockist';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  stockiestForm: FormGroup;
  submitted = false;
  btnLoader = false;
  portalId: number;
  loggedUserId: any = '';
  selectedStockiest: any;
  records: any = [];
  plants: any = [];
  status = [
    { id: true, name: 'Active' },
    { id: false, name: 'In-Active' },
  ];
  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService) {
    this.selectedStockiest = this.activatedRoute.snapshot.paramMap.get('stockiestId');
  }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.portalId = JSON.parse(sessionData).portal;
    this.getuniqueplant();
    this.getData();
    this.createForm();
  }

  getuniqueplant() {
    this.apiService.fetch('/api/stockiest/getdistinctplan').subscribe((response: any) => {
      if (response.status === 200) {
        this.plants = response.data;
      }
    });
  }

  getData() {
    this.apiService.get('/api/stockiest', this.selectedStockiest).subscribe((response: any) => {
      if (response.status === 200) {

        this.records = response.data;
        //console.log('this.records--', this.records);
        this.stockiestForm.controls['plant'].setValue(this.records.plant, { onlySelf: true });
        this.stockiestForm.value.plant = this.records.plant;

        this.stockiestForm.controls['oldplantcode'].setValue(this.records.plant, { onlySelf: true });
        this.stockiestForm.value.oldplantcode = this.records.plant;

        this.stockiestForm.controls['organization'].setValue(this.records.organization, { onlySelf: true });
        this.stockiestForm.value.organization = this.records.organization;
        this.stockiestForm.controls['customerid'].setValue(this.records.customerId, { onlySelf: true });
        this.stockiestForm.value.customerid = this.records.customerId;

        this.stockiestForm.controls['oldcustomerId'].setValue(this.records.customerId, { onlySelf: true });
        this.stockiestForm.value.oldcustomerId = this.records.customerId;

        this.stockiestForm.controls['status'].setValue(this.records.isActive, { onlySelf: true });
        this.stockiestForm.value.status = this.records.isActive;
        this.stockiestForm.controls['_id'].setValue(this.records._id, { onlySelf: true });
        this.stockiestForm.value._id = this.records._id;


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
      _id: [this.selectedStockiest, [Validators.required]],
      organization: ['', [Validators.required]],
      plant: [''],
      customerid: ['', [Validators.required]],
      status: [''],
      //newplantcode: [this.records.plant, [Validators.required]],
      oldplantcode: [this.records.plant, [Validators.required]],
      //newcustomerId: [this.records.newcustomerId, [Validators.required]],
      oldcustomerId: [this.records.newcustomerId, [Validators.required]],
      loggedUserId: this.loggedUserId,

    });
  }
  onSubmit() {

    console.log('xxxxxxxxxx', this.stockiestForm.value);
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
      this.apiService.post('/api/stockiest/edit', this.stockiestForm.value).subscribe((response: any) => {
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
