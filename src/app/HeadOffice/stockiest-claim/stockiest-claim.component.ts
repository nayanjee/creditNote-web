import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as moment from 'moment';

import { environment } from './../../../environments/environment';
import { AppServicesService } from '../../shared/service/app-services.service';
//import { AllotmentModalComponent } from './allotment-modal.component';

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
  heading = 'Stockiest Claim';
  subheading = 'Claim sent by stockiest or field officer.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  claimForm: FormGroup;
  loading = true;
  showData = true;
  submitted = false;
  btnLoader = false;
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
  currentYear: any;
  currentMonth: any;
  closeResult: any;
  records: any = [];
  modalReference: any;
  batches: any = [];
  fileNames: any = [];
  divisions: any = [];
  stockiests: any = [];
  categories: any = [];
  particulars: any = [];
  clickedFile: any = [];
  uploadFile: any;
  tempRecords: any = [];
  sessionData: any = '';
  loggedUserId: any = '';
  selectedFields: any = [];
  alignedStockiest: any = [];
  requiredFileType: string;
  pdfSource: string = '';
  salesAndRemainings: any = [];
  allotedInvoiceQty: any = [];
  allotedHoInvoiceQty: any = [];
  allotedQty: number = 0;
  requestedQty: number = 0;
  displayStyle: string = "none";
  approvalClickedClaim: any = [];

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
    this.sessionData = sessionData;

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;

    // Number of stockists aligned with the user
    this.alignedStockiest = JSON.parse(sessionData).stockiest;

    this.getStockiest();
    this.getDivision();

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
      $('#month').val(this.selectedMonth);
      $('#year').val(this.selectedYear);
      $("#stockiest").val($("#stockiest option:eq(1)").val());  // Keep second option selected from the stockist's select box
      $('#stockiest_loader').hide();
      $('#stockiest').show();

      const stockiest = $("#stockiest option:selected").val();
      const month = $("#month option:selected").val();
      const year = $("#year option:selected").val();

      this.getData(stockiest, month, year);
      this.getParticulars();
      this.getCategories();
      this.getBatch();

      // Put default selected field value
      this.selectedFields['stockiest'] = stockiest;
      this.selectedFields['type'] = '';
      this.selectedFields['division'] = '';
      this.selectedFields['month'] = month;
      this.selectedFields['year'] = year;

      // this.delay(1000).then(any => {
      //   this.editRecord();
      // });
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

  validateMonth(e) {
    $('#err_month').hide();

    const selectedYear = $("#year option:selected").val();
    const selectedMonth = $("#month option:selected").val();

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    } else {
      this.filterData(e);
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

  getDivision() {
    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
        }
      }
    });
  }

  getData(stockiest, month, year, type = '', division = '') {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];

    const requestData = {
      customerId: stockiest,
      month: month,
      year: year
    };

    this.apiService.post('/api/claimForApproval', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;

          if (type || division) {
            this.filterDataTwice(type, division);
          }

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

  filterData(e) {
    const targetId = e.target.id;
    this.selectedFields[targetId] = e.target.value;
    $("#divisionCode").text('');
    console.log(targetId);

    const type = this.selectedFields.type;
    const division = this.selectedFields.division;

    if (targetId === 'stockiest' || targetId === 'month' || targetId === 'year') {
      this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year);

      this.selectedFields.type = '';
      this.selectedFields.division = '';

      $("#type").val(this.selectedFields.type);
      $("#division").val(this.selectedFields.division);
    }

    if (division) {
      const div = this.divisions.filter(function (el) {
        return el.name == division;
      });
      const divisionCode = div[0].division;
      $("#divisionCode").text('(' + divisionCode + ')');
    }

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
    console.log('content--', content, typeof content);
    this.pdfSource = '';
    this.clickedFile = data;
    this.clickedFile.invoice = invoice;
    const fileExtension = this.clickedFile.filename.substring(this.clickedFile.filename.length - 4);
    if (fileExtension === '.pdf' || fileExtension === '.PDF') {
      this.pdfSource = this.apiURL + '/uploads/files/' + this.clickedFile.filename;
    }

    console.log(this.clickedFile);
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
            this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year, type, division);
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
        const type = this.selectedFields.type;
        const division = this.selectedFields.division;

        let reqData = { _id: file._id };
        this.apiService.update('/api/claim/deleteFile', reqData).subscribe((response: any) => {
          if (response.status === 200) {
            this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year, type, division);
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
              createdBy: this.loggedUserId
            }
            images.push(img);
          });
          this.apiService.post('/api/claim/fileUpload', images).subscribe((response: any) => {
            if (response.status === 200) {
              this.modalReference.close();
              this.getData(this.selectedFields.stockiest, this.selectedFields.month, this.selectedFields.year);
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
          submittedBy: this.loggedUserId,
          submittedOn: moment().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        };
        reqData.push(temp);
        // reqData[index]['submittedBy'] = this.loggedUserId;
      });

      this.apiService.post('/api/claim/submit', reqData).subscribe((response: any) => {
        console.log('resp--', response);
        if (response.status === 200) {
          this.toast('success', 'Successfully submitted.');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
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

  /***** Particulars key-up functionality *****/
  searchParticulars(e, i) {
    const inputVal = e.currentTarget.value;

    let results: any = [];
    const id = (i === -1) ? 'def' : i;
    console.log('len--', inputVal.length, e.key);

    if (e.key != "Tab") {
      if (inputVal.length) {
        $('#particulars_loader_' + id).show();

        results = this.matchParticulars(inputVal, i);

        this.delay(200).then(any => {
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

      console.log('results--', matches);
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
    console.log(e.target.innerText);

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#particulars_suggestion_' + id).hide();
    $('#particulars_loader_' + id).hide();
    // this.saveParticulars(id, e.target.innerText);
  }
  /***** EOF Particulars key-up functionality *****/

  /* saveParticulars(id, value) {
    const reqData = {
      id: id,
      particulars: value
    }
    this.apiService.post('/api/claim/saveParticulars', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        $('#particulars_loader_' + id).hide();
      } else {
        $('#particulars_' + id).val('');
        this.toast('error', 'Something went wrong please try again.');
      }
    });
  } */

  getCategories() {
    this.apiService.fetch('/api/category/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.categories = response.data;
        }
      }
    });
  }

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
    console.log(e.target.innerText);

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#category_suggestion_' + id).hide();
    $('#category_loader_' + id).show();
    // this.saveCategory(id, e.target.innerText);
  }
  /***** EOF Category key-up functionality *****/

  /* saveCategory(id, value) {
    const reqData = {
      id: id,
      category: value
    }
    this.apiService.post('/api/claim/saveCategory', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        $('#category_loader_' + id).hide();
      } else {
        $('#category_' + id).val('');
        this.toast('error', 'Something went wrong please try again.');
      }
    });
  } */

  /***** Batch key-up functionality *****/
  searchBatch(e) {
    const inputVal = e.currentTarget.value;

    let results: any = [];
    if (e.key != "Tab") {
      $('#edit_division').val('');
      $('#edit_product').val('');
      $('#edit_material').val('');
      $('#edit_mrp').val(Number(0).toFixed(2));
      $('#edit_pts').val(Number(0).toFixed(2));

      if (inputVal.length > 2) {
        $('#edit_batch_loader').show();

        results = this.matchBatch(inputVal);

        this.delay(10).then(any => {
          this.batchSuggestions(results, inputVal);
        });
      } else {
        const suggestions = document.querySelector('#edit_batch_suggestion' + ' ul');
        suggestions.innerHTML = '';
        suggestions.classList.remove('has-suggestions');
        $('#edit_batch_suggestion').hide();
      }
    }
    this.validateClaim();
  }

  matchBatch(str) {
    let results = [];
    const val = str.toLowerCase();

    results = this.batches.filter(function (d) {
      return d.batch.toLowerCase().indexOf(val) > -1;
    });

    return results;
  }

  batchSuggestions(results, inputVal) {
    const suggestions = document.querySelector('#edit_batch_suggestion' + ' ul');
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
    const division = (filtered.length) ? filtered[0].division : 0;
    const material = (filtered.length) ? filtered[0].material : 0;

    if (division) this.getBatchDivision(division);
    if (material) this.getBatchProduct(material);

    $('#edit_mrp').val(mrp.toFixed(2));
    $('#edit_pts').val(pts.toFixed(2));
    $('#edit_ptr').val(ptr.toFixed(2));
    $('#edit_ptd').val(ptd.toFixed(2));
    $('#edit_material').val(material);
  }
  /***** EOF Batch key-up functionality *****/

  getBatch() {
    this.apiService.fetch('/api/batch/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.batches = response.data;
        }
      }
    });
  }

  getBatchDivision(division) {
    this.apiService.get('/api/division', division).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          $('#edit_division').val(response.data.name);
        }
      }
    });
  }

  getBatchProduct(material) {
    this.apiService.get('/api/product', material).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          $('#edit_product').val(response.data.materialName);
          this.validateClaim();
        }
      }
    });
  }

  /* updateSupplyProof(e, id) {
    $('#sproof_loader_' + id).show();
    const selected = $("#sproof_" + id + " option:selected").val();
    const reqData = {
      id: id,
      supplyProof: selected
    }
    this.apiService.post('/api/claim/saveSupplyProof', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        $('#sproof_loader_' + id).hide();
      } else {
        $('#sproof_' + id).val('');
        this.toast('error', 'Something went wrong please try again.');
      }
    });
  }

  UpdatePurchaseOrder(e, id) {
    $('#porder_loader_' + id).show();
    const selected = $("#porder_" + id + " option:selected").val();
    const reqData = {
      id: id,
      purchaseOrder: selected
    }
    this.apiService.post('/api/claim/savePurchaseOrder', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        $('#porder_loader_' + id).hide();
      } else {
        $('#porder_' + id).val('');
        this.toast('error', 'Something went wrong please try again.');
      }
    });
  } */

  async validateApproval(record, event) {
    let errors = '';
    this.allotedQty = 0;
    this.allotedInvoiceQty = [];
    this.salesAndRemainings = [];
    this.allotedHoInvoiceQty = [];
    this.approvalClickedClaim = [];

    const claim = await this.getClaimById(record._id);
    if (claim) {
      if (claim['isFoApproved']) {
        if (event === 'Approve') {
          if (claim['isApproved']) { 
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been approved.',
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
        } else if (event === 'Unapprove') {
          if (claim['isUnapproved']) { 
            Swal.fire(
              'Oops... can\'t proceed',
              'This claim has already been unapproved.',
              'error'
            );
            return;
          }

          const tempParticulars = $('#particulars_' + record._id).val();
          claim['particulars'] = tempParticulars;

          const tempCategory = $('#category_' + record._id).val();
          claim['category'] = tempCategory;

          const tempSupplyProof = $('#sproof_' + record._id).val();
          claim['supplyProof'] = tempSupplyProof;

          const tempPurchaseOrder = $('#porder_' + record._id).val();
          claim['purchaseOrder'] = tempPurchaseOrder;

          claim['isApproved'] = false;
          claim['isUnapproved'] = true;
          claim['unapprovedBy'] = this.loggedUserId;
          claim['unapprovedOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
        } else if (event === 'Cancel') {
          claim['isApproved'] = false;
          claim['isUnapproved'] = false;
          claim['canceledBy'] = this.loggedUserId;
          claim['canceledOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
        }
      } else {
        errors = errors + "Claim has not been accepted by FO.<br>";
      }
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
      this.approvalClickedClaim = claim;

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
      
      this.apiService.post('/api/claim/updateClaim', claim).subscribe((response: any) => {
        if (response.status === 200) {
          // $('#sproof_loader_' + id).hide();
          if (event === 'Approve') {
            this.getRemaining(claim);
          } else if (event === 'Unapprove') {
            $('#def_approvedIcon_' + record._id).hide();
            $('#def_unapprovedIcon_' + record._id).hide();
            $('#approvedIcon_' + record._id).hide();
            $('#unapprovedIcon_' + record._id).show();

            Swal.fire(
              'Un-Approved!',
              'You un-approved the claim successfully.',
              'success'
            );
          } else if (event === 'Cancel') {
            $('#def_approvedIcon_' + record._id).hide();
            $('#def_unapprovedIcon_' + record._id).hide();
            $('#approvedIcon_' + record._id).hide();
            $('#unapprovedIcon_' + record._id).hide();

            Swal.fire(
              'Canceled!',
              'You canceled the claim successfully.',
              'success'
            );
          }
        } else {
          // $('#sproof_' + id).val('');
          // this.toast('error', 'Something went wrong please try again.');
          Swal.fire(
            'Oops',
            'Something went wrong please try again.',
            'error'
          );
        }
      });
    }
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

  async getRemaining(demand) {
    const reqData = {
      customerId: demand.customerId,
      batch: demand.batch
    };
    const hoInvoice: any = await this.hoInvoice(reqData);
    console.log('hoInvoice.length', hoInvoice.length);
    if (hoInvoice.length) {
      this.allotedHoInvoiceQty.push(hoInvoice[0]);

      const salesAndRemainingQuantity: any = await this.salesAndRemainingQuantity(reqData);
      console.log('salesAndRemainingQuantity--', salesAndRemainingQuantity);
      if (salesAndRemainingQuantity) {
        let allotedQty = 0;
        this.salesAndRemainings.push(salesAndRemainingQuantity);

        salesAndRemainingQuantity.forEach(async (remaining) => {
          if (allotedQty >= demand.saleQuantity) {
            // console.log('Break foreach');
            return; // Break foreach loop
          } else {
            let allotQty = 0;
            const requiredQty = demand.saleQuantity - allotedQty;
            const remainingStock = (remaining.remainingData.length) ? remaining.remainingData[0].quantity : remaining.saleUnit;

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
    } else {
      Swal.fire(
        'Oops... can\'t proceed',
        'There has been no billing to the distributor for this batch/material within 1 year.',
        'error'
      );
    }
  }

  hoInvoice(requestData) {
    return new Promise(resolve => {
      console.log('hoInvoice---', requestData);
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

  async approve() {
    if (this.requestedQty > this.allotedQty) {
      Swal.fire({
        title: 'Are you sure want to approve?',
        text: 'Only ' + this.allotedQty + ' quantities out of ' + this.requestedQty + ' are being allotted.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'No, keep it'
      }).then(async(result) => {
        if (result.value) {
          const allocatQty = await this.allocateQuantity(this.allotedInvoiceQty);

          this.approvalClickedClaim['isApproved'] = true;
          this.approvalClickedClaim['isUnapproved'] = false;
          this.approvalClickedClaim['approvedBy'] = this.loggedUserId;
          this.approvalClickedClaim['approvedOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");
      
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
      const allocatQty = await this.allocateQuantity(this.allotedInvoiceQty);
      
      this.approvalClickedClaim['isApproved'] = true;
      this.approvalClickedClaim['isUnapproved'] = false;
      this.approvalClickedClaim['approvedBy'] = this.loggedUserId;
      this.approvalClickedClaim['approvedOn'] = moment().format("YYYY-MM-DDTHH:mm:ss.000[Z]");

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
      console.log('allocateQuantity---', invoices);
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

  editRecord(record) {
    if (record.isFoApproved) {
      $('#edit_id').val(record._id);
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

      var modal = document.getElementById("myModal");
      modal.style.display = "block";

      this.validateClaim();
    } else {
      // You can update only the claims accepted by the FO.
      Swal.fire(
        'Sorry',
        'You can update only the claims accepted by the FO.',
        'error'
      );
    }
  }

  closeEditModal() {
    $('.form-select').removeClass('errorClass');
    $('.form-control').removeClass('errorClass');

    var modal = document.getElementById("myModal");
    modal.style.display = "none";
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
    this.validateClaim();
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

      /* const reqData = {
        _id: $('#edit_id').val(),
        customerId: $('#edit_stockiest').val(),
        claimType: $('#edit_type').val(),
        claimMonth: $('#edit_month').val(),
        claimYear: $('#edit_year').val(),
        invoice: $('#edit_invoice').val(),
        batch: $('#edit_batch').val(),
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
        amount: $('#edit_amount').val(),
        isApproved: false,
        isUnapproved: false
      }

      const allocatedQty: any = await this.getAllocatedQuantity(reqData._id);
      if (allocatedQty.length) {
        allocatedQty.forEach(async element => {
          const reqData2 = {
            billDocNumber: element['stkInvoiceNo'],
            billToParty: reqData.customerId,
            batch: reqData.batch,
            allocatedQty: element['allocatedQty'],
            claimId: reqData._id
          }
          const findUpdateRemaining: any = await this.findUpdateRemaining(reqData2);
        });
      }

      this.apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
        if (response.status === 200) {
          this.toast('success', 'Successfully updated.');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.toast('error', 'Something went wrong. Try refreshing the page or try again later.');
        }
      }); */
    }

  }

  closeUpdateCommentModal() {
    var modal = document.getElementById("updateModalComment");
    modal.style.display = "none";
  }

  async updateCommentClaim() {
    const reqData = {
      _id: $('#edit_id').val(),
      customerId: $('#edit_stockiest').val(),
      claimType: $('#edit_type').val(),
      claimMonth: $('#edit_month').val(),
      claimYear: $('#edit_year').val(),
      invoice: $('#edit_invoice').val(),
      batch: $('#edit_batch').val(),
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
      amount: $('#edit_amount').val(),
      isApproved: false,
      isUnapproved: false,
      updateComment: $('#update_comments').val()
    }

    const allocatedQty: any = await this.getAllocatedQuantity(reqData._id);
    if (allocatedQty.length) {
      allocatedQty.forEach(async element => {
        const reqData2 = {
          billDocNumber: element['stkInvoiceNo'],
          billToParty: reqData.customerId,
          batch: reqData.batch,
          allocatedQty: element['allocatedQty'],
          claimId: reqData._id
        }
        const findUpdateRemaining: any = await this.findUpdateRemaining(reqData2);
      });
    }

    this.apiService.post('/api/claim/updateClaim', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        this.toast('success', 'Successfully updated.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        this.toast('error', 'Something went wrong. Try refreshing the page or try again later.');
      }
    });
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
