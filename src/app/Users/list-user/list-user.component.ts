import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;
@Component({
  selector: 'app-list-user',
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.css']
})
export class ListUserComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create User';
  subheading = 'Create a user / stockist';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';


  loggedUserId: any = '';
  ///////////////////////////////////
  rows = [
    {
      "name": "Ethel Price",
      "gender": "female",
      "company": "Johnson, Johnson and Partners, LLC CMP DDC",
      "age": 22
    },
    {
      "name": "Claudine Neal",
      "gender": "female",
      "company": "Sealoud",
      "age": 55
    },
    {
      "name": "Beryl Rice",
      "gender": "female",
      "company": "Velity",
      "age": 67
    },
    {
      "name": "Wilder Gonzales",
      "gender": "male",
      "company": "Geekko"
    },
    {
      "name": "Georgina Schultz",
      "gender": "female",
      "company": "Suretech"
    },
    {
      "name": "Carroll Buchanan",
      "gender": "male",
      "company": "Ecosys"
    },
    {
      "name": "Valarie Atkinson",
      "gender": "female",
      "company": "Hopeli"
    }

  ];
  temp = [];
  loadingIndicator = true;
  reorderable = true;
  columns = [
    { prop: 'name', summaryFunc: () => null },
    { name: 'Gender', summaryFunc: () => null },
    { name: 'Company', summaryFunc: () => null },
    { name: 'Age', summaryFunc: () => null },
    { name: 'Email', summaryFunc: () => null },
    { name: 'Status', summaryFunc: () => null },



  ];
  @ViewChild(DatatableComponent) table: DatatableComponent;
  ColumnMode = ColumnMode;



  ////////////////////////////////

  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService) {

    // cache our list
    this.temp = this.rows;

    // push our inital complete list
    this.rows = this.rows;
  }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
  }

  addNewUser() {
    this.router.navigateByUrl('/users/addUser');
  }

  updateFilter(event) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const temp = this.temp.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

}
