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
  selectedStockiest: number;
  selectedpermission: number;
  selectedusertype: number;
  stockiestes: any = [];
  accesspermissions: any = [];
  portalId: number;
  userTypes = [
        { id: 1, name: 'Head Office' },
        { id: 2, name: 'Field Officer' },
        { id: 3, name: 'Stockiest' },
        
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
    this.getAllStockiest();

  }
  addNewUser(){
    this.router.navigateByUrl('/users/addUser');
  }
  createForm() {
    this.userForm = this.fb.group({
      username: '',
      email: '',
      userType: '',
      stockiest: '',
      accesspermission: '',
      status: '',
      users: this.fb.array([]),
    });
  }
  users(): FormArray {
    return this.userForm.get("users") as FormArray
  }
  getAllStockiest() {
    this.apiService.fetch('/api/stockiest/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiestes = response.data;
          //console.log(this.stockiestes);
        }
      }
    });
  }
  getAllAccessPermision(){
    this.apiService.fetch('/api/access/getall' ).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.accesspermissions = response.data;
          //console.log(this.stockiestes);
        }
      }
    });
  }
  onSubmit(){
    console.log(this.userForm.value);
    // this.apiService.post('/api/claim/update', this.userForm.value).subscribe((response: any) => {
    //   if (response.status === 200) {
    //     //this.toast('success', 'Successfully saved in draft.');
    //     setTimeout(() => {
    //       window.location.reload();
    //     }, 5000);
    //   }
    // });
  }

}
