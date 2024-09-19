import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';

import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-list-batch',
  templateUrl: './list-batch.component.html',
  styleUrls: ['./list-batch.component.css']
})
export class ListBatchComponent implements OnInit {
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Batch';
  subheading = 'Batch List';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loading: any = false;
  loggedUserId: any = '';
  sessionData: any;
  records: any = [];
  divisions: any = [];
  materials: any = [];
  batches: any = [];
  batchPrices: any = [];
  batchDetails: any = [];;
  selectedFields: any = [];
  dtOptions: DataTables.Settings = {};

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) { }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;

    this.getDivisions();
  }

  getDivisions() {
    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
        }
      }
    });
  }

  filterData(value, targetId) {
    if (targetId === 'division') {
      this.selectedFields['division'] = value;
      this.selectedFields['material'] = '';
      this.selectedFields['batch'] = '';

      this.materials = [];
      this.batches = [];

      $('#material_preloader').hide();
      $('#material_loader').show();
      $('#material').hide();

      $('#batch_preloader').show();
      $('#batch_loader').hide();
      $('#batch').hide();

      this.getMaterials(value);
    } else if (targetId === 'material') {
      this.batches = [];

      this.selectedFields['material'] = value;
      this.selectedFields['batch'] = '';

      $('#batch_preloader').hide();
      $('#batch_loader').show();
      $('#batch').hide();

      this.getBatches(value);
    } else if (targetId === 'batch') {
      this.selectedFields['batch'] = value;

      this.getData();
    }

  }

  getMaterials(division) {
    this.apiService.fetch('/api/productByDivision/' + division).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.materials = response.data;

          $('#material_preloader').hide();
          $('#material_loader').hide();
          $('#material').show();
        }
      }
    });
  }

  getBatches(material) {
    this.apiService.fetch('/api/batchByMaterial/' + material).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.batches = response.data;

          $('#batch_preloader').hide();
          $('#batch_loader').hide();
          $('#batch').show();
        }
      }
    });
  }

  addnewdivision() {
    this.router.navigateByUrl('/division/add');
  }

  async getData() {
    let condition: any = '';
    if (this.selectedFields.batch) {
      condition = {
        division: this.selectedFields.division,
        material: this.selectedFields.material,
        batch: this.selectedFields.batch
      }
    } else {
      condition = {
        division: this.selectedFields.division,
        material: this.selectedFields.material
      }
    }

    this.apiService.post('/api/batch/condition', { condition: condition }).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.records = response.data;
        }
      }
    });
  }

  showMrp(data) {
    this.batchDetails['batch'] = data.batch;
    this.batchDetails['material'] = data.materialName;
    this.batchDetails['division'] = data.divName;

    if (data.mrp) {
      const mrp = {
        mrp: data.mrp,
        pts: data.pts
      };
      this.batchPrices.push(mrp);
    }

    if (data.mrp2) {
      const mrp2 = {
        mrp: data.mrp2,
        pts: data.pts2
      };
      this.batchPrices.push(mrp2);
    }

    if (data.mrp3) {
      const mrp3 = {
        mrp: data.mrp3,
        pts: data.pts3
      };
      this.batchPrices.push(mrp3);
    }

    /* if (data.mrp4) {
      const mrp4 = {
        mrp: data.mrp4,
        pts: data.pts4
      };
      this.batchPrices.push(mrp4);
    } */

    var modal = document.getElementById("modalBatchPrice");
    modal.style.display = "block";
  }

  closeBatchPriceModal() {
    var modal = document.getElementById("modalBatchPrice");
    modal.style.display = "none";
  }

}