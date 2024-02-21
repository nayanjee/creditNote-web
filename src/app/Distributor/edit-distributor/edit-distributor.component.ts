import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;

@Component({
  selector: 'app-edit-distributor',
  templateUrl: './edit-distributor.component.html',
  styleUrls: ['./edit-distributor.component.css']
})
export class EditDistributorComponent implements OnInit {
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
  records: any = [];
  selectedDist: any;
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
    private apiService: AppServicesService) { this.selectedDist = this.activatedRoute.snapshot.paramMap.get('distId'); }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.portalId = JSON.parse(sessionData).portal;
    this.getData();
    this.createForm();
  }

  getData() {
    this.apiService.get('/api/distributor', this.selectedDist).subscribe((response: any) => {
      if (response.status === 200) {

        this.records = response.data;
        //console.log('this.records--', this.records);
        this.distForm.controls['plant'].setValue(this.records.plant, { onlySelf: true });
        this.distForm.value.plant = this.records.plant;

        this.distForm.controls['oldplant'].setValue(this.records.plant, { onlySelf: true });
        this.distForm.value.oldplant = this.records.plant;

        this.distForm.controls['organization'].setValue(this.records.organization, { onlySelf: true });
        this.distForm.value.organization = this.records.organization;
        this.distForm.controls['customerId'].setValue(this.records.customerId, { onlySelf: true });
        this.distForm.value.customerId = this.records.customerId;

        this.distForm.controls['oldcustomerId'].setValue(this.records.customerId, { onlySelf: true });
        this.distForm.value.oldcustomerId = this.records.customerId;

        this.distForm.controls['company'].setValue(this.records.company, { onlySelf: true });
        this.distForm.value.company = this.records.company;

        this.distForm.controls['oldcompany'].setValue(this.records.company, { onlySelf: true });
        this.distForm.value.oldcompany = this.records.company;

        this.distForm.controls['status'].setValue(this.records.isActive, { onlySelf: true });
        this.distForm.value.status = this.records.isActive;
        this.distForm.controls['_id'].setValue(this.records._id, { onlySelf: true });
        this.distForm.value._id = this.records._id;


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
    this.distForm = this.fb.group({
      _id: [this.selectedDist, [Validators.required]],
      organization: ['', Validators.required],
      plant: ['', Validators.required],
      oldplant: [this.records.plant, Validators.required],
      customerId: ['', Validators.required],
      oldcustomerId: [this.records.customerId, [Validators.required]],
      status: ['', Validators.required],
      company: ['', Validators.required],
      oldcompany: [this.records.company, [Validators.required]],
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
      $('#err_organization').text('Organization is required').show();
    }
    else {
      $('#organization').removeClass('is-invalid');
      $('#err_organization').text('Organization is required').hide();
    }
    if (!company) {
      error = true;
      $('#company').addClass('is-invalid');
      $('#err_company').text('Company is required').show();
    }
    else {
      $('#company').removeClass('is-invalid');
      $('#err_company').text('Status is required').hide();
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
      this.apiService.post('/api/distributor/edit', this.distForm.value).subscribe((response: any) => {
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
