import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create User';
  subheading = 'Create a user / stockist';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  userForm: FormGroup;
  submitted = false;
  btnLoader = false;

  loggedUserId: any = '';

  selectedDivision: any = [];
  divisions: any = [];
  selectedStockiest: any = [];
  selectedDistributor: any = [];
  selectedPermission: any = [];
  selectedusertype: number;
  stockiestes: any = [];
  distributors: any = [];
  accesspermissions: any = [];
  portalId: number;


  userTypes = [
    { id: 1, name: 'Head Office' },
    { id: 2, name: 'Field Officer' },
    { id: 3, name: 'Distributor' },
    { id: 4, name: 'Stockiest' },

  ];


  constructor(
    private router: Router,
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
    this.getAllDivision();
    this.getAllDistributor();
    this.getAllAccessPermision();

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

  addNewUser() {
    this.router.navigateByUrl('/users/addUser');
  }
  get f() { return this.userForm.controls; }
  createForm() {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required]],
      userType: ['', [Validators.required]],
      division: ['', [Validators.required]],
      distributor: ['', [Validators.required]],
      stockiest: ['', [Validators.required]],
      permission: ['', [Validators.required]],
      portals: this.portalId,
      loggedUserId: this.loggedUserId,
      users: this.fb.array([]),
    });
  }
  users(): FormArray {
    return this.userForm.get("users") as FormArray
  }

  getAllDistributor() {
    this.apiService.fetch('/api/distributor/getDistributor9000').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.distributors = response.data;
          //console.log(this.stockiestes);
        }
      }
    });
  }

  getAllAccessPermision() {
    this.apiService.get('/api/access/getall', this.portalId).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.accesspermissions = response.data;
          //console.log(this.stockiestes);
        }
      }
    });
  }

  getDistributorStockist() {

    this.apiService.post('/api/stockiest/distributorStockiest', this.selectedDistributor).subscribe((response: any) => {
      if (response.status === 200) {

        if (response.data.length) {
          this.stockiestes = response.data;
        }
        else {
          this.stockiestes = [];
        }
      }
    });
  }

  getAllDivision() {

    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {

        if (response.data.length) {
          this.divisions = response.data;
          this.selectAllForDivisionItems(this.divisions);
        }
        else {
          this.divisions = [];
        }

      }
    });
  }

  selectAllForDivisionItems(items: any[]) {
    let allDivisionSelect = (items) => {
      items.forEach((element) => {
        element['selectedAllDivisionGroup'] = 'selectedAllDivisionGroup';
      });
    };

    allDivisionSelect(items);
  }

  onSubmit() {
    this.submitted = true;
    if (this.userForm.valid) {
      this.apiService.post('/api/user/createuser', this.userForm.value).subscribe((response: any) => {
        if (response.status === 200) {
          this.toast('success', 'Record has been successfully updated.');
          this.router.navigateByUrl('/users/listUser');
        }
        else {
          this.toast('error', 'Something went wrong, Please try again after some time');
        }
      });
    }
  }


}
