import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from 'moment';

import { environment } from './../../../environments/environment';
import { AppServicesService } from '../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-stockiest-claim',
  templateUrl: './stockiest-claim.component.html',
  styleUrls: ['./stockiest-claim.component.css']
})
export class StockiestClaimComponent implements OnInit {
  private apiURL: any = environment.apiURL;

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Approval';
  subheading = 'To approve the claim sent by the stockist.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  loading = true;
  showData = true;
  submitted = false;
  selectedYear: any;
  selectedMonth: any;

  types: any = [
    { id: 'scheme', name: 'Scheme and Rate Difference' },
    { id: 'sample', name: 'Sample Sales' },
    { id: 'special', name: 'Special Discount' }
  ];
  months: any = [
    { id: 1, name: '01 - Jan' },
    { id: 2, name: '02 - Feb' },
    { id: 3, name: '03 - Mar' },
    { id: 4, name: '04 - Apr' },
    { id: 5, name: '05 - May' },
    { id: 6, name: '06 - Jun' },
    { id: 7, name: '07 - Jul' },
    { id: 8, name: '08 - Aug' },
    { id: 9, name: '09 - Sep' },
    { id: 10, name: '10 - Oct' },
    { id: 11, name: '11 - Nov' },
    { id: 12, name: '12 - Dec' },
  ];
  years: any = [];
  currentYear: any;
  currentMonth: any;
  closeResult: any;
  records: any = [];
  modalReference: any;
  batches: any = [];
  products: any = [];
  fileNames: any = [];
  divisions: any = [];
  stockiests: any = [];
  categories: any = [];
  particulars: any = [];
  clickedFile: any = [];
  batchPrices: any = [];
  uploadFile: any;
  tempRecords: any = [];
  sessionData: any = '';
  selectedFields: any = [];
  divisions_edit: any = [];
  alignedStockiest: any = [];
  requiredFileType: string;
  pdfSource: string = '';
  salesAndRemainings: any = [];
  allotedInvoiceQty: any = [];
  allotedHoInvoiceQty: any = [];
  allotedQty: number = 0;
  hoAllotedQty: number = 0;
  requestedQty: number = 0;
  displayStyle: string = "none";
  approvalClickedClaim: any = [];
  distributors: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];
  clickedRecord: any = [];
  totalAmount: number = 0;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) {

  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);
    // console.log('---------', this.sessionData);

    this.heading = this.sessionData.type === 'ho' ? 'HO Approval' : 'Field Approval';

    // Current Month and Year
    const currentMonth = moment().format("MM");
    this.currentMonth = parseInt(currentMonth);

    // To show previous 2 years in dropdown
    const currentYear = moment().format("YYYY");
    this.currentYear = parseInt(currentYear);
    for (var i = parseInt(currentYear); i > parseInt(currentYear) - 3; i--) {
      const year = { id: i, name: i };
      this.years.push(year);
    }

    // To show this data as predefined in the form
    if (parseInt(currentMonth) - 1 <= 0) {
      this.selectedYear = parseInt(currentYear) - 1;
      this.selectedMonth = 12;
    } else {
      this.selectedYear = currentYear;
      this.selectedMonth = parseInt(currentMonth);
    }

    this.selectedFields['month'] = this.selectedMonth;
    this.selectedFields['year'] = this.selectedYear;
    this.selectedFields['division'] = 0;
    this.selectedFields['type'] = 0;

    this.getDistributors();
    this.getParticulars();
    this.getCategories();
    this.getProduct();
    this.getBatch();

    this.delay(1000).then(any => {
      this.isDistributors();
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

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(''), ms)).then(() => console.log("Fired"));
  }

  isDistributors() {
    if (this.distributors[0]) {
      this.getUserDistStockistDivision();
    } else {
      this.getDistributors();

      this.delay(1000).then(any => {
        this.isDistributors();
      });
    }
  }

  getDistributors() {
    this.apiService.fetch('/api/distributor/getDistributor9000').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          // Getting a unique distributor
          const map = new Map();
          for (const item of response.data) {
            if (!map.has(item.plant)) {
              map.set(item.plant, true);
              this.distributors.push({
                plant: item.plant,
                organization: item.organization
              });
            }
          }
          // EOF Getting a unique distributor
        }
      }
    });
  }

  getUserDistStockistDivision() {
    this.apiService.get('/api/user/getDistStockistDivision', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          response.data.forEach(element => {
            // get user's distributor
            const result = this.distributors.filter(element2 => {
              return element.plant === element2.plant;
            });
            this.userDistributors.push(result[0]);
            // EOF get user's distributor

            // get user's stockist plant wise
            this.userPlantStockists[element.plant] = element.stockists;

            // get user's division plant wise
            this.userPlantDivisions[element.plant] = element.divisions;
          });

          //this.delay(100).then(any => {
          this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);

          $('#distributor_loader').hide();
          $('#distributor').show();

          this.getStockiest();
          this.getDivisions();
          //});
        }
      }
    });
  }

  getStockiest() {
    const distributor = this.selectedFields.distributor;
    const stockist = this.userPlantStockists[distributor];

    let stockists = [];
    stockist.forEach(element => {
      stockists.push(Number(element));
    });

    this.apiService.post('/api/getStockiest', stockists).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;

          // If user has access to approve claim of the distributor (self)
          if (stockist.includes(distributor.toString())) {
            const self = {
              customerId: 1,
              organization: '-- SELF --'
            }
            this.stockiests.push(self);
          }
          // EOF If user has access to approve claim of the distributor (self)

          this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);

          $('#stockiest_loader').hide();
          $('#stockiest').show();

          this.getData();
        }
      }
    });
  }

  getDivisions() {
    this.divisions = [];

    const distributor = this.selectedFields['distributor'];
    const division = this.userPlantDivisions[distributor];
    let divisions = [];
    division.forEach(element => {
      divisions.push(Number(element));
    });

    this.apiService.post('/api/getDivision', divisions).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
          this.divisions_edit = response.data;
        }
      }
    });
  }

  getData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];
    this.totalAmount = 0;

    let divisions = [];
    const dvsion = this.userPlantDivisions[this.selectedFields['distributor']];
    dvsion.forEach(element => {
      divisions.push(Number(element));
    });

    const requestData = {
      plant: this.selectedFields['distributor'],
      customerId: this.selectedFields['stockiest'],
      divisions: divisions,
      month: this.selectedFields['month'],
      year: this.selectedFields['year']
    };

    this.apiService.post('/api/claimForApproval', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;

          if (this.selectedFields['type'] || this.selectedFields['division']) {
            this.filterDataTwice(this.selectedFields['type'], this.selectedFields['division']);
          }

          this.tempRecords.forEach(element => {
            this.totalAmount = this.totalAmount + element.amount;
          });

          this.loading = false;
          this.showData = true;
        } else {
          this.loading = this.showData = false;
        }
      } else {
        this.toast('error', response.message);
      }
    });
  }

  getParticulars() {
    this.apiService.fetch('/api/particulars/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.particulars = response.data;
        }
      }
    });
  }

  getProduct() {
    this.apiService.fetch('/api/product/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.products = response.data;
        }
      }
    });
  }

  getCategories() {
    this.apiService.fetch('/api/category/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.categories = response.data;
        }
      }
    });
  }

  getBatch() {
    this.apiService.fetch('/api/batch/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.batches = response.data;
        }
      }
    });
  }

  validateMonth(value, targetId) {
    $('#err_month').hide();

    const selectedYear = this.selectedFields.year;
    const selectedMonth = this.selectedFields.month;

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    } else {
      this.filterData(value, targetId);
    }
  }

  /***** Particulars key-up functionality *****/
  async searchParticulars(e, i) {
    const inputVal = e.currentTarget.value;

    //let results: any = [];
    const id = (i === -1) ? 'def' : i;

    if (e.key != "Tab") {
      console.log('inputVal.length--', inputVal.length);
      if (inputVal.length > 2) {
        $('#particulars_loader_' + id).show();

        const results = await this.matchParticulars(inputVal, i);
        console.log('results--', results);

        this.delay(200).then(any => {
          console.log('results2--', results);
          this.particularsSuggestions(results, inputVal, i);
        });
      } else {
        $('#particulars_suggestion_' + id).hide();
      }
    } else if (inputVal.length <= 0) {
      $('#particulars_suggestion_' + id).hide();
      $('#particulars_loader_' + id).hide();
    }
  }

  matchParticulars(str, i) {
    let results = [];
    const val = str.toLowerCase();

    this.apiService.get('/api/particulars', val).subscribe((response: any) => {
      if (response.status === 200 && response.data.length) {
        this.particulars = response.data;
      } else {
        this.particulars = [];
      }
    });

    results = this.particulars.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  particularsSuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#particulars_suggestion_' + id + ' ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      let matches = [];
      results.forEach((element, index) => {
        // Match word from start
        const match = element.name.match(new RegExp('^' + inputVal, 'i'));
        if (match) {
          matches.push(match);
          suggestions.innerHTML += `<li>${match.input}</li>`;
        }
      });

      // Put value in textbox directly if there is only one match
      if (matches.length == 0) {
        $('#particulars_' + id).val('');
        // this.saveParticulars(id, '');
      } else if (matches.length == 1) {
        $('#particulars_' + id).val(matches[0].input);
        $('#particulars_suggestion_' + id).hide();
        // this.saveParticulars(id, matches[0].input);
      } else {
        suggestions.classList.add('has-suggestions');
        $('#particulars_suggestion_' + id).show();
      }

      $('#particulars_loader_' + id).hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#particulars_suggestion_' + id).hide();

      $('#particulars_loader_' + id).hide();
    }
  }

  particularsSelection(e, row) {
    const id = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#particulars_suggestion_' + id + ' ul');

    $('#particulars_' + id).val(e.target.innerText);
    //$('#division_def').focus();

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#particulars_suggestion_' + id).hide();
    $('#particulars_loader_' + id).hide();
    // this.saveParticulars(id, e.target.innerText);
  }
  /***** EOF Particulars key-up functionality *****/

  /***** Category key-up functionality *****/
  searchCategory(e, i) {
    const inputVal = e.currentTarget.value;
    let results: any = [];
    const id = (i === -1) ? 'def' : i;

    if (e.key != "Tab") {
      if (inputVal.length) {
        $('#category_loader_' + id).show();

        results = this.matchCategory(inputVal, i);

        this.delay(10).then(any => {
          this.categorySuggestions(results, inputVal, i);
        });
      } else {
        $('#category_suggestion_' + id).hide();
      }
    }
  }

  matchCategory(str, i) {
    let results = [];
    const val = str.toLowerCase();

    results = this.categories.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  categorySuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#category_suggestion_' + id + ' ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      let matches = [];
      results.forEach((element, index) => {
        // Match word from start
        const match = element.name.match(new RegExp('^' + inputVal, 'i'));
        if (match) {
          matches.push(match);
          suggestions.innerHTML += `<li>${match.input}</li>`;
        }
      });

      // Put value in textbox directly if there is only one match
      if (matches.length == 0) {
        $('#category_' + id).val('');
        // this.saveCategory(id, '');
      } else if (matches.length == 1) {
        $('#category_' + id).val(matches[0].input);
        // this.saveCategory(id, matches[0].input);
      } else {
        suggestions.classList.add('has-suggestions');
        $('#category_suggestion_' + id).show();
      }

      $('#category_loader_' + id).hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#category_suggestion_' + id).hide();

      $('#category_loader_' + id).hide();
    }
  }

  categorySelection(e, row) {
    const id = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#category_suggestion_' + id + ' ul');

    $('#category_' + id).val(e.target.innerText);
    //$('#division_def').focus();

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#category_suggestion_' + id).hide();
    $('#category_loader_' + id).show();
    // this.saveCategory(id, e.target.innerText);
  }
  /***** EOF Category key-up functionality *****/

  /***** Division key-up functionality *****/
  searchDivision(e) {
    const inputVal = e.currentTarget.value;

    $('#edit_division_id').val('');
    $('#edit_product').val('');
    $('#edit_material').val('');
    $('#edit_batch').val('');
    $('#edit_mrp').val(Number(0).toFixed(2));
    $('#edit_pts').val(Number(0).toFixed(2));
    $('#edit_billingRate').val('');

    this.changeCalculation(e);

    if (inputVal.length) {
      $('#edit_division_loader').show();
      let results: any = [];
      results = this.matchDivision(inputVal);

      this.delay(10).then(any => {
        this.divisionSuggestions(results, inputVal);
      });
    } else {
      $('#edit_division_suggestion').hide();
    }
  }

  matchDivision(str) {
    let results = [];
    const val = str.toLowerCase();
    results = this.divisions_edit.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  divisionSuggestions(results, inputVal) {
    const suggestions = document.querySelector('#edit_division_suggestion' + ' ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      results.forEach((element, index) => {
        // Match word from start
        const match = element.name.match(new RegExp('^' + inputVal, 'i'));
        if (match) {
          suggestions.innerHTML += `<li>${match.input}</li>`;
        }
      });

      suggestions.classList.add('has-suggestions');
      $('#edit_division_suggestion').show();
      $('#edit_division_loader').hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#edit_division_suggestion').hide();
      $('#edit_division_loader').hide();
    }
  }

  divisionSelection(e) {
    const suggestions = document.querySelector('#edit_division_suggestion' + ' ul');

    $('#edit_division').val(e.target.innerText);

    let results = [];
    results = this.divisions.filter(function (d) {
      return d.name.toLowerCase().indexOf(e.target.innerText.toLowerCase()) > -1;
    });

    if (results.length > 1) {
      console.log('...More then one division...', results);
      $('#edit_division_id').val('');
    } else {
      $('#edit_division_id').val(results[0].division);
    }

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');
    $('#edit_division_suggestion').hide();
  }
  /***** EOF Division key-up functionality *****/

  /***** Product key-up functionality *****/
  searchProduct(e) {
    const inputVal = e.currentTarget.value;

    $('#edit_material').val('');
    $('#edit_batch').val('');
    $('#edit_mrp').val(Number(0).toFixed(2));
    $('#edit_pts').val(Number(0).toFixed(2));
    $('#edit_billingRate').val('');

    this.changeCalculation(e);

    if (inputVal.length) {
      $('#edit_product_loader').show();

      let results: any = [];
      results = this.matchProduct(inputVal);

      this.delay(10).then(any => {
        this.productSuggestions(results, inputVal);
      });
    } else {
      $('#edit_product_suggestion').hide();
    }
  }

  matchProduct(str) {
    const val = str.toLowerCase();
    const divisionId = $('#edit_division_id').val();

    let results = [];
    results = this.products.filter(element => {
      return element.materialName.toLowerCase().indexOf(val) > -1 &&
        element.division === Number(divisionId); /*  && 
            element.plant === Number(plantId); */
    });

    return results;
  }

  productSuggestions(results, inputVal) {
    const suggestions = document.querySelector('#edit_product_suggestion' + ' ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      results.forEach((element, index) => {
        // Match word from start
        const match = element.materialName.match(new RegExp('^' + inputVal, 'i'));
        if (match) {
          suggestions.innerHTML += `<li>${match.input}</li>`;
        }
      });

      suggestions.classList.add('has-suggestions');
      $('#edit_product_suggestion').show();

      $('#edit_product_loader').hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#edit_product_suggestion').hide();

      $('#edit_product_loader').hide();
    }
  }

  productSelection(e) {
    let results = [];
    results = this.products.filter(function (d) {
      return d.materialName.toLowerCase() === e.target.innerText.toLowerCase();
    });

    let material = '';
    if (results.length > 1) {
      results.forEach((element, index) => {
        if (index + 1 == results.length) {
          material += element.material;
        } else {
          material += element.material + ',';
        }

      });
    } else {
      material = results[0].material;
    }

    const suggestions = document.querySelector('#edit_product_suggestion' + ' ul');
    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#edit_product').val(e.target.innerText);
    $('#edit_material').val(material);
    $('#edit_product_suggestion').hide();
  }
  /***** EOF Product key-up functionality *****/

  /***** Batch key-up functionality *****/
  searchBatch(e) {
    const inputVal = e.currentTarget.value;

    $('#edit_batch').val('');
    $('#edit_mrp').val(Number(0).toFixed(2));
    $('#edit_pts').val(Number(0).toFixed(2));
    $('#edit_billingRate').val('');

    this.changeCalculation(e);

    if (inputVal.length) {
      $('#edit_batch_loader').show();
      let results: any = [];
      results = this.matchBatch(inputVal);

      this.delay(10).then(any => {
        this.batchSuggestions(results, inputVal);
      });
    } else {
      $('#edit_batch_suggestion').hide();
    }
  }

  matchBatch(str) {
    const val = str.toLowerCase();
    const divisionId = $('#edit_division_id').val();
    const productId = $('#edit_material').val();
    const explodeProductId = productId.split(",");

    let results = [];
    explodeProductId.forEach(element => {
      let result = [];
      result = this.batches.filter(element2 => {
        return element2.material === Number(element) &&
          element2.division === Number(divisionId) &&
          element2.batch.toLowerCase().indexOf(val) > -1;
      });

      if (result.length) results.push(result);
    });

    return results;
  }

  batchSuggestions(results, inputVal) {
    const suggestions = document.querySelector('#edit_batch_suggestion' + ' ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      results.forEach((element, index) => {
        element.forEach(element2 => {
          // Match word from start
          const match = element2.batch.match(new RegExp('^' + inputVal, 'i'));
          if (match) {
            suggestions.innerHTML += `<li>${match.input}</li>`;
          }
        });
      });

      suggestions.classList.add('has-suggestions');
      $('#edit_batch_suggestion').show();

      $('#edit_batch_loader').hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#edit_batch_suggestion').hide();

      $('#edit_batch_loader').hide();
    }
  }

  batchSelection(e) {
    const suggestions = document.querySelector('#edit_batch_suggestion' + ' ul');

    $('#edit_batch').val(e.target.innerText);

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#edit_batch_suggestion').hide();

    const filtered = this.batches.filter((emp) => emp.batch === e.target.innerText);
    const mrp = (filtered.length) ? filtered[0].mrp : 0;
    const pts = (filtered.length) ? filtered[0].pts : 0;
    const ptr = (filtered.length) ? filtered[0].ptr : 0;
    const ptd = (filtered.length) ? filtered[0].ptd : 0;
    const material = (filtered.length) ? filtered[0].material : '';

    $('#edit_material').val(material);
    $('#edit_mrp').val(mrp.toFixed(2));
    $('#edit_pts').val(pts.toFixed(2));
    $('#edit_ptr').val(ptr.toFixed(2));
    $('#edit_ptd').val(ptd.toFixed(2));
  }
  /***** EOF Batch key-up functionality *****/

  filterData(value, targetId) {
    this.loading = true;
    this.showData = true;

    if (targetId === 'type') {
      this.selectedFields[targetId] = value;
    } else {
      this.selectedFields[targetId] = parseInt(value);
    }

    $("#divisionCode").text('');

    if (targetId === 'distributor') {
      this.selectedFields.type = 0;
      this.selectedFields.division = 0;

      this.getStockiest();
      this.getDivisions();

      this.delay(1000).then(any => {
        this.getData();
      });
    }

    if (targetId === 'stockiest' || targetId === 'month' || targetId === 'year') {
      this.selectedFields.type = 0;
      this.selectedFields.division = 0;

      this.getData();
    }

    const type = this.selectedFields.type;
    const division = this.selectedFields.division;

    if (division) {
      const div = this.divisions.filter(function (el) {
        return el.division == Number(division);
      });
      const divisionCode = div[0].division;
      $("#divisionCode").text('(' + divisionCode + ')');
    }

    if (type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type && el.divisionId === Number(division);
      });
    } else if (type && !division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type;
      });
    } else if (!type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.divisionId === Number(division);
      });
    } else if (!type && !division) {
      this.tempRecords = this.records;
    }

    if (this.tempRecords.length) {
      this.loading = false;
      this.showData = true;
    } else {
      this.loading = false;
      this.showData = false;
    }
  }

  async validateApproval(record, event) {
    let errors = '';
    this.allotedQty = 0;
    this.allotedInvoiceQty = [];
    this.salesAndRemainings = [];
    this.allotedHoInvoiceQty = [];
    this.approvalClickedClaim = [];

    const claim = await this.getClaimById(record._id);
    console.log('claim-----', claim);
    if (claim) {
      if (this.sessionData.type === 'ho' && this.sessionData.workType != 'ho1' && claim['ho1Status'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      }

      if (event === 'Approve') {
        if (this.sessionData.type === 'ho' && this.sessionData.workType === 'ho1') {
          if (claim['ho1Status'] === 1) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been approved.',
              'error'
            );
            return;
          }
        } else {
          if (claim['hoStatus'] === 1) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been approved.',
              'error'
            );
            return;
          }

          const batchMrp_select = $('#batchMrp_selected_' + record._id).val();
          if (batchMrp_select == 0) {
            Swal.fire(
              'Oops... can\'t proceed',
              'There is more than one price in this batch.<br>Please confirm price first.',
              'error'
            );
            return;
          }

          let categoryMatched = false;
          let particularsMatched = false;

          if (!claim['claimType']) { errors = errors + "Enter claim type.<br>"; }
          if (!claim['invoice']) { errors = errors + "Enter reference number.<br>"; }
          if (!claim['divisionName']) { errors = errors + "Enter division.<br>"; }
          if (!claim['materialName']) { errors = errors + "Enter product.<br>"; }
          if (!claim['batch']) { errors = errors + "Enter batch.<br>"; }

          if (!claim['billingRate'] && !claim['freeQuantity']) {
            errors = errors + "Enter billing rate or free quantity.<br>";
          } else if (!claim['billingRate'] && !claim['saleQuantity']) {
            errors = errors + "Enter free quantity and/or sale quantity.<br>";
          } else if (claim['billingRate'] && !claim['saleQuantity']) {
            errors = errors + "Enter sale quantity.<br>";
          }

          const tempParticulars = $('#particulars_' + record._id).val();
          if (tempParticulars) {
            this.particulars.forEach(element => {
              if (tempParticulars === element.name) {
                particularsMatched = true;
                return;
              }
            });
            if (!particularsMatched) {
              errors = errors + "Particulars not matched.<br>";
            } else {
              claim['particulars'] = tempParticulars;
            }
          } else {
            errors = errors + "Enter particulars.<br>";
          }

          const tempCategory = $('#category_' + record._id).val();
          if (tempCategory) {
            this.categories.forEach(element => {
              if (tempCategory === element.name) {
                categoryMatched = true;
                return;
              }
            });
            if (!categoryMatched) {
              errors = errors + "Category not matched.<br>";
            } else {
              claim['category'] = tempCategory;
            }
          } else {
            errors = errors + "Enter category.<br>";
          }

          const tempSupplyProof = $('#sproof_' + record._id).val();
          if (!tempSupplyProof) {
            errors = errors + "Select supply proof.<br>";
          } else {
            claim['supplyProof'] = tempSupplyProof;
          }

          const tempPurchaseOrder = $('#porder_' + record._id).val();
          if (!tempPurchaseOrder) {
            errors = errors + "Select purchase order.<br>";
          } else {
            claim['purchaseOrder'] = tempPurchaseOrder;
          }
        }
      } else if (event === 'Unapprove') {
        if (this.sessionData.type === 'ho' && this.sessionData.workType === 'ho1') {
          if (claim['ho1Status'] === 2) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been unapproved.',
              'error'
            );
            return;
          } else {
            claim['ho1Status'] = 2;
            claim['ho1ActionBy'] = this.sessionData.id;
            claim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
        } else {
          if (claim['hoStatus'] === 2) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been unapproved.',
              'error'
            );
            return;
          } else {
            const tempParticulars = $('#particulars_' + record._id).val();
            claim['particulars'] = tempParticulars;

            const tempCategory = $('#category_' + record._id).val();
            claim['category'] = tempCategory;

            const tempSupplyProof = $('#sproof_' + record._id).val();
            claim['supplyProof'] = tempSupplyProof;

            const tempPurchaseOrder = $('#porder_' + record._id).val();
            claim['purchaseOrder'] = tempPurchaseOrder;

            claim['hoStatus'] = 2;
            claim['hoActionBy'] = this.sessionData.id;
            claim['hoActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
        }
      }
    } else {
      Swal.fire(
        'Sorry',
        'Clam doesn\'t exists.',
        'error'
      );
      return;
    }

    if (errors) {
      Swal.fire({
        title: 'Please correct the points:',
        icon: 'info',
        html: errors,
        showCloseButton: true,
        showCancelButton: false,
        focusConfirm: false,
        confirmButtonText: 'Okay!',
        confirmButtonAriaLabel: 'Thumbs up, great!'
      })
    } else {
      this.approvalClickedClaim = claim;
      if (event === 'Unapprove') {
        $('#comments').val('');

        var modal = document.getElementById("myModalComment");
        modal.style.display = "block";
      } else {
        const duplicacy = await this.checkDuplicacy(this.approvalClickedClaim);
        if (duplicacy['data']) {
          Swal.fire({
            title: 'Pay attention',
            text: 'Such claim has already been accepted!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, submit it!',
            cancelButtonText: 'No, keep it'
          }).then(async (result) => {
            if (result.value) {
              const allocatedQty: any = await this.getAllocatedQuantity(this.approvalClickedClaim['_id']);
              if (this.sessionData.workType === 'ho1' && allocatedQty.length) {
                const reqData = {
                  _id: claim['_id'],
                  ho1Status: 1,
                  ho1ApprovalComment: null,
                  ho1ActionBy: this.sessionData.id,
                  ho1ActionOn: moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]")
                }
                this.apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
                  if (response.status === 200) {
                    Swal.fire(
                      'Approved!',
                      'You approved the claim successfully.',
                      'success'
                    );
                  } else {
                    Swal.fire(
                      'Oops',
                      'Something went wrong please try again.',
                      'error'
                    );
                  }

                  $('#def_approvedIcon_' + claim['_id']).hide();
                  $('#def_unapprovedIcon_' + claim['_id']).hide();
                  $('#approvedIcon_' + claim['_id']).show();
                  $('#unapprovedIcon_' + claim['_id']).hide();
                });
              } else {
                if (allocatedQty.length) {
                  allocatedQty.forEach(async element => {
                    const reqData = {
                      billDocNumber: element['stkInvoiceNo'],
                      billToParty: this.approvalClickedClaim['customerId'],
                      batch: this.approvalClickedClaim['batch'],
                      allocatedQty: element['allocatedQty'],
                      claimId: this.approvalClickedClaim['_id']
                    }

                    const findUpdateRemaining: any = await this.findUpdateRemaining(reqData);
                  });
                }

                this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
                  if (response.status === 200) {
                    this.getRemaining(claim);
                  } else {
                    Swal.fire(
                      'Oops',
                      'Something went wrong please try again.',
                      'error'
                    );
                  }
                });
              }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              Swal.fire(
                'Cancelled',
                'Your imaginary record is safe :)',
                'error'
              )
            }
          })
          return;
        } else {
          if (this.sessionData.workType === 'ho1' && claim['hoStatus'] === 1 && claim['ho1Status'] === 0) {
            claim['ho1Status'] = 1;
            claim['ho1ActionBy'] = this.sessionData.id;
            claim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");

            this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
              if (response.status === 200) {
                $('#def_approvedIcon_' + this.approvalClickedClaim['_id']).hide();
                $('#def_unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();
                $('#approvedIcon_' + this.approvalClickedClaim['_id']).show();
                $('#unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();

                Swal.fire(
                  'Approved!',
                  'You approved the claim successfully.',
                  'success'
                );
              } else {
                Swal.fire(
                  'Oops',
                  'Something went wrong please try again.',
                  'error'
                );
              }
            });
          } else {
            const allocatedQty: any = await this.getAllocatedQuantity(this.approvalClickedClaim['_id']);
            if (allocatedQty.length) {
              if (this.sessionData.workType === 'ho1') {
                claim['ho1Status'] = 1;
                claim['ho1ActionBy'] = this.sessionData.id;
                claim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");

                this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
                  if (response.status === 200) {
                    $('#def_approvedIcon_' + this.approvalClickedClaim['_id']).hide();
                    $('#def_unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();
                    $('#approvedIcon_' + this.approvalClickedClaim['_id']).show();
                    $('#unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();

                    Swal.fire(
                      'Approved!',
                      'You approved the claim successfully.',
                      'success'
                    );

                  } else {
                    Swal.fire(
                      'Oops',
                      'Something went wrong please try again.',
                      'error'
                    );
                  }
                });
              } else {
                this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
                  if (response.status === 200) {
                    this.getRemaining(claim);
                  } else {
                    Swal.fire(
                      'Oops',
                      'Something went wrong please try again.',
                      'error'
                    );
                  }
                });
              }
            } else {
              this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
                if (response.status === 200) {
                  this.getRemaining(claim);
                } else {
                  Swal.fire(
                    'Oops',
                    'Something went wrong please try again.',
                    'error'
                  );
                }
              });
            }
          }
        }
      }
    }
  }

  getStockiest_edit() {
    let stockists = [];
    const distributor = $("#edit_distributor option:selected").val();
    const stockist = this.userPlantStockists[distributor];
    stockist.forEach(element => {
      stockists.push(Number(element));
    });

    this.getDivisions_edit();

    this.apiService.post('/api/getStockiest', stockists).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;

          this.delay(5).then(any => {
            $("#edit_stockiest").val($("#edit_stockiest option:eq(1)").val());
          });
        }
      }
    });
  }

  getDivisions_edit() {
    let divisions = [];
    this.divisions = [];
    const distributor = $("#edit_distributor option:selected").val();
    const division = this.userPlantDivisions[distributor];
    division.forEach(element => {
      divisions.push(Number(element));
    });

    this.apiService.post('/api/getDivision', divisions).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions_edit = response.data;
        }
      }
    });
  }

  filterDataTwice(type = '', division = '') {
    this.selectedFields.type = type;
    this.selectedFields.division = division;

    $("#type").val(this.selectedFields.type);
    $("#division").val(this.selectedFields.division);

    if (type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type && el.divisionName == division;
      });
    } else if (type && !division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.claimType == type;
      });
    } else if (!type && division) {
      this.tempRecords = this.records.filter(function (el) {
        return el.divisionName == division;
      });
    } else if (!type && !division) {
      this.tempRecords = this.records;
    }
  }

  viewPopup(content, data, invoice, id) {
    this.pdfSource = '';
    this.clickedFile = data;
    this.clickedFile.invoice = invoice;
    const fileExtension = this.clickedFile.filename.substring(this.clickedFile.filename.length - 4);
    if (fileExtension === '.pdf' || fileExtension === '.PDF') {
      this.pdfSource = this.apiURL + '/uploads/files/' + this.clickedFile.filename;
    }

    /* this.modalService.open(content, {
      size: 'lg'
    }); */
    this.modalReference = this.modalService.open(content);
    this.modalReference.result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  confirmBoxDelete(id) {
    Swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this record!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        const type = this.selectedFields.type;
        const division = this.selectedFields.division;

        let reqData = { _id: id };
        this.apiService.update('/api/claim/delete', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            this.getData();
            Swal.fire(
              'Deleted!',
              'Your imaginary record has been deleted.',
              'success'
            )
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          'Your imaginary record is safe :)',
          'error'
        )
      }
    })
  }

  confirmBoxDeleteFile(file) {
    Swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this image/file!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        let reqData = { _id: file._id };
        this.apiService.update('/api/claim/deleteFile', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            this.getData();
            Swal.fire(
              'Deleted!',
              'Your imaginary record has been deleted.',
              'success'
            )
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(
          'Cancelled',
          'Your imaginary record is safe :)',
          'error'
        )
      }
      this.modalReference.close();
    })
  }

  uploadwPopup(content, id) {
    this.uploadFile = id;
    this.modalReference = this.modalService.open(content);
    this.modalReference.result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  onFileSelected(event, id) {
    const frmData = new FormData();
    // formData.append("file", event.target.files[0]);
    for (var i = 0; i < event.target.files.length; i++) {
      frmData.append("file", event.target.files[i]);
    }

    this.apiService.upload('/api/UploadClaimInvoices', frmData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          let images = [];
          response.data.forEach(element => {
            const img = {
              claimId: id,
              filename: element.filename,
              originalFilename: element.originalname,
              createdBy: this.sessionData.id
            }
            images.push(img);
          });
          this.apiService.post('/api/claim/fileUpload', images).subscribe((response: any) => {
            if (response.status === 200) {
              this.modalReference.close();
              this.getData();
              Swal.fire(
                'Uploaded!',
                'Your image/file has been uploaded.',
                'success'
              );
            } else {
              this.modalReference.close();
              Swal.fire(
                'Cancelled',
                'Something went wrong. Try refreshing the page or try again later.',
                'error'
              )
            }
          });
        }
      } else {
        this.modalReference.close();
        Swal.fire(
          'Cancelled',
          'Something went wrong. Try refreshing the page or try again later.',
          'error'
        )
      }
    })
  }

  postClaim() {
    let error = 0;
    let invoiceFiles = [];
    this.records.forEach(element => {
      if (element.files.length) {
        const invFile = {
          invoice: element.invoice,
          file: element.files[0].filename
        }
        invoiceFiles.push(invFile);
      }
    });

    const uniqueAuthors = [...new Map(invoiceFiles.map(v => [v.invoice, v])).values()]; // Remove duplicate invoices
    const remainInvoices = this.records.filter(({ invoice: id1 }) => !uniqueAuthors.some(({ invoice: id2 }) => id2 === id1));
    const uniqueremainInvoices = [...new Map(remainInvoices.map(v => [v.invoice, v])).values()]; // Remove duplicate invoices
    if (uniqueremainInvoices) {
      uniqueremainInvoices.forEach(element => {
        error = 1;
        $('.' + element['invoice']).show();
        // $(".att_3:first").text('Hello')
        this.toast('error', 'All invoices must have at least one file uploaded.');
      });
    }

    if (this.tempRecords.length <= 0) {
      error = 1;
      this.toast('error', 'Currently there are no claims on the list.');
    }

    if (error === 0) {
      let reqData = [];
      this.tempRecords.forEach((element, index) => {
        const temp = {
          _id: element._id,
          isDraft: false,
          isSubmit: true,
          submittedBy: this.sessionData.id,
          submittedOn: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        };
        reqData.push(temp);
        // reqData[index]['submittedBy'] = this.loggedUserId;
      });

      this.apiService.post('/api/claim/submit', reqData).subscribe((response: any) => {
        if (response.status === 200) {
          this.toast('success', 'Successfully submitted.');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
  }

  async validateFoApproval(record, event) {
    let errors = '';
    this.approvalClickedClaim = [];

    const claim = await this.getClaimById(record._id);
    if (claim) {
      if (this.sessionData.type === 'field' && this.sessionData.workType === 'field' && claim['suhStatus'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh' && claim['hoStatus'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      }

      if (event === 'Approve') {
        if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
          if (claim['ftStatus'] === 1) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been accepted.',
              'error'
            );
            return;
          } else {
            claim['ftStatus'] = 1;
            claim['ftApprovalComment'] = null;
            claim['ftActionBy'] = this.sessionData.id;
            claim['ftActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
        } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
          if (claim['ftStatus'] === 0) {
            Swal.fire(
              'Oops... can\'t proceed',
              'Claim has not been accepted or rejected by the field team.',
              'error'
            );
            return;
          } else if (claim['ftStatus'] === 2) {
            Swal.fire(
              'Oops... can\'t proceed',
              'Claim has been rejected by the field team.',
              'error'
            );
            return;
          } else if (claim['suhStatus'] === 1) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been accepted.',
              'error'
            );
            return;
          } else {
            claim['suhStatus'] = 1;
            claim['suhApprovalComment'] = null;
            claim['suhActionBy'] = this.sessionData.id;
            claim['suhActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
        }

        if (!claim['claimType']) { errors = errors + "Enter claim type.<br>"; }
        if (!claim['invoice']) { errors = errors + "Enter reference number.<br>"; }
        if (!claim['divisionName']) { errors = errors + "Enter division.<br>"; }
        if (!claim['materialName']) { errors = errors + "Enter product.<br>"; }
        if (!claim['batch']) { errors = errors + "Enter batch.<br>"; }

        if (!claim['billingRate'] && !claim['freeQuantity']) {
          errors = errors + "Enter billing rate or free quantity.<br>";
        } else if (!claim['billingRate'] && !claim['saleQuantity']) {
          errors = errors + "Enter free quantity and/or sale quantity.<br>";
        } else if (claim['billingRate'] && !claim['saleQuantity']) {
          errors = errors + "Enter sale quantity.<br>";
        }
      } else if (event === 'Unapprove') {
        if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
          if (claim['ftStatus'] === 2) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been rejected.',
              'error'
            );
            return;
          } else {
            claim['ftStatus'] = 2;
            claim['ftActionBy'] = this.sessionData.id;
            claim['ftActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
        } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
          if (claim['ftStatus'] === 0) {
            Swal.fire(
              'Oops... can\'t proceed',
              'Claim has not been accepted or rejected by the field team.',
              'error'
            );
            return;
          } else if (claim['suhStatus'] === 2) {
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been rejected.',
              'error'
            );
            return;
          } else {
            claim['suhStatus'] = 2;
            claim['suhActionBy'] = this.sessionData.id;
            claim['suhActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
        }
      }/*  else if (event === 'Cancel') {
        claim['ftStatus'] = 0;
      } */
    } else {
      errors = errors + "Clam doesn't exists.<br>";
    }

    if (errors) {
      Swal.fire({
        title: 'Please correct the points:',
        icon: 'info',
        html: errors,
        showCloseButton: true,
        showCancelButton: false,
        focusConfirm: false,
        confirmButtonText: 'Okay!',
        confirmButtonAriaLabel: 'Thumbs up, great!'
      })
    } else {
      if (event === 'Unapprove') {
        $('#comments').val('');

        this.approvalClickedClaim = claim;

        var modal = document.getElementById("myModalComment");
        modal.style.display = "block";
      } else {
        this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
          if (response.status === 200) {
            if (event === 'Approve') {
              $('#def_approvedIcon_' + record._id).hide();
              $('#def_unapprovedIcon_' + record._id).hide();
              $('#approvedIcon_' + record._id).show();
              $('#unapprovedIcon_' + record._id).hide();

              Swal.fire(
                'Approved!',
                'You approved the claim successfully.',
                'success'
              );
            }/*  else if (event === 'Cancel') {
              $('#def_approvedIcon_' + record._id).hide();
              $('#def_unapprovedIcon_' + record._id).hide();
              $('#approvedIcon_' + record._id).hide();
              $('#unapprovedIcon_' + record._id).hide();

              Swal.fire(
                'Canceled!',
                'You canceled the claim successfully.',
                'success'
              );
            } */
          } else {
            Swal.fire(
              'Oops',
              'Something went wrong please try again.',
              'error'
            );
          }
        });
      }
    }
  }

  checkDuplicacy(claim) {
    const reqData = {
      id: claim._id,
      plant: claim.plant,
      batch: claim.batch,
      invoice: claim.invoice,
      material: claim.material,
      customerId: claim.customerId
    }

    return new Promise(resolve => {
      this.apiService.post('/api/claim/checkDuplicacy', reqData).subscribe((resp: any) => {
        if (resp.status === 200) {
          resolve(resp);
        } else {
          resolve([]);
        }
      });
    });
  }

  findUpdateRemaining(data) {
    return new Promise(resolve => {
      this.apiService.post('/api/remaining/findUpdateRemaining', data).subscribe((resp: any) => {
        if (resp.status === 200) {
          resolve(resp);
        } else {
          resolve([]);
        }
      });
    });
  }

  findUpdateHoRemaining(data) {
    return new Promise(resolve => {
      this.apiService.post('/api/remaining/findUpdateHoRemaining', data).subscribe((resp: any) => {
        if (resp.status === 200) {
          resolve(resp);
        } else {
          resolve([]);
        }
      });
    });
  }

  async getRemaining(demand) {
    console.log('demand--', demand);
    this.allotedHoInvoiceQty = [];
    const distributorCustomerIds = [];

    const distCustIds: any = await this.getDistributorByPlant(demand.plant);
    if (distCustIds.length) {
      distCustIds.forEach(element => {
        distributorCustomerIds.push(element.customerId);
      });
    }

    if (demand.customerId === 1) {
      /* Approval for SELF */
      let hoAllotedQty = 0;

      const reqData = {
        customerId: { $in: distributorCustomerIds },
        batch: demand.batch
      };
      const hoInvoice: any = await this.hoInvoice(reqData);
      console.log('hoInvoice--', hoInvoice);

      if (hoInvoice[0].length) {
        hoInvoice[0].forEach(async (hoRemaining) => {
          console.log('hoRemaining--', hoRemaining);
          if (hoAllotedQty >= demand.saleQuantity) {
            console.log('Break foreach');
            return; // Break foreach loop
          } else {
            console.log('Break foreach else');
            let hoAllotQty = 0;
            const hoRequiredQty = demand.saleQuantity - hoAllotedQty;
            const hoRemainingStock = (hoRemaining.remainingData.length) ? hoRemaining.remainingData[0].quantity : hoRemaining.saleUnit;
            console.log(hoRequiredQty, hoRemainingStock);

            if (hoRemainingStock >= demand.saleQuantity) {
              hoAllotQty = hoRequiredQty;
            } else {
              hoAllotQty = (hoRequiredQty >= hoRemainingStock) ? hoRemainingStock : hoRequiredQty;
            }
            hoAllotedQty = hoAllotedQty + hoAllotQty;

            const margin = demand.margin ? demand.margin : 10;

            const claimData = {
              claimId: demand._id,
              customerId: demand.customerId,
              invoice: demand.invoice,
              batch: hoRemaining.batch,
              division: hoRemaining.divisionName,
              product: hoRemaining.materialDesc,
              material: hoRemaining.material,
              particulars: '',
              category: '',
              distInvoice: hoRemaining.billDocNumber,
              distInvQty: hoRemaining.saleUnit,
              stkInvoice: '',
              stkInvoiceQty: '',
              distRemnQty: hoRemainingStock - hoAllotQty,
              stkRemnQty: '',
              hdnStkRemnQty: hoRemainingStock,
              mrp: hoRemaining.mrp,
              pts: hoRemaining.pts,
              billingRate: demand.billingRate,
              margin: margin,
              freeQuantity: demand.freeQuantity,
              saleQuantity: hoAllotQty,
              difference: (hoRemaining.pts - demand.billingRate).toFixed(2),
              totalDifference: ((hoRemaining.pts - demand.billingRate) + (demand.billingRate * margin / 100)).toFixed(2),
              amount: (((hoRemaining.pts - demand.billingRate) + (demand.billingRate * margin / 100)) * hoAllotQty).toFixed(2),
              totalSaleQuantity: hoAllotQty,
              ptd: hoRemaining.ptd,
              totalPtdAmt: (hoRemaining.ptd * hoAllotQty).toFixed(2),
              image: ''
            };
            console.log('claimData--', claimData);
            this.allotedHoInvoiceQty.push(claimData);
          }
        });

        if (this.allotedHoInvoiceQty) {
          this.hoAllotedQty = hoAllotedQty;
          this.requestedQty = demand.saleQuantity;
          this.openSelfPopup();
        }
      } else {
        Swal.fire(
          'Oops... can\'t proceed',
          'The distributor has no stock of this batch/material.',
          'error'
        );
      }
    } else {
      /* Approval for STOCKIST */
      let hoAllotedQty = 0;

      const reqData = {
        customerId: { $in: distributorCustomerIds },
        batch: demand.batch
      };
      const hoInvoice: any = await this.hoInvoice(reqData);
      hoInvoice[0].forEach(async (hoRemaining) => {
        if (hoAllotedQty >= demand.saleQuantity) {
          console.log('Break foreach');
          return; // Break foreach loop
        } else {
          console.log('Break foreach else');
          let hoAllotQty = 0;
          const hoRequiredQty = demand.saleQuantity - hoAllotedQty;
          const hoRemainingStock = (hoRemaining.remainingData.length) ? hoRemaining.remainingData[0].quantity : hoRemaining.saleUnit;
          if (hoRemainingStock) {
            if (hoRemainingStock >= demand.saleQuantity) {
              hoAllotQty = hoRequiredQty;
            } else {
              hoAllotQty = (hoRequiredQty >= hoRemainingStock) ? hoRemainingStock : hoRequiredQty;
            }
          }
          hoAllotedQty = hoAllotedQty + hoAllotQty;
          const margin = demand.margin ? demand.margin : 10;
          const claimData = {
            claimId: demand._id,
            customerId: demand.customerId,
            invoice: demand.invoice,
            batch: hoRemaining.batch,
            division: hoRemaining.divisionName,
            product: hoRemaining.materialDesc,
            material: hoRemaining.material,
            particulars: '',
            category: '',
            distInvoice: hoRemaining.billDocNumber,
            distInvQty: hoRemaining.saleUnit,
            stkInvoice: '',
            stkInvoiceQty: '',
            distRemnQty: hoRemainingStock - hoAllotQty,
            stkRemnQty: '',
            hdnStkRemnQty: hoRemainingStock,
            mrp: hoRemaining.mrp,
            pts: hoRemaining.pts,
            billingRate: demand.billingRate,
            margin: margin,
            freeQuantity: demand.freeQuantity,
            saleQuantity: hoAllotQty,
            difference: (hoRemaining.pts - demand.billingRate).toFixed(2),
            totalDifference: ((hoRemaining.pts - demand.billingRate) + (demand.billingRate * margin / 100)).toFixed(2),
            amount: (((hoRemaining.pts - demand.billingRate) + (demand.billingRate * margin / 100)) * hoAllotQty).toFixed(2),
            totalSaleQuantity: hoAllotQty,
            ptd: hoRemaining.ptd,
            totalPtdAmt: (hoRemaining.ptd * hoAllotQty).toFixed(2),
            image: ''
          };
          this.allotedHoInvoiceQty.push(claimData);
        }
      });

      const reqDataSales = {
        customerId: demand.customerId,
        batch: demand.batch
      }
      const salesAndRemainingQuantity: any = await this.salesAndRemainingQuantity(reqDataSales);
      console.log('salesAndRemainingQuantity--', salesAndRemainingQuantity);
      if (salesAndRemainingQuantity.length) {
        let allotedQty = 0;
        this.salesAndRemainings.push(salesAndRemainingQuantity);
        salesAndRemainingQuantity.forEach(async (remaining) => {
          if (allotedQty >= demand.saleQuantity) {
            console.log('Break foreach');
            return; // Break foreach loop
          } else {
            let allotQty = 0;
            const requiredQty = demand.saleQuantity - allotedQty;
            const remainingStock = (remaining.remainingData.length) ? remaining.remainingData[0].quantity : remaining.saleUnit;
            console.log('requiredQty--', requiredQty, remainingStock);

            if (remainingStock >= demand.saleQuantity) {
              allotQty = requiredQty;
            } else {
              allotQty = (requiredQty >= remainingStock) ? remainingStock : requiredQty;
            }
            allotedQty = allotedQty + allotQty;

            const margin = demand.margin ? demand.margin : 10;

            const claimData = {
              claimId: demand._id,
              customerId: demand.customerId,
              invoice: demand.invoice,
              batch: remaining.batch,
              division: remaining.divisionName,
              product: remaining.materialDesc,
              material: remaining.material,
              particulars: '',
              category: '',
              distInvoice: '',
              distInvQty: '',
              stkInvoice: remaining.billDocNumber,
              stkInvoiceQty: remaining.saleUnit,
              //stkRemnQty: remaining.saleUnit - allotQty,
              stkRemnQty: remainingStock - allotQty,
              hdnStkRemnQty: remainingStock,
              mrp: remaining.mrp,
              pts: remaining.pts,
              billingRate: demand.billingRate,
              margin: margin,
              freeQuantity: demand.freeQuantity,
              saleQuantity: allotQty,
              difference: (remaining.pts - demand.billingRate).toFixed(2),
              totalDifference: ((remaining.pts - demand.billingRate) + (demand.billingRate * margin / 100)).toFixed(2),
              amount: (((remaining.pts - demand.billingRate) + (demand.billingRate * margin / 100)) * allotQty).toFixed(2),
              totalSaleQuantity: allotQty,
              ptd: remaining.ptd,
              totalPtdAmt: (remaining.ptd * allotQty).toFixed(2),
              image: ''
            };

            this.allotedInvoiceQty.push(claimData);
          }
        });

        if (hoAllotedQty <= 0) {
          this.allotedHoInvoiceQty = [];
          $('#stockistMod').css('width', '515px');
          console.log('this.allotedHoInvoiceQty--', this.allotedHoInvoiceQty);
        }

        if (this.allotedInvoiceQty) {
          this.allotedQty = allotedQty;
          this.requestedQty = demand.saleQuantity;
          this.openPopup();
        }
      } else {
        Swal.fire(
          'Oops... can\'t proceed',
          'The stockist has no stock of this batch/material.',
          'error'
        );
      }
      console.log('allotedInvoiceQty---', this.allotedInvoiceQty);
    }
  }

  hoInvoice(requestData) {
    return new Promise(resolve => {
      this.apiService.post('/api/sales/ho/invoice', requestData).subscribe((resp: any) => {
        if (resp.status === 200 && resp.data) {
          resolve([resp.data]);
        } else {
          resolve([]);
        }
      });
    });
  }

  salesAndRemainingQuantity(requestData) {
    return new Promise(resolve => {
      this.apiService.post('/api/sales/remainingQuantity', requestData).subscribe((resp: any) => {
        if (resp.status === 200 && resp.data.length) {
          resolve(resp.data);
        } else {
          resolve([]);
        }
      });
    });
  }

  getDistributorByPlant(plant) {
    return new Promise(resolve => {
      this.apiService.get('/api/getCustomer', plant).subscribe((response: any) => {
        if (response.status === 200 && response.data.length) {
          resolve(response.data);
        } else {
          resolve([]);
        }
      });
    });
  }

  getClaimById(id) {
    return new Promise(resolve => {
      this.apiService.get('/api/getClaim', id).subscribe((response: any) => {
        if (response.status === 200 && response.data.length) {
          resolve(response.data[0]);
        } else {
          resolve([]);
        }
      });
    });
  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }

  openSelfPopup() {
    var modal = document.getElementById("modalSelf");
    modal.style.display = "block";
  }
  closeSelfPopup() {
    var modal = document.getElementById("modalSelf");
    modal.style.display = "none";
  }

  async approveSelf() {
    if (this.requestedQty > this.hoAllotedQty) {
      Swal.fire({
        title: 'Are you sure want to approve?',
        text: 'Only ' + this.hoAllotedQty + ' quantities out of ' + this.requestedQty + ' are being allotted.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'No, keep it'
      }).then(async (result) => {
        if (result.value) {
          const allocatQty = await this.allocateHoQuantity(this.allotedHoInvoiceQty);

          /* let amount = 0;
          const pts = this.approvalClickedClaim['pts'];
          const freeQuantity = this.approvalClickedClaim['freeQuantity'];
          const saleQuantity = this.approvalClickedClaim['saleQuantity'];
          if (freeQuantity) {
            amount = pts * this.hoAllotedQty;
          } else if (saleQuantity) {
            const margin = this.approvalClickedClaim['margin'];
            const billingRate = this.approvalClickedClaim['billingRate'];
            const difference = pts - billingRate;
            const totalDifference = difference + (billingRate * margin / 100);
            amount = totalDifference * this.hoAllotedQty;
          }

          this.approvalClickedClaim['approvedQty'] = this.hoAllotedQty;
          this.approvalClickedClaim['approvedAmount'] = amount;

          if (this.sessionData.type === 'ho' && this.sessionData.workType === 'ho1') {
            this.approvalClickedClaim['ho1Status'] = 1;
            this.approvalClickedClaim['ho1ActionBy'] = this.sessionData.id;
            this.approvalClickedClaim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          } else {
            this.approvalClickedClaim['hoStatus'] = 1;
            this.approvalClickedClaim['hoActionBy'] = this.sessionData.id;
            this.approvalClickedClaim['hoActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }


          this.apiService.post('/api/claim/updateClaim', this.approvalClickedClaim).subscribe((response: any) => {
            if (response.status === 200) {
              $('#def_approvedIcon_' + this.approvalClickedClaim['_id']).hide();
              $('#def_unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();
              $('#approvedIcon_' + this.approvalClickedClaim['_id']).show();
              $('#unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();

              Swal.fire(
                'Approved!',
                'You approved the claim successfully.',
                'success'
              );
            } else {
              Swal.fire(
                'Sorry',
                'Something went wrong please try again later.',
                'error'
              );
            }
          }); */

          this.closeSelfPopup();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire(
            'Cancelled',
            'Your record is safe :)',
            'error'
          );
          this.closeSelfPopup();
        }
      });
    } else {
      const allocatQty = await this.allocateHoQuantity(this.allotedHoInvoiceQty);

      let amount = 0;
      const pts = this.approvalClickedClaim['pts'];
      const freeQuantity = this.approvalClickedClaim['freeQuantity'];
      const saleQuantity = this.approvalClickedClaim['saleQuantity'];
      if (freeQuantity) {
        amount = pts * this.hoAllotedQty;
      } else if (saleQuantity) {
        const margin = this.approvalClickedClaim['margin'];
        const billingRate = this.approvalClickedClaim['billingRate'];
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * margin / 100);
        amount = totalDifference * this.hoAllotedQty;
      }
      this.approvalClickedClaim['approvedQty'] = this.hoAllotedQty;
      this.approvalClickedClaim['approvedAmount'] = amount;

      if (this.sessionData.type === 'ho' && this.sessionData.workType === 'ho1') {
        this.approvalClickedClaim['ho1Status'] = 1;
        this.approvalClickedClaim['ho1ActionBy'] = this.sessionData.id;
        this.approvalClickedClaim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      } else {
        this.approvalClickedClaim['hoStatus'] = 1;
        this.approvalClickedClaim['hoActionBy'] = this.sessionData.id;
        this.approvalClickedClaim['hoActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      }

      this.apiService.post('/api/claim/updateClaim', this.approvalClickedClaim).subscribe((response: any) => {
        if (response.status === 200) {
          $('#def_approvedIcon_' + this.approvalClickedClaim['_id']).hide();
          $('#def_unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();
          $('#approvedIcon_' + this.approvalClickedClaim['_id']).show();
          $('#unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();

          Swal.fire(
            'Approved!',
            'You approved the claim successfully.',
            'success'
          );
        } else {
          Swal.fire(
            'Sorry',
            'Something went wrong please try again later.',
            'error'
          );
        }
      });

      this.closeSelfPopup();
    }
  }

  allocateHoQuantity(invoices) {
    return new Promise(resolve => {
      this.apiService.post('/api/sales/allocateHoQuantity', invoices).subscribe((resp: any) => {
        if (resp.status === 200) {
          resolve(resp);
        } else {
          resolve([]);
        }
      });
    });
  }

  async approve() {
    if (this.requestedQty > this.allotedQty) {
      Swal.fire({
        title: 'Are you sure want to approve?',
        text: 'Only ' + this.allotedQty + ' quantities out of ' + this.requestedQty + ' are being allotted.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'No, keep it'
      }).then(async (result) => {
        if (result.value) {
          const allocatHoQty = await this.allocateHoQuantity(this.allotedHoInvoiceQty);
          const allocatQty = await this.allocateQuantity(this.allotedInvoiceQty);

          let amount = 0;
          const pts = this.approvalClickedClaim['pts'];
          const freeQuantity = this.approvalClickedClaim['freeQuantity'];
          const saleQuantity = this.approvalClickedClaim['saleQuantity'];
          if (freeQuantity) {
            amount = pts * this.allotedQty;
          } else if (saleQuantity) {
            const margin = this.approvalClickedClaim['margin'];
            const billingRate = this.approvalClickedClaim['billingRate'];
            const difference = pts - billingRate;
            const totalDifference = difference + (billingRate * margin / 100);
            amount = totalDifference * this.allotedQty;
          }

          this.approvalClickedClaim['approvedQty'] = this.allotedQty;
          this.approvalClickedClaim['approvedAmount'] = amount;

          if (this.sessionData.type === 'ho' && this.sessionData.workType === 'ho1') {
            this.approvalClickedClaim['ho1Status'] = 1;
            this.approvalClickedClaim['ho1ActionBy'] = this.sessionData.id;
            this.approvalClickedClaim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          } else {
            this.approvalClickedClaim['hoStatus'] = 1;
            this.approvalClickedClaim['hoActionBy'] = this.sessionData.id;
            this.approvalClickedClaim['hoActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
          }
          console.log('this.approvalClickedClaim--', this.approvalClickedClaim);

          this.apiService.post('/api/claim/updateClaim', this.approvalClickedClaim).subscribe((response: any) => {
            if (response.status === 200) {
              $('#def_approvedIcon_' + this.approvalClickedClaim['_id']).hide();
              $('#def_unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();
              $('#approvedIcon_' + this.approvalClickedClaim['_id']).show();
              $('#unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();

              Swal.fire(
                'Approved!',
                'You approved the claim successfully.',
                'success'
              );
            } else {
              Swal.fire(
                'Sorry',
                'Something went wrong please try again later.',
                'error'
              );
            }
          });

          this.closePopup();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire(
            'Cancelled',
            'Your record is safe :)',
            'error'
          );
          this.closePopup();
        }
      });
    } else {
      const allocatHoQty = await this.allocateHoQuantity(this.allotedHoInvoiceQty);
      const allocatQty = await this.allocateQuantity(this.allotedInvoiceQty);

      let amount = 0;
      const pts = this.approvalClickedClaim['pts'];
      const freeQuantity = this.approvalClickedClaim['freeQuantity'];
      const saleQuantity = this.approvalClickedClaim['saleQuantity'];
      if (freeQuantity) {
        amount = pts * this.allotedQty;
      } else if (saleQuantity) {
        const margin = this.approvalClickedClaim['margin'];
        const billingRate = this.approvalClickedClaim['billingRate'];
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * margin / 100);
        amount = totalDifference * this.allotedQty;
      }
      this.approvalClickedClaim['approvedQty'] = this.allotedQty;
      this.approvalClickedClaim['approvedAmount'] = amount;

      if (this.sessionData.type === 'ho' && this.sessionData.workType === 'ho1') {
        this.approvalClickedClaim['ho1Status'] = 1;
        this.approvalClickedClaim['ho1ActionBy'] = this.sessionData.id;
        this.approvalClickedClaim['ho1ActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      } else {
        this.approvalClickedClaim['hoStatus'] = 1;
        this.approvalClickedClaim['hoActionBy'] = this.sessionData.id;
        this.approvalClickedClaim['hoActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      }
      console.log('this.approvalClickedClaim--', this.approvalClickedClaim);

      this.apiService.post('/api/claim/updateClaim', this.approvalClickedClaim).subscribe((response: any) => {
        if (response.status === 200) {
          $('#def_approvedIcon_' + this.approvalClickedClaim['_id']).hide();
          $('#def_unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();
          $('#approvedIcon_' + this.approvalClickedClaim['_id']).show();
          $('#unapprovedIcon_' + this.approvalClickedClaim['_id']).hide();

          Swal.fire(
            'Approved!',
            'You approved the claim successfully.',
            'success'
          );
        } else {
          Swal.fire(
            'Sorry',
            'Something went wrong please try again later.',
            'error'
          );
        }
      });

      this.closePopup();
    }
  }

  allocateQuantity(invoices) {
    return new Promise(resolve => {
      this.apiService.post('/api/sales/allocateQuantity', invoices).subscribe((resp: any) => {
        if (resp.status === 200) {
          resolve(resp);
        } else {
          resolve([]);
        }
      });
    });
  }

  getAllocatedQuantity(claimId) {
    return new Promise(resolve => {
      const reqData = {
        _id: claimId
      }
      this.apiService.post('/api/sales/allocatedQuantity', reqData).subscribe((resp: any) => {
        if (resp.status === 200 && resp.data.length) {
          resolve(resp.data);
        } else {
          resolve([]);
        }
      });
    });
  }

  allocatedHoQuantity(claimId) {
    return new Promise(resolve => {
      const reqData = {
        _id: claimId
      }
      this.apiService.post('/api/sales/allocatedHoQuantity', reqData).subscribe((resp: any) => {
        if (resp.status === 200 && resp.data.length) {
          resolve(resp.data);
        } else {
          resolve([]);
        }
      });
    });
  }

  async editRecord(record) {
    const claim = await this.getClaimById(record._id);
    if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
      if (claim['suhStatus'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      }
    } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
      if (claim['hoStatus'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      }
    } else if (this.sessionData.type === 'ho') {
      if (claim['ho1Status'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      } else if (claim['hoStatus'] === 1) {
        Swal.fire(
          'Sorry',
          'You have accepted this claim, if you update it you will need to accept or reject this claim again.',
          'info'
        );
      }
    }

    $('#edit_id').val(record._id);
    $('#edit_distributor').val(record.plant);
    $('#edit_stockiest').val(record.customerId);
    $('#edit_type').val(record.claimType);
    $('#edit_month').val(record.claimMonth);
    $('#edit_year').val(record.claimYear);

    $('#edit_invoice').val(record.invoice);
    $('#edit_batch').val(record.batch);
    $('#edit_division').val(record.divisionName);
    $('#edit_product').val(record.materialName);
    $('#edit_material').val(record.batchDetail[0].material);
    $('#edit_mrp').val(record.mrp);
    $('#edit_pts').val(record.pts);
    $('#edit_billingRate').val(record.billingRate);
    $('#edit_margin').val(record.margin);
    $('#edit_freeQuantity').val(record.freeQuantity);
    $('#edit_saleQuantity').val(record.saleQuantity);
    $('#edit_difference').val(record.difference);
    $('#edit_totalDifference').val(record.totalDifference);
    $('#edit_amount').val(record.amount);
    $('#edit_hoStatus').val(record.hoStatus);

    var modal = document.getElementById("myModal");
    modal.style.display = "block";

    this.validateClaim();
  }

  closeEditModal() {
    $('.form-select').removeClass('errorClass');
    $('.form-control').removeClass('errorClass');

    var modal = document.getElementById("myModal");
    modal.style.display = "none";
  }

  closeCommentModal() {
    $('.form-select').removeClass('errorClass');
    $('.form-control').removeClass('errorClass');

    var modal = document.getElementById("myModalComment");
    modal.style.display = "none";
  }

  async rejectClaim() {
    const comments = $.trim($('#comments').val());
    if (comments) {
      if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
        this.approvalClickedClaim['ftApprovalComment'] = comments;
      } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
        this.approvalClickedClaim['suhApprovalComment'] = comments;
      } else if (this.sessionData.type === 'ho') {
        if (this.sessionData.workType === 'ho1') {
          this.approvalClickedClaim['ho1ApprovalComment'] = comments;
        } else {
          this.approvalClickedClaim['hoApprovalComment'] = comments;
        }

        this.approvalClickedClaim['approvedAmount'] = 0;
        this.approvalClickedClaim['approvedQty'] = 0;

        // Update/reduce/manage Allocated quantity
        if (this.approvalClickedClaim.customerId === 1) { // Self claim
          const allocatedHoQty: any = await this.allocatedHoQuantity(this.approvalClickedClaim['_id']);
          if (allocatedHoQty.length) {
            allocatedHoQty.forEach(async element => {
              const reqData = {
                billDocNumber: element['distInvoiceNo'],
                billToParty: this.approvalClickedClaim['customerId'],
                batch: this.approvalClickedClaim['batch'],
                allocatedQty: element['allocatedQty'],
                claimId: this.approvalClickedClaim['_id']
              }
              const findUpdateHoRemaining: any = await this.findUpdateHoRemaining(reqData);
            });
          }
        } else {
          const allocatedQty: any = await this.getAllocatedQuantity(this.approvalClickedClaim['_id']);
          if (allocatedQty.length) {
            allocatedQty.forEach(async element => {
              const reqData = {
                billDocNumber: element['stkInvoiceNo'],
                billToParty: this.approvalClickedClaim['customerId'],
                batch: this.approvalClickedClaim['batch'],
                allocatedQty: element['allocatedQty'],
                claimId: this.approvalClickedClaim['_id']
              }
              const findUpdateRemaining: any = await this.findUpdateRemaining(reqData);
            });
          }
        }
        // EOF Update/reduce/manage Allocated quantity
      }

      this.apiService.post('/api/claim/updateClaim', this.approvalClickedClaim).subscribe((response: any) => {
        if (response.status === 200) {
          Swal.fire(
            'Un-Approved!',
            'You un-approved the claim successfully.',
            'success'
          );
        } else {
          Swal.fire(
            'Oops',
            'Something went wrong please try again.',
            'error'
          );
        }

        $('#def_approvedIcon_' + this.approvalClickedClaim._id).hide();
        $('#def_unapprovedIcon_' + this.approvalClickedClaim._id).hide();
        $('#approvedIcon_' + this.approvalClickedClaim._id).hide();
        $('#unapprovedIcon_' + this.approvalClickedClaim._id).show();
        this.closeCommentModal();
      });
    } else {
      Swal.fire(
        'Sorry',
        'Please write the reason for rejection.',
        'error'
      );
    }
  }

  closeUpdateCommentModal() {
    var modal = document.getElementById("updateModalComment");
    modal.style.display = "none";
  }

  async updateCommentClaim() {
    const comments = $.trim($('#update_comments').val());
    if (comments) {
      const id = $('#edit_id').val();
      const customerId = $('#edit_stockiest').val();
      const batch = $('#edit_batch').val();

      const reqData = {
        _id: id,
        plant: $('#edit_distributor').val(),
        customerId: customerId,
        claimType: $('#edit_type').val(),
        claimMonth: $('#edit_month').val(),
        claimYear: $('#edit_year').val(),
        invoice: $('#edit_invoice').val(),
        batch: batch,
        divisionName: $('#edit_division').val(),
        material: $('#edit_material').val(),
        materialName: $('#edit_product').val(),
        mrp: $('#edit_mrp').val(),
        pts: $('#edit_pts').val(),
        ptr: $('#edit_ptr').val(),
        ptd: $('#edit_ptd').val(),
        billingRate: $('#edit_billingRate').val(),
        margin: $('#edit_margin').val(),
        freeQuantity: $('#edit_freeQuantity').val(),
        saleQuantity: $('#edit_saleQuantity').val(),
        difference: $('#edit_difference').val(),
        totalDifference: $('#edit_totalDifference').val(),
        amount: $('#edit_amount').val()
      }

      if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
        reqData['ftUpdateComment'] = comments;
        reqData['ftActionBy'] = this.sessionData.id;
        reqData['ftActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
        reqData['suhUpdateComment'] = comments;
        reqData['suhActionBy'] = this.sessionData.id;
        reqData['suhActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      } else {
        reqData['hoUpdateComment'] = comments;
        reqData['hoActionBy'] = this.sessionData.id;
        reqData['hoActionOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      }

      if ($('#edit_hoStatus').val() == 1) {
        reqData['hoStatus'] = 0;
        reqData['approvedQty'] = 0;
        reqData['approvedAmount'] = 0;

        // Update/reduce/manage Allocated quantity
        const allocatedQty: any = await this.getAllocatedQuantity(id);
        if (allocatedQty.length) {
          allocatedQty.forEach(async element => {
            const reqData = {
              billDocNumber: element['stkInvoiceNo'],
              billToParty: customerId,
              batch: batch,
              allocatedQty: element['allocatedQty'],
              claimId: id
            }
            const findUpdateRemaining: any = await this.findUpdateRemaining(reqData);
          });
        }
        // EOF Update/reduce/manage Allocated quantity
      }

      this.apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
        if (response.status === 200) {
          this.toast('success', 'Successfully updated.');
          this.getData();

          setTimeout(() => {
            this.closeUpdateCommentModal();
            this.closeEditModal();
          }, 2000);

          /* setTimeout(() => {
            window.location.reload();
          }, 2000); */
        } else {
          this.toast('error', 'Something went wrong. Try refreshing the page or try again later.');
        }
      });
    } else {
      Swal.fire(
        'Sorry',
        'Please write the reason for update.',
        'error'
      );
    }
  }

  changeCalculation(e) {
    $('#edit_freeQuantity').attr('readonly', false);

    $('#edit_billingRate').removeClass('grf-invalid');
    $('#edit_freeQuantity').removeClass('grf-invalid');
    $('#edit_saleQuantity').removeClass('grf-invalid');

    const billingRate = $('#edit_billingRate').val();
    const freeQuantity = $('#edit_freeQuantity').val();
    const saleQuantity = $('#edit_saleQuantity').val();

    const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
    if (!reg.test(billingRate)) $('#edit_billingRate').addClass('grf-invalid');
    if (!reg.test(freeQuantity)) $('#edit_freeQuantity').addClass('grf-invalid');
    if (!reg.test(saleQuantity)) $('#edit_saleQuantity').addClass('grf-invalid');

    if (billingRate == 0) {
      $('#edit_margin').val(0);
      //$('#edit_billingRate').val(Number(0).toFixed(2));

      if (freeQuantity) {
        const pts = $('#edit_pts').val();
        const amount = pts * freeQuantity;

        $('#edit_difference').val(Number(0).toFixed(2));
        $('#edit_totalDifference').val(Number(0).toFixed(2));
        $('#edit_amount').val(amount.toFixed(2));
      } else {
        $('#edit_difference').val(Number(0).toFixed(2));
        $('#edit_totalDifference').val(Number(0).toFixed(2));
        $('#edit_amount').val(Number(0).toFixed(2));
      }
    } else {
      $('#edit_freeQuantity').val('');
      $('#edit_freeQuantity').attr('readonly', true);

      if (billingRate && saleQuantity) {
        if ($('#edit_margin').val() == '' || $('#edit_margin').val() == 0) {
          $('#edit_margin').val(10);
        }

        const margin = $('#edit_margin').val();
        const pts = $('#edit_pts').val();
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * margin / 100);
        const amount = totalDifference * saleQuantity;

        $('#edit_difference').val(difference.toFixed(2));
        $('#edit_totalDifference').val(totalDifference.toFixed(2));
        $('#edit_amount').val(amount.toFixed(2));
      }
    }
    //this.validateClaim();
  }

  validateClaim() {
    $('.form-select').removeClass('errorClass');
    $('.form-control').removeClass('errorClass');

    let error = 0;
    const stockiest = $('#edit_stockiest').val();
    const type = $('#edit_type').val();
    const month = $('#edit_month').val();
    const year = $('#edit_year').val();
    const invoice = $('#edit_invoice').val();
    const batch = $('#edit_batch').val();
    const division = $('#edit_division').val();
    const product = $('#edit_product').val();
    const material = $('#edit_material').val();
    const mrp = $('#edit_mrp').val();
    const pts = $('#edit_pts').val();
    const billingRate = $('#edit_billingRate').val();
    // const margin = $('#edit_margin').val();
    const freeQuantity = $('#edit_freeQuantity').val();
    // const saleQuantity = $('#edit_saleQuantity').val();
    // const difference = $('#edit_difference').val();
    // const totalDifference = $('#edit_totalDifference').val();
    const amount = $('#edit_amount').val();

    if (!stockiest) {
      error = 1;
      $('#edit_stockiest').addClass('errorClass');
    }
    if (!type) {
      error = 1;
      $('#edit_type').addClass('errorClass');
    }
    if (!month) {
      error = 1;
      $('#edit_month').addClass('errorClass');
    }
    if (!year) {
      error = 1;
      $('#edit_year').addClass('errorClass');
    }
    if (!invoice) {
      error = 1;
      $('#edit_invoice').addClass('errorClass');
    }
    if (!batch) {
      error = 1;
      $('#edit_batch').addClass('errorClass');
    }

    if (!division) {
      error = 1;
      $('#edit_batch').addClass('errorClass');
      // $('#edit_division').addClass('errorClass');
    }
    if (!product) {
      error = 1;
      $('#edit_batch').addClass('errorClass');
      // $('#edit_product').addClass('errorClass');
    }
    if (!material) {
      error = 1;
      $('#edit_batch').addClass('errorClass');
      // $('#edit_material').addClass('errorClass');
    }
    if (!mrp) {
      error = 1;
      $('#edit_batch').addClass('errorClass');
      // $('#edit_mrp').addClass('errorClass');
    }
    if (!pts) {
      error = 1;
      // $('#edit_pts').addClass('errorClass');
    }

    if (billingRate < 0) {
      error = 1;
      $('#edit_batch').addClass('errorClass');
      $('#edit_billingRate').addClass('errorClass');
    }
    if (amount <= 0) {
      error = 1;
      $('#edit_amount').addClass('errorClass');
    }

    if (billingRate == 0 && (!freeQuantity || freeQuantity == 0)) {
      error = 1;
      $('#edit_billingRate').addClass('errorClass');
      $('#edit_freeQuantity').addClass('errorClass');
    }
    if (billingRate == 0 && (!freeQuantity || freeQuantity == 0)) {
      error = 1;
      $('#edit_billingRate').addClass('errorClass');
      $('#edit_freeQuantity').addClass('errorClass');
    }

    $('#edit_error').val(error);
  }

  async updateClaim() {
    this.validateClaim();
    const error = $('#edit_error').val();
    if (error != 0) {
      this.toast('error', 'Something is wrong please fix before updating.');
    } else {
      $('#update_comments').val('');
      var modal = document.getElementById("updateModalComment");
      modal.style.display = "block";
    }

  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  newTab(file) {
    window.open(this.apiURL + '/uploads/files/' + this.clickedFile.filename);
  }

  comments(data) {
    this.clickedRecord = data;

    var modal = document.getElementById("modalComments");
    modal.style.display = "block";
  }
  closeCommentsModal() {
    var modal = document.getElementById("modalComments");
    modal.style.display = "none";
  }

  showMrp(data, material, id) {
    $('#batchMrp_id').val('');

    this.batchPrices = [];
    data.forEach(element => {
      if (element.material === material) {
        const mrp = {
          mrp: element.mrp,
          pts: element.pts
        };
        this.batchPrices.push(mrp);

        if (element.mrp2) {
          const mrp2 = {
            mrp: element.mrp2,
            pts: element.pts2
          };
          this.batchPrices.push(mrp2);
        }

        if (element.mrp3) {
          const mrp3 = {
            mrp: element.mrp3,
            pts: element.pts3
          };
          this.batchPrices.push(mrp3);
        }

        if (element.mrp4) {
          const mrp4 = {
            mrp: element.mrp4,
            pts: element.pts4
          };
          this.batchPrices.push(mrp4);
        }
      }
    });

    $('#batchMrp_id').val(id);

    var modal = document.getElementById("modalBatchPrice");
    modal.style.display = "block";
  }

  closeBatchPriceModal() {
    var modal = document.getElementById("modalBatchPrice");
    modal.style.display = "none";
  }

  confirmBatchPrice() {
    const id = $('#batchMrp_id').val();
    const checkedMrp = $('input[name="batchMrp"]:checked').val();

    const reqData = {
      _id: id,
      mrp: this.batchPrices[checkedMrp].mrp,
      pts: this.batchPrices[checkedMrp].pts
    }
    this.apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        // $('#err_batchMrp_' + id).css('color', '#495057');
        $('#err_batchMrp_' + id).text(parseFloat(this.batchPrices[checkedMrp].mrp).toFixed(2));
        $('#pts_' + id).text(parseFloat(this.batchPrices[checkedMrp].pts).toFixed(2));
        // $('#batchMrp_' + id).hide();
        // $('#err_batchMrp_' + id).show();
        $('#batchMrp_selected_' + id).val(1);

        this.closeBatchPriceModal();

        Swal.fire(
          'MRP PTS',
          'Updated successfully.',
          'success'
        );
      } else {
        this.closeBatchPriceModal();

        Swal.fire(
          'Oops',
          'Something went wrong please try again.',
          'error'
        );
      }
    });
  }

  toggleCheckboxAll(event) {
    const checked = event.target.checked;
    console.log('checked--', checked);
    $('.selectedId').prop('checked', checked);
  }

  changeCheckbox(event) {
    var check = ($('.selectedId').filter(":checked").length == $('.selectedId').length);
    console.log('check--', check);
    $('#selectall').prop("checked", check);
  }

  acceptAll() {
    /* $(".selectedId").each(function(i) {

      console.log(i);
    }); */
    const checkedBox = $('.selectedId:checked');
    const checkedBoxCount = checkedBox.length;

    if (checkedBoxCount > 0) {
      const userId = this.sessionData.id;
      const apiService = this.apiService;

      let loopCount = 0;
      let error = 0;

      checkedBox.each(function (key, element) {
        const reqData = {
          _id: element.value,
          suhStatus: 1,
          suhApprovalComment: null,
          suhActionBy: userId,
          suhActionOn: moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]")
        }

        apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            $('#def_approvedIcon_' + element.value).hide();
            $('#def_unapprovedIcon_' + element.value).hide();
            $('#approvedIcon_' + element.value).show();
            $('#unapprovedIcon_' + element.value).hide();
          } else {
            error = 1;
          }
        });

        loopCount++;

        if (loopCount === checkedBoxCount) {
          if (error) {
            Swal.fire(
              'Notice',
              "Unable to accept some claims. <br> Please check it manually.",
              'warning'
            );
          } else {
            Swal.fire(
              'Approved!',
              'You approved the claim successfully.',
              'success'
            );
          }
        }
      });
    } else {
      Swal.fire(
        'Notice',
        'Please check at least one checkbox to proceed.',
        'warning'
      );
    }
  }

  rejectAll() {
    const checkedBox = $('.selectedId:checked');
    const checkedBoxCount = checkedBox.length;

    if (checkedBoxCount > 0) {
      const userId = this.sessionData.id;
      const apiService = this.apiService;

      let loopCount = 0;
      let error = 0;

      checkedBox.each(function (key, element) {
        const reqData = {
          _id: element.value,
          suhStatus: 0,
          suhApprovalComment: null,
          suhActionBy: userId,
          suhActionOn: moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]")
        }

        apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            $('#def_approvedIcon_' + element.value).hide();
            $('#def_unapprovedIcon_' + element.value).hide();
            $('#approvedIcon_' + element.value).show();
            $('#unapprovedIcon_' + element.value).hide();
          } else {
            error = 1;
          }
        });

        loopCount++;

        if (loopCount === checkedBoxCount) {
          if (error) {
            Swal.fire(
              'Notice',
              "Unable to accept some claims. <br> Please check it manually.",
              'warning'
            );
          } else {
            Swal.fire(
              'Approved!',
              'You approved the claim successfully.',
              'success'
            );
          }
        }
      });
    } else {
      Swal.fire(
        'Notice',
        'Please check at least one checkbox to proceed.',
        'warning'
      );
    }
  }

  errorHandling(error: any) {
    try {
      // this.isLoading = false;
      const errorObj = error ? JSON.parse(error) : '';
      //this.toastr.error(errorObj.message, 'Error');
    } catch (error) {
      //this.toastr.error(error.message, 'Error');
    }
  }

}
