import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;

@Component({
  selector: 'app-list-distributor',
  templateUrl: './list-distributor.component.html',
  styleUrls: ['./list-distributor.component.css']
})
export class ListDistributorComponent implements OnInit {
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create Distributor';
  subheading = 'Create a Distributor';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loading = false;

  loggedUserId: any = '';
  distributors: any = [];
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
    this.getalldistributors();
  }
  addNewDistributor() {
    this.router.navigateByUrl('/distributor/add');
  }
  getalldistributors() {
    this.loading = true;
    this.apiService.fetch('/api/distributor/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          //this.temp = [...response.data];
          this.distributors = response.data;


        }
        this.loading = false;
      }
    });
  }



}
