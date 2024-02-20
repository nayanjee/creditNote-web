import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;
@Component({
  selector: 'app-list-stockiest',
  templateUrl: './list-stockiest.component.html',
  styleUrls: ['./list-stockiest.component.css']
})
export class ListStockiestComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create Stockiest';
  subheading = 'Create a Stockiest';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loading = false;

  loggedUserId: any = '';
  stockiest: any = [];
  dtOptions: DataTables.Settings = {};
  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService) { }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.dtOptions = {
      pagingType: 'full_numbers'
    };
    this.getallstockiest();
  }
  addNewStockiest() {
    this.router.navigateByUrl('/stockiest/add');
  }
  getallstockiest() {
    this.loading = true;
    this.apiService.fetch('/api/stockiest/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          //this.temp = [...response.data];
          this.stockiest = response.data;


        }
        this.loading = false;
      }
    });
  }
}
