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
  }

  addnewdivision() {
    this.router.navigateByUrl('/division/add');
  }

}
