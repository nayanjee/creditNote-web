import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-list-division',
  templateUrl: './list-division.component.html',
  styleUrls: ['./list-division.component.css']
})
export class ListDivisionComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create Division';
  subheading = 'Create a division';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loggedUserId: any = '';
  rows: any = [];

  temp = [];
  loadingIndicator = true;
  reorderable = true;
  columns = [
    { prop: 'name', summaryFunc: () => null },
    { name: 'Plant', summaryFunc: () => null },
    { name: 'Division', summaryFunc: () => null },
    { name: 'Action', summaryFunc: () => null },




  ];
  @ViewChild(DatatableComponent) table: DatatableComponent;
  ColumnMode = ColumnMode;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) { }

  ngOnInit(): void {

    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.getalldivision();

  }

  addnewdivision() {
    this.router.navigateByUrl('/division/add');
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
  getalldivision() {

    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.temp = [...response.data];
          this.rows = response.data;

        }
      }
    });

  }

}
