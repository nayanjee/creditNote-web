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
  selector: 'app-fo-approval',
  templateUrl: './fo-approval.component.html',
  styleUrls: ['./fo-approval.component.css']
})
export class FoApprovalComponent implements OnInit {
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
  products: any = [];
  fileNames: any = [];
  divisions: any = [];
  stockiests: any = [];
  categories: any = [];
  particulars: any = [];
  clickedFile: any = [];
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
  requestedQty: number = 0;
  displayStyle: string = "none";
  approvalClickedClaim: any = [];
  distributors: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];
  clickedRecord: any = [];

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

      $("#distributor").val($("#distributor option:eq(1)").val());
      $('#distributor_loader').hide();
      $('#distributor').show();

      this.getStockiest();
      this.getDivisions();

      this.delay(1000).then(any => {
        const distributor = $("#distributor option:selected").val();
        const stockiest = $("#stockiest option:selected").val();
        const month = $("#month option:selected").val();
        const year = $("#year option:selected").val();

        // Put default selected field value
        this.selectedFields['distributor'] = distributor;
        this.selectedFields['stockiest'] = stockiest;
        this.selectedFields['type'] = '';
        this.selectedFields['division'] = '';
        this.selectedFields['month'] = month;
        this.selectedFields['year'] = year;

        this.getData();
      });
    });

    this.getDistributors();
    this.getParticulars();
    this.getCategories();
    this.getProduct();
    this.getBatch();
    this.getUserDistStockistDivision();
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
        }
      }
    });
  }

  getStockiest() {
    let stockists = [];
    const distributor = $("#distributor option:selected").val();
    const stockist = this.userPlantStockists[distributor];
    stockist.forEach(element => {
      stockists.push(Number(element));
    });

    this.apiService.post('/api/getStockiest', stockists).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;

          this.delay(5).then(any => {
            $("#stockiest").val($("#stockiest option:eq(1)").val());
            $('#stockiest_loader').hide();
            $('#stockiest').show();

            const stockiest = $("#stockiest option:selected").val();
            this.selectedFields['stockiest'] = stockiest;
          });
        }
      }
    });
  }

  getDivisions() {
    let divisions = [];
    this.divisions = [];
    const distributor = $("#distributor option:selected").val();
    console.log(distributor);
    const division = this.userPlantDivisions[distributor];
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

  getData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];

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
    this.loading = true;
    this.showData = true;

    const targetId = e.target.id;
    this.selectedFields[targetId] = e.target.value;
    $("#divisionCode").text('');

    const type = this.selectedFields.type;
    const division = this.selectedFields.division;

    if (targetId === 'distributor') {
      this.getStockiest();
      this.getDivisions();

      this.delay(1000).then(any => {
        this.getData();

        this.selectedFields.type = '';
        this.selectedFields.division = '';

        $("#type").val(this.selectedFields.type);
        $("#division").val(this.selectedFields.division);
      });
    }

    if (targetId === 'stockiest' || targetId === 'month' || targetId === 'year') {
      this.getData();

      this.selectedFields.type = '';
      this.selectedFields.division = '';

      $("#type").val(this.selectedFields.type);
      $("#division").val(this.selectedFields.division);
    }

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

  getBatch() {
    this.apiService.fetch('/api/batch/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.batches = response.data;
        }
      }
    });
  }

  /* getBatchDivision(division) {
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
  } */

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
      }).then(async (result) => {
        if (result.value) {
          const allocatQty = await this.allocateQuantity(this.allotedInvoiceQty);

          this.approvalClickedClaim['isApproved'] = true;
          this.approvalClickedClaim['isUnapproved'] = false;
          this.approvalClickedClaim['approvedBy'] = this.sessionData.id;
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
      this.approvalClickedClaim['approvedBy'] = this.sessionData.id;
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
    if (this.sessionData.type === 'field' && this.sessionData.workType === 'field' && record['suhStatus'] != 0) {
      Swal.fire(
        'Sorry',
        'Further process has been done on this claim so you cannot take any action now.',
        'error'
      );
      return;
    } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
      if (record['hoStatus'] != 0) {
        Swal.fire(
          'Sorry',
          'Further process has been done on this claim so you cannot take any action now.',
          'error'
        );
        return;
      } else if (record['ftStatus'] === 2) {
        Swal.fire(
          'Oops... can\'t proceed',
          'Claim has been rejected by the field team.',
          'error'
        );
        return;
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

  rejectClaim() {
    const comments = $.trim($('#comments').val());
    if (comments) {
      if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
        this.approvalClickedClaim['ftApprovalComment'] = comments;
      } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
        this.approvalClickedClaim['suhApprovalComment'] = comments;
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
    const reqData = {
      _id: $('#edit_id').val(),
      plant: $('#edit_distributor').val(),
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
      amount: $('#edit_amount').val()
    }

    if (this.sessionData.type === 'field' && this.sessionData.workType === 'field') {
      reqData['ftUpdateComment'] = $('#update_comments').val();
    } else if (this.sessionData.type === 'field' && this.sessionData.workType === 'suh') {
      reqData['suhUpdateComment'] = $('#update_comments').val();
    } else {
      reqData['ftUpdateComment'] = $('#update_comments').val();
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

  getProduct() {
    this.apiService.fetch('/api/product/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.products = response.data;
        }
      }
    });
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
    console.log(data);
    this.clickedRecord = data;
    console.log(this.clickedRecord);

    var modal = document.getElementById("modalComments");
    modal.style.display = "block";

    
  }
  closeCommentsModal() {
    var modal = document.getElementById("modalComments");
    modal.style.display = "none";
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
