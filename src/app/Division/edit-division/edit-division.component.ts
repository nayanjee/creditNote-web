import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-edit-division',
  templateUrl: './edit-division.component.html',
  styleUrls: ['./edit-division.component.css']
})
export class EditDivisionComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Edit / Update Division';
  subheading = 'Update a division';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loggedUserId: any = '';
  divisionform: FormGroup;
  submitted = false;
  btnLoader = false;
  selectedDivision: any;
  records: any = [];
  plants = [
    { id: '2200', name: '2200' },
    { id: '3300', name: '3300' },
  ];
  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService) {
    this.selectedDivision = this.activatedRoute.snapshot.paramMap.get('divisionId');
  }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.getData();
    this.createForm();
  }

  getData() {
    this.apiService.get('/api/division/getdivision', this.selectedDivision).subscribe((response: any) => {
      if (response.status === 200) {

        this.records = response.data;
        console.log('this.records--', this.records);
        this.divisionform.controls['plant'].setValue(this.records.plant, { onlySelf: true });
        this.divisionform.value.plant = this.records.plant;
        this.divisionform.controls['name'].setValue(this.records.name, { onlySelf: true });
        this.divisionform.value.name = this.records.name;
        this.divisionform.controls['_id'].setValue(this.records._id, { onlySelf: true });
        this.divisionform.value._id = this.records._id;


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
  get f() { return this.divisionform.controls; }
  createForm() {
    this.divisionform = this.fb.group({
      _id: [this.selectedDivision, [Validators.required]],
      plant: [this.records.plant, [Validators.required]],
      name: [this.records.name, [Validators.required]],

      loggedUserId: this.loggedUserId,

    });
  }
  onSubmit() {


    this.submitted = true;
    let error = false;
    const plant = $('#plant').val();
    const divisionName = $('#divisionName').val();
    //const divisionID = $('#divisionID').val();
    if (!plant) {
      error = true;
      $('#plant').addClass('is-invalid');
      $('#err_plant').text('Plant is required').show();
    }
    if (!divisionName) {
      error = true;
      $('#divisionName').addClass('is-invalid');
      $('#err_divisionname').text('Division name is required').show();
    }
    // if (!divisionID) {
    //   error = true;
    //   $('#divisionID').addClass('is-invalid');
    //   $('#err_divisionid').text('Division id is required').show();
    // }
    //console.log('xxxxxxxxxx', this.divisionform.value);
    if (!error) {
      this.apiService.post('/api/division/edit', this.divisionform.value).subscribe((response: any) => {
        console.log(response);
        if (response.status === 200) {

          this.toast('success', 'Record has been successfully updated.');
          //this.router.navigateByUrl('/users/listUser');
        }
        else if (response.status === 400) {
          this.toast('error', response.message);
        }
        else {
          this.toast('error', 'Something went wrong, Please try again after some time');
        }
      });
    }

  }

}
