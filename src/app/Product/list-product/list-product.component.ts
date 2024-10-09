import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faDownload } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx-js-style';
import * as moment from 'moment';

import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-list-product',
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.css']
})
export class ListProductComponent implements OnInit {
  faStar = faStar;
  faPlus = faDownload;
  heading = 'Product';
  subheading = 'Product/Material List';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  loading: any = false;
  loggedUserId: any = '';
  sessionData: any;
  records: any = [];
  divisions: any = [];
  materials: any = [];
  uniqueProducts: any = [];
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

    this.selectedFields = {
      division: 0,
      material: '0',
      materialName: 0
    };

    this.getDivisions();
    this.getMaterials();
    this.getData();
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

  getMaterials() {
    this.apiService.fetch('/api/product/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.materials = response.data;

          // Getting a unique products by name
          const map = new Map();
          for (const item of response.data) {
            if (!map.has(item.materialName)) {
              map.set(item.materialName, true);
              this.uniqueProducts.push({
                plant: item.plant,
                division: item.division,
                material: item.material,
                materialName: item.materialName
              });
            }
          }
          // EOF Getting a unique products by name

          $('#material_preloader').hide();
          $('#material_loader').hide();
          $('#material').show();
        }
      }
    });
  }

  getBatches(materials) {
    const reqData = {
      materials: materials
    };

    this.apiService.post('/api/batchByMaterials/', reqData).subscribe((response: any) => {
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

  filterData(value, targetId) {
    this.records = [];

    if (targetId === 'division') {
      this.selectedFields['division'] = value;
      this.selectedFields['material'] = '';
      this.selectedFields['materialName'] = 0;

      $('#material_preloader').hide();
      $('#material_loader').show();
      $('#material').hide();

      const results = this.materials.filter(element => {
        return element.division === value;
      });
      this.records = results;

      // Getting a unique products by name
      this.uniqueProducts = [];
      const map = new Map();
      for (const item of results) {
        if (!map.has(item.materialName)) {
          map.set(item.materialName, true);
          this.uniqueProducts.push({
            plant: item.plant,
            division: item.division,
            material: item.material,
            materialName: item.materialName
          });
        }
      }
      // EOF Getting a unique products by name

      $('#material_preloader').show();
      $('#material_loader').hide();
      $('#material').show();
    } else if (targetId === 'material') {
      let result = [];

      if (value == 0) {
        this.records = this.materials;
      } else {
        const results = this.materials.filter(element => {
          return element.materialName === value;
        });
        this.records = results;

        if (results.length) {
          results.forEach(ele => {
            result.push(ele.material);
          });

          this.selectedFields['material'] = result;
          this.selectedFields['materialName'] = value;
        }
      }
    }
  }

  async getData() {
    this.apiService.fetch('/api/product/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.records = response.data;
        }
      }
    });

    /* let condition: any = '';
    if (this.selectedFields.material) {
      this.apiService.get('/api/product', this.selectedFields.material).subscribe((response: any) => {
        if (response.status === 200) {
          if (response.data.length) {
            this.records = response.data;
          }
        }
      });
    } else {
      this.apiService.get('/api/productByDivision', this.selectedFields.division).subscribe((response: any) => {
        if (response.status === 200) {
          if (response.data.length) {
            this.records = response.data;
          }
        }
      });
    } */
  }

  exportToExcel() {
    let fileName = 'Material';

    this.apiService.fetch('/api/product/export').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          let finalData = [];
          response.data.forEach(data => {
            const invoiceData = {
              'Plant': data.plant,
              'Division': data.division,
              'Material': data.material,
              'Material Description': data.materialName,
            }

            finalData.push(invoiceData);
          });

          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(finalData);
          // Set colum width
          ws['!cols'] = [
            { wch: 6 },
            { wch: 8 },
            { wch: 10 },
            { wch: 35 }
          ];

          for (var i in ws) {
            if (typeof ws[i] != 'object') continue;
            let cell = XLSX.utils.decode_cell(i);

            ws[i].s = {
              alignment: {
                vertical: 'center',
                wrapText: 1
              }
            };

            if (cell.r == 0) {
              // first row
              ws[i].s.alignment = { vertical: "center", wrapText: true };
              ws[i].s.fill = { fgColor: { rgb: "585858" } };
              ws[i].s.font = { bold: true, color: { rgb: "FFFFFF" } };
              //ws[i].s.border.bottom = { style: 'thin', color: '000000' };
            }
          }
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          XLSX.writeFile(wb, fileName + '.xlsx');
        }
      }
    });
  }
}
