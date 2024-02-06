import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as moment from 'moment';

import { environment } from './../../../environments/environment';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-claim-status',
  templateUrl: './claim-status.component.html',
  styleUrls: ['./claim-status.component.css']
})
export class ClaimStatusComponent implements OnInit {
  private apiURL: any = environment.apiURL;

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Claim Status';
  subheading = 'Approve/un-approved and inprogress stockiest claim.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  claimForm: FormGroup;
  submitted = false;
  btnLoader = false;
  loading = false;
  showData = true;
  tempRecords: any = [];
  totalAmount: number = 0;
  selectedYear: any;
  selectedMonth: any;

  types: any = [
    { id: 'scheme', name: 'Scheme and Rate Difference' },
    { id: 'sample', name: 'Sample Sales' },
    { id: 'special', name: 'Special Discount' }
  ];
  months: any = [
    { id: 1, name: '01 - January' },
    { id: 2, name: '02 - February' },
    { id: 3, name: '03 - March' },
    { id: 4, name: '04 - April' },
    { id: 5, name: '05 - May' },
    { id: 6, name: '06 - June' },
    { id: 7, name: '07 - July' },
    { id: 8, name: '08 - August' },
    { id: 9, name: '09 - September' },
    { id: 10, name: '10 - October' },
    { id: 11, name: '11 - November' },
    { id: 12, name: '12 - December' },
  ];
  years: any = [];
  closeResult: any;
  currentYear: any;
  currentMonth: any;
  modalReference: any;
  records: any = [];
  batches: any = [];
  products: any = [];
  category: any = [];
  divisions: any = [];
  fileNames: any = [];
  stockiests: any = [];
  particulars: any = [];
  loggedUserId: any = '';
  selectedFields: any = [];
  alignedStockiest: any = [];
  salesAndRemainings: any = [];
  requiredFileType: string;
  defaultValue: any = {
    mrp: '0.00',
    pts: '0.00',
    ptr: '0.00',
    ptd: '0.00',
    margin: 10,
    difference: '0.00',
    totalDifference: '0.00',
    amount: '0.00'
  };
  pdfSource: string = '';
  clickedFile: any = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService
  ) {
    // this.activatedRoute.queryParams.subscribe(params => {
    //   if (params.type) this.selectedType = params.type;
    //   if (params.owner) this.selectedOwner = params.owner;
    // });
  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;

    // Number of stockists aligned with the user
    this.alignedStockiest = JSON.parse(sessionData).stockiest;

    this.getStockiest();

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

    this.delay(1000).then(any => {
      // To show this data as predefined in the form
      if (parseInt(currentMonth) - 1 <= 0) {
        this.selectedYear = parseInt(currentYear) - 1;
        this.selectedMonth = 12;
       } else {
        this.selectedYear = currentYear;
        this.selectedMonth = parseInt(currentMonth) - 1;
       }

      $('#type').val('scheme');
      $('#month').val(this.selectedMonth);
      $('#year').val(this.selectedYear);

      $("#stockiest").val($("#stockiest option:eq(1)").val());
      $('#stockiest_loader').hide();
      $('#stockiest').show();
    });

    // this.createForm();

    // this.getBatch();
    // this.getDivision();
    // this.getProduct();
    // this.getCategory();
    // this.getParticulars();

    /* $(document).keyup(function(e) {
      if (e.key === "Escape") { // escape key maps to keycode `27`
        $('.suggestions').hide();
     }
    }); */

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

  createForm() {
    this.claimForm = this.fb.group({
      /* def_invoice: '',
      def_batch: '',
      def_division: '',
      def_product: '',
      def_particulars: '',
      def_mrp: this.defaultValue.mrp,
      def_pts: this.defaultValue.pts,
      def_billingRate: '',
      def_margin: this.defaultValue.margin,
      def_freeQuantity: '',
      def_saleQuantity: '',
      def_difference: this.defaultValue.difference,
      def_totalDifference: this.defaultValue.totalDifference,
      def_amount: this.defaultValue.amount,
      def_image: '', */
      claims: this.fb.array([]),
    });
  }

  claims(): FormArray {
    return this.claimForm.get("claims") as FormArray
  }

  newClaim(): FormGroup {
    return this.fb.group({
      invoice: '',
      batch: '',
      division: '',
      product: '',
      material: '',
      particulars: '',
      category: '',
      distInvoice: '',
      distInvQty: '',
      stkInvoice: '',
      stkInvoiceQty: '',
      stkRemnQty: '',
      hdnStkRemnQty: '',
      mrp: this.defaultValue.mrp,
      pts: this.defaultValue.pts,
      ptd: '',
      totalPtdAmt: '',
      billingRate: '',
      margin: this.defaultValue.margin,
      freeQuantity: '',
      saleQuantity: '',
      totalSaleQuantity: '',
      difference: this.defaultValue.difference,
      totalDifference: this.defaultValue.totalDifference,
      amount: this.defaultValue.amount,
      image: ''
    })
  }

  addNewInvoice() {
    this.claims().push(this.newClaim());

    const lastRow = $(".count").last().val();
    const currentRowId = parseInt(lastRow) + 1
    setTimeout(function () {
      if (lastRow === undefined) {
        $('#invoice_0').focus();
      } else {
        $('#invoice_' + currentRowId).focus();
      }
      $('table').scrollLeft(0);   // To scroll left
    }, 5);
  }

  addSameInvoice(i: number) {
    if (i === -1) {   // Default row validation and copy/clone
      let error = 0;

      $('.grf-def').removeClass('grf-invalid');

      // If error border color will be red.
      if (!$('#invoice_def').val()) {
        error = 1;
        $('#invoice_def').addClass('grf-invalid');
      }

      // Fill value of the field 
      if (!error) {
        const claimData = this.fb.group({
          invoice: $('#invoice_def').val(),
          batch: '',
          division: '',
          product: '',
          material: '',
          particulars: '',
          category: '',
          distInvoice: '',
          distInvQty: '',
          stkInvoice: '',
          stkInvoiceQty: '',
          stkRemnQty: '',
          mrp: this.defaultValue.mrp,
          pts: this.defaultValue.pts,
          ptd: '',
          totalPtdAmt: '',
          billingRate: '',
          margin: this.defaultValue.margin,
          freeQuantity: '',
          saleQuantity: '',
          totalSaleQuantity: '',
          difference: this.defaultValue.difference,
          totalDifference: this.defaultValue.totalDifference,
          amount: this.defaultValue.amount,
          image: ''
        })

        this.claims().push(claimData);

        //setTimeout(function () {
        //$('#invoice_0').val(defaultInvoice);
        //this.claimForm.value.claims[0].invoice = defaultInvoice;
        //}, 1);
      }
    } else {
      let error = 0;
      $('.grf-am').removeClass('grf-invalid');

      // If error border color will be red.
      if (!$('#invoice_' + i).val()) {
        error = 1;
        $('#invoice_' + i).addClass('grf-invalid');
      }

      // Fill value of the field 
      if (!error) {
        const claimData = this.fb.group({
          invoice: $('#invoice_' + i).val(),
          batch: '',
          division: '',
          product: '',
          material: '',
          particulars: '',
          category: '',
          distInvoice: '',
          distInvQty: '',
          stkInvoice: '',
          stkInvoiceQty: '',
          stkRemnQty: '',
          mrp: this.defaultValue.mrp,
          pts: this.defaultValue.pts,
          ptd: '',
          totalPtdAmt: '',
          billingRate: '',
          margin: this.defaultValue.margin,
          freeQuantity: '',
          saleQuantity: '',
          totalSaleQuantity: '',
          difference: this.defaultValue.difference,
          totalDifference: this.defaultValue.totalDifference,
          amount: this.defaultValue.amount,
          image: ''
        })

        this.claims().push(claimData);
      }
    }

    $('table').scrollLeft(0);   // To scroll left
  }

  removeClaim(i: number) {
    this.claims().removeAt(i);

    // Delete selected row object.
    delete this.fileNames[i];

    // serialize the index of the objects after delete,
    // so that it can appear in the attachments column and the data can be extracted while submitting the form.
    let newFileNames = [];
    if (this.fileNames[-1]) {
      newFileNames[-1] = this.fileNames[-1];
    }
    this.fileNames.forEach(element => {
      newFileNames.push(element);
    });
    this.fileNames = newFileNames;
    // EOF serialize the index of the objects after delete.
  }

  onFileSelected(event, row) {
    const rowId = (row === -1) ? 'def' : row;

    const frmData = new FormData();
    // formData.append("file", event.target.files[0]);
    for (var i = 0; i < event.target.files.length; i++) {
      frmData.append("file", event.target.files[i]);
    }

    this.apiService.upload('/api/UploadClaimInvoices', frmData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          // To separate files according to RowId
          if (this.fileNames[row]) {
            // If RowId already have data
            response.data.forEach(element => {
              this.fileNames[row].push(element);
            });
          } else {
            // To create and insert data for new RowId
            this.fileNames[row] = response.data;
          }
        }
      } else {
        this.toast('error', response.message);
      }
    })
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(''), ms)).then(() => console.log("Fired"));
  }

  /***** Batch key-up functionality *****/
  searchBatch(e, i) {
    const inputVal = e.currentTarget.value;

    const id = (i === -1) ? 'def' : i;

    $('#mrp_' + id).val(Number(0).toFixed(2));
    $('#pts_' + id).val(Number(0).toFixed(2));

    let results: any = [];

    if (e.key != "Tab") {
      if (inputVal.length > 2) {
        $('#batch_loader_' + id).show();

        results = this.matchBatch(inputVal, i);

        this.delay(10).then(any => {
          this.batchSuggestions(results, inputVal, i);
        });
      } else {
        const suggestions = document.querySelector('#batch_suggestion_' + id + ' ul');
        suggestions.innerHTML = '';
        suggestions.classList.remove('has-suggestions');
        $('#batch_suggestion_' + id).hide();
      }
    }
  }

  matchBatch(str, i) {
    let results = [];
    const val = str.toLowerCase();

    results = this.batches.filter(function (d) {
      return d.batch.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  batchSuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;

    const suggestions = document.querySelector('#batch_suggestion_' + id + ' ul');
    suggestions.innerHTML = '';

    if (results.length > 0) {
      results.forEach((element, index) => {
        // Match word from start
        const match = element.batch.match(new RegExp('^' + inputVal, 'i'));
        if (match) {
          suggestions.innerHTML += `<li>${match.input}</li>`;
        }
      });

      suggestions.classList.add('has-suggestions');
      $('#batch_suggestion_' + id).show();

      $('#batch_loader_' + id).hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#batch_suggestion_' + id).hide();

      $('#batch_loader_' + id).hide();
    }
  }

  batchSelection(e, row) {
    const rowId = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#batch_suggestion_' + rowId + ' ul');

    $('#batch_' + rowId).val(e.target.innerText);
    //$('#batch_def').focus();

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#batch_suggestion_' + rowId).hide();

    const filtered = this.batches.filter((emp) => emp.batch === e.target.innerText);
    const mrp = (filtered.length) ? filtered[0].mrp : 0;
    const pts = (filtered.length) ? filtered[0].pts : 0;
    const ptr = (filtered.length) ? filtered[0].ptr : 0;
    const ptd = (filtered.length) ? filtered[0].ptd : 0;
    const division = (filtered.length) ? filtered[0].division : 0;
    const material = (filtered.length) ? filtered[0].material : 0;

    if (division) this.getBatchDivision(division, rowId);
    if (material) this.getBatchProduct(material, rowId);

    $('#mrp_' + rowId).val(mrp.toFixed(2));
    $('#pts_' + rowId).val(pts.toFixed(2));
    $('#ptr_' + rowId).val(ptr.toFixed(2));
    $('#ptd_' + rowId).val(ptd.toFixed(2));
  }
  /***** EOF Batch key-up functionality *****/


  /***** Division key-up functionality *****/
  searchDivision(e, i) {
    const inputVal = e.currentTarget.value;

    let results: any = [];
    if (inputVal.length > 2) {
      const id = (i === -1) ? 'def' : i;
      $('#division_loader_' + id).show();

      results = this.matchDivision(inputVal, i);

      this.delay(10).then(any => {
        this.divisionSuggestions(results, inputVal, i);
      });
    }
  }

  matchDivision(str, i) {
    let results = [];
    const val = str.toLowerCase();

    results = this.divisions.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  divisionSuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;

    const suggestions = document.querySelector('#division_suggestion_' + id + ' ul');
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
      $('#division_suggestion_' + id).show();

      $('#division_loader_' + id).hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#division_suggestion_' + id).hide();

      $('#division_loader_' + id).hide();
    }
  }

  divisionSelection(e, row) {
    const id = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#division_suggestion_' + id + ' ul');

    $('#division_' + id).val(e.target.innerText);
    //$('#division_def').focus();

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#division_suggestion_' + id).hide();
  }
  /***** EOF Division key-up functionality *****/


  /***** Product key-up functionality *****/
  searchProduct(e, i) {
    const inputVal = e.currentTarget.value;

    let results: any = [];
    if (inputVal.length > 2) {
      const id = (i === -1) ? 'def' : i;
      $('#product_loader_' + id).show();

      results = this.matchProduct(inputVal, i);
      console.log(results);

      this.delay(10).then(any => {
        this.productSuggestions(results, inputVal, i);
      });
    }
  }

  matchProduct(str, i) {
    let results = [];
    const val = str.toLowerCase();

    results = this.products.filter(function (d) {
      return d.materialName.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  productSuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;

    const suggestions = document.querySelector('#product_suggestion_' + id + ' ul');
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
      $('#product_suggestion_' + id).show();

      $('#product_loader_' + id).hide();
    } else {
      results = [];

      // If no result remove all <li>
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
      $('#product_suggestion_' + id).hide();

      $('#product_loader_' + id).hide();
    }
  }

  productSelection(e, row) {
    const id = (row === -1) ? 'def' : row;
    const suggestions = document.querySelector('#product_suggestion_' + id + ' ul');

    $('#product_' + id).val(e.target.innerText);
    //$('#division_def').focus();

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#product_suggestion_' + id).hide();
  }
  /***** EOF Product key-up functionality *****/

  /***** Particulars key-up functionality *****/
  searchParticulars(e, i) {
    const inputVal = e.currentTarget.value;

    let results: any = [];
    const id = (i === -1) ? 'def' : i;
    // console.log('len--', inputVal.length, e.key);


    if (e.key != "Tab") {
      if (inputVal.length) {
        $('#particulars_loader_' + id).show();

        results = this.matchParticulars(inputVal, i);

        this.delay(10).then(any => {
          this.particularsSuggestions(results, inputVal, i);
        });
      } else {
        $('#particulars_suggestion_' + id).hide();
      }
    }
  }

  matchParticulars(str, i) {
    let results = [];
    const val = str.toLowerCase();

    results = this.particulars.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  particularsSuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;
    console.log('id--', id);

    const suggestions = document.querySelector('#particulars_suggestion_' + id + ' ul');
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
      $('#particulars_suggestion_' + id).show();

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
  }
  /***** EOF Particulars key-up functionality *****/

  /***** Category key-up functionality *****/
  searchCategory(e, i) {
    const inputVal = e.currentTarget.value;

    let results: any = [];
    const id = (i === -1) ? 'def' : i;
    // console.log('len--', inputVal.length, e.key);


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

    results = this.category.filter(function (d) {
      return d.name.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  categorySuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;
    // console.log('id--', id);

    const suggestions = document.querySelector('#category_suggestion_' + id + ' ul');
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
      $('#category_suggestion_' + id).show();

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
  }
  /***** EOF Category key-up functionality *****/

  changeMargin(e, row) {
    const pts = $('#pts_' + row).val();
    const margin = $('#margin_' + row).val();
    const billingRate = $('#billingRate_' + row).val();
    const saleQuantity = $('#saleQuantity_' + row).val();

    const totalDifference = (pts - billingRate) + (billingRate * margin / 100);
    const amount = totalDifference * saleQuantity;

    $('#totalDifference_' + row).val(totalDifference.toFixed(2));
    $('#amount_' + row).val(amount.toFixed(2));
  }

  changeCalculation(e, row, rid) {
    const rowId = (row === -1) ? 'def' : row;

    $('#freeQuantity_' + rowId).attr('readonly', false);

    $('#billingRate_' + rowId).removeClass('grf-invalid');
    $('#freeQuantity_' + rowId).removeClass('grf-invalid');
    $('#saleQuantity_' + rowId).removeClass('grf-invalid');

    const pts = $('#pts_' + rowId).val();
    const billingRate = $('#billingRate_' + rowId).val();
    const freeQuantity = $('#freeQuantity_' + rowId).val();
    const saleQuantity = $('#saleQuantity_' + rowId).val();

    const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
    if (!reg.test(billingRate)) $('#billingRate_' + rowId).addClass('grf-invalid');
    if (!reg.test(freeQuantity)) $('#freeQuantity_' + rowId).addClass('grf-invalid');
    if (!reg.test(saleQuantity)) $('#saleQuantity_' + rowId).addClass('grf-invalid');

    if (billingRate == 0) {
      $('#margin_' + rowId).val(0);

      if (freeQuantity) {
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * 0 / 100);
        const amount = pts * freeQuantity;

        $('#difference_' + rowId).val(difference.toFixed(2));
        $('#totalDifference_' + rowId).val(totalDifference.toFixed(2));
        $('#amount_' + rowId).val(amount.toFixed(2));
      } else {
        $('#difference_' + rowId).val(Number(0).toFixed(2));
        $('#totalDifference_' + rowId).val(Number(0).toFixed(2));
        $('#amount_' + rowId).val(Number(0).toFixed(2));
      }
    } else {
      const margn = $('#margin_' + rowId).val();
      const margin = parseInt(margn) ? margn : 10;

      $('#margin_' + rowId).val(margin);
      $('#freeQuantity_' + rowId).val('');
      $('#freeQuantity_' + rowId).attr('readonly', true);

      if (billingRate && saleQuantity) {
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * margin / 100);
        const amount = totalDifference * saleQuantity;

        $('#difference_' + rowId).val(difference.toFixed(2));
        $('#totalDifference_' + rowId).val(totalDifference.toFixed(2));
        $('#amount_' + rowId).val(amount.toFixed(2));
      }
    }

    /* if (rid === 'saleQuantity') {
      console.log('saleQuantity excuted');
      const batch = $('#batch_' + rowId).val();
      const stockiest = this.activatedRoute.snapshot.paramMap.get('stockiest');
      const newRowData = {
        customerId: stockiest,
        batch: batch
      };
      this.delay(1000).then(any => {
      console.log('newRowData---', newRowData);
      });
    } */
  }

  validateMonth() {
    $('#err_month').hide();

    const selectedYear = $("#year option:selected").val();
    const selectedMonth = $("#month option:selected").val();

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    }
  }

  getStockiest() {
    this.apiService.post('/api/getStockiest', this.alignedStockiest).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;
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

  getDivision() {
    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
          // console.log('division---', this.divisions);
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

  getCategory() {
    this.apiService.fetch('/api/category/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.category = response.data;
        }
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

  getBatchDivision(division, rowId) {
    this.apiService.get('/api/division', division).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          $('#division_' + rowId).val(response.data.name);
        }
      }
    });
  }

  getBatchProduct(material, rowId) {
    this.apiService.get('/api/product', material).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          console.log(response.data);
          $('#product_' + rowId).val(response.data.materialName);
          $('#material_' + rowId).val(response.data.material);
        }
      }
    });
  }

  async fetchRemaining(e, row, rid) {
    const rowId = (row === -1) ? 'def' : row;

    const reqData = {
      customerId: this.activatedRoute.snapshot.paramMap.get('stockiest'),
      invoice: $('#invoice_' + rowId).val(),
      batch: $('#batch_' + rowId).val(),
      billingRate: $('#billingRate_' + rowId).val(),
      saleQuantity: $('#saleQuantity_' + rowId).val(),
      freeQuantity: $('#freeQuantity_' + rowId).val(),
      margin: parseInt($('#margin_' + rowId).val()) ? $('#margin_' + rowId).val() : 10,
      files: []
    };
    // console.log('fetchRemaining---', reqData);
    // const result = await this.getRemaining(reqData, row, rid);
    // console.log('result---', result);
  }

  checkQuantity(e, row) {
    // console.log(this.salesAndRemainings);
    const saleQuantity = parseInt($('#saleQuantity_' + row).val());
    const hiddenStock = parseInt($('#hdn_stkRemnQty_' + row).val());

    if (hiddenStock >= saleQuantity) {
      const remaining = hiddenStock - saleQuantity;
      $('#stkRemnQty_' + row).val(remaining);
      $('#totalSaleQuantity_' + row).val(saleQuantity);
    } else {
      $('#stkRemnQty_' + row).val(hiddenStock);
      $('#saleQuantity_' + row).val(0);
      $('#totalSaleQuantity_' + row).val(0);
    }
  }

  async getData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];
    this.totalAmount = 0;

    $('#err_stockiest').hide();
    $('#err_status').hide();
    $('#err_month').hide();

    const stockiest = $("#stockiest option:selected").val();
    const type = $("#type option:selected").val();
    const division = $("#division option:selected").val();
    const month = $("#month option:selected").val();
    const year = $("#year option:selected").val();
    const status = $("#status option:selected").val();

    if (!stockiest || !status) {
      if (!stockiest) $('#err_stockiest').text('it\'s a required field.').show();
      if (!status) $('#err_status').text('it\'s a required field.').show();
      return;
    }

    if ((month > this.currentMonth) && (year >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
      return;
    }

    const requestData = {
      customerId: stockiest,
      month: month,
      year: year,
      status: status
    };

    if (type) requestData['claimType'] = type;
    console.log('requestData---', requestData);

    this.apiService.post('/api/getApprovedClaim', requestData).subscribe((response: any) => {
      console.log(response.data);
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;
          console.log('records---', this.records);

          if (type || division) {
            this.filterDataTwice(type, division);
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

  clear() {
    const currentMonth = moment().format("MM");
    const currentYear = moment().format("YYYY");

    $("#stockiest").val('');
    $("#type").val('');
    $('#month').val(parseInt(currentMonth) - 1);
    $('#year').val(currentYear);
    $("#status").val('');

    $('#stockiest_loader').hide();
    $('#stockiest').show();
  }

  getClaimForApproval(requestData) {
    return new Promise(resolve => {
      this.apiService.post('/api/getClaimForApproval', requestData).subscribe((resp: any) => {
        if (resp.status === 200 && resp.data.length) {
          resolve(resp.data);
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

  getHoSales(batch, custIds) {
    return new Promise(resolve => {
      const reqData = {
        batch: batch,
        custIds: custIds
      }
      this.apiService.post('/api/sales/ho/invoice', reqData).subscribe((resp: any) => {
        resolve(resp);
      });
    });
  }

  onSubmit() {
    // $('.grf-def').removeClass('grf-invalid');
    // $('.grf-am').removeClass('grf-invalid');

    // this.btnLoader = true;
    let error = false;
    let totalRows = $(".count").last().val();
    if (totalRows == undefined) totalRows = -1;

    // Stockiest validation
    // $('#err_stockiest').hide();
    // $('#stockiest').removeClass('grf-invalid');
    // if (!$("#stockiest option:selected").val()) {
    //   error = true;
    //   $('#stockiest').addClass('grf-invalid');
    //   $('#err_stockiest').text('Stockiest is required..').show();
    // }
    // EOF Stockiest validation


    // Month validation
    // $('#err_month').hide();
    // $('#month').removeClass('grf-invalid');
    // const selectedYear = $("#year option:selected").val();
    // const selectedMonth = $("#month option:selected").val();
    // if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
    //   error = true;
    //   $('#month').addClass('grf-invalid');
    //   $('#err_month').text('You can\'t claim for this month.').show();
    // }
    // EOF Month validation

    const stockiest = $("#stockiest option:selected").val();
    const claimType = $("#type option:selected").val();
    const ClaimMonth = $("#month option:selected").val();
    const claimYear = $("#year option:selected").val();

    for (let row = -1; row <= totalRows; row++) {
      const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
      const rowId = (row === -1) ? 'def' : row;

      const header = stockiest + '.::.' + claimType + '.::.' + ClaimMonth + '.::.' + claimYear + '.::.' + this.loggedUserId;
      const invoice = $('#invoice_' + rowId).val();
      const batch = $('#batch_' + rowId).val();
      const division = $('#division_' + rowId).val();
      const product = $('#product_' + rowId).val();
      const mrp = $('#mrp_' + rowId).val();
      const pts = $('#pts_' + rowId).val();
      const ptr = $('#ptr_' + rowId).val();
      const ptd = $('#ptd_' + rowId).val();
      const billingRate = $('#billingRate_' + rowId).val();
      const margin = $('#margin_' + rowId).val();
      const freeQuantity = $('#freeQuantity_' + rowId).val();
      const saleQuantity = $('#saleQuantity_' + rowId).val();
      const difference = $('#difference_' + rowId).val();
      const totalDifference = $('#totalDifference_' + rowId).val();
      const amount = $('#amount_' + rowId).val();

      /* if (!invoice) {
        error = true;
        $('#invoice_' + rowId).addClass('grf-invalid');
      }

      if (!batch) {
        error = true;
        $('#batch_' + rowId).addClass('grf-invalid');
      }

      if (!product) {
        error = true;
        $('#product_' + rowId).addClass('grf-invalid');
      }

      if (!billingRate) {
        error = true;
        $('#billingRate_' + rowId).addClass('grf-invalid');
      }

      if (!reg.test(billingRate)) {
        error = true;
        $('#billingRate_' + rowId).addClass('grf-invalid');
      }

      if (!reg.test(freeQuantity)) {
        error = true;
        $('#freeQuantity_' + rowId).addClass('grf-invalid');
      }

      if (!reg.test(saleQuantity)) {
        error = true;
        $('#saleQuantity_' + rowId).addClass('grf-invalid');
      }

      if (billingRate && !freeQuantity && !saleQuantity) {
        error = true;
        $('#freeQuantity_' + rowId).addClass('grf-invalid');
        $('#saleQuantity_' + rowId).addClass('grf-invalid');
      }

      if (amount <= 0) {
        error = true;
        $('#amount_' + rowId).addClass('grf-invalid');
      }

      if (error) {
        this.btnLoader = false;
        this.toast('error', 'Something went wrong, fix it from the original record or delete the row with the error.');
        return false;
      } */

      // Binding form field and value
      if (row === -1) {
        let fname = '';
        if (this.fileNames[-1] && this.fileNames[-1].length) {
          this.fileNames[-1].forEach((element, index) => {
            fname = fname + element.filename + '.::.';
          });
        }
        this.claimForm.value.def_image = fname;
        this.claimForm.value.def_invoice = invoice;
        this.claimForm.value.def_batch = batch;
        this.claimForm.value.def_division = division;
        this.claimForm.value.def_product = product;
        this.claimForm.value.def_mrp = mrp;
        this.claimForm.value.def_pts = pts;
        this.claimForm.value.def_ptr = ptr;
        this.claimForm.value.def_ptd = ptd;
        this.claimForm.value.def_billingRate = billingRate;
        this.claimForm.value.def_margin = margin;
        this.claimForm.value.def_freeQuantity = freeQuantity;
        this.claimForm.value.def_saleQuantity = saleQuantity;
        this.claimForm.value.def_difference = difference;
        this.claimForm.value.def_totalDifference = totalDifference;
        this.claimForm.value.def_amount = amount;
        this.claimForm.value.header = header;
      } else {
        let fname = '';
        if (this.fileNames[row] && this.fileNames[row].length) {
          this.fileNames[row].forEach((element, index) => {
            fname = fname + element.filename + '.::.';
          });
        }
        this.claimForm.value.claims[row].image = fname;
        this.claimForm.value.claims[row].invoice = invoice;
        this.claimForm.value.claims[row].batch = batch;
        this.claimForm.value.claims[row].division = division;
        this.claimForm.value.claims[row].product = product;
        this.claimForm.value.claims[row].mrp = mrp;
        this.claimForm.value.claims[row].pts = pts;
        this.claimForm.value.claims[row].ptr = ptr;
        this.claimForm.value.claims[row].ptd = ptd;
        this.claimForm.value.claims[row].billingRate = billingRate;
        this.claimForm.value.claims[row].margin = margin;
        this.claimForm.value.claims[row].freeQuantity = freeQuantity;
        this.claimForm.value.claims[row].saleQuantity = saleQuantity;
        this.claimForm.value.claims[row].difference = difference;
        this.claimForm.value.claims[row].totalDifference = totalDifference;
        this.claimForm.value.claims[row].amount = amount;
        this.claimForm.value.claims[row].header = header;
      }
    }

    // console.log('submit--', this.claimForm.value);
    /* this.apiService.post('/api/claim/create', this.claimForm.value).subscribe((response: any) => {
      if (response.status === 200) {
        this.toast('success', 'Successfully saved in draft.');
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    }); */
  }

  viewPopup(content, data) {
    // console.log(data);
    this.pdfSource = '';
    this.clickedFile = data;
    const fileExtension = this.clickedFile.filename.substring(this.clickedFile.filename.length - 4);
    if (fileExtension === '.pdf' || fileExtension === '.PDF') {
      this.pdfSource = this.apiURL + '/uploads/files/' + this.clickedFile.filename;
    }

    // console.log(this.clickedFile);
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
        // Delete selected row object.
        delete this.fileNames[0];

        const reqData = {
          _id: file._id,
          deletedBy: this.loggedUserId
        };
        console.log(reqData);
        /* this.apiService.update('/api/claim/deleteFile', reqData).subscribe((response: any) => {
          if (response.status === 200) {

            Swal.fire(
              'Deleted!',
              'Your imaginary record has been deleted.',
              'success'
            )
          }
        }); */
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
