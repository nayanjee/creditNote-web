import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import * as moment from 'moment';

import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-add-claim',
  templateUrl: './add-claim.component.html',
  styleUrls: ['./add-claim.component.css']
})
export class AddClaimComponent implements OnInit {
  // toggle webcam on/off
  public showWebcam = false;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  closeResult: string;
  selectedwebcamrow: any;
  public videoOptions: MediaTrackConstraints = {
    // width: {ideal: 1024},
    // height: {ideal: 576}
  };
  public errors: WebcamInitError[] = [];

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();

  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<boolean | string>();

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create Claim';
  subheading = 'Create a claim and save it to draft page.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';

  myform: FormGroup;
  loading = true;
  showData = true;
  submitted = false;
  btnLoader = false;

  types: any = [
    { id: 'scheme', name: 'Scheme and Rate Difference' },
    { id: 'sample', name: 'Sample Sales' },
    //{ id: 'special', name: 'Special Discount' }
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

  formItems: any = {
    invoice: [],
    division: [],
    divisionId: [],
    product: [],
    productId: [],
    batch: [],
    mrp: [],
    pts: [],
    billingRate: [],
    freeQuantity: [],
    saleQuantity: [],
    difference: [],
    totalDifference: [],
    amount: []
  };

  ngLoader: any = {
    product: [],
    batch: [],
    freeQuantity: []
  };

  years: any = [];
  totalAmount: any = 0;
  sessionData: any;
  currentYear: any;
  currentMonth: any;
  records: any = [];
  tempInterval: any;
  selectedYear: any;
  selectedMonth: any;
  batches: any = [];
  products: any = [];
  divisions: any = [];
  fileNames: any = [];
  stockiests: any = [];
  distributors: any = [];
  selectedFields: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];
  uniqueProducts: any = [];
  divisionBatches: any = [];
  divisionProducts: any = [];
  header: any;
  sticky: any;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService,
    private config: NgSelectModule,
    private modalService: NgbModal
  ) {
    // this.activatedRoute.queryParams.subscribe(params => {
    //   if (params.type) this.selectedType = params.type;
    //   if (params.owner) this.selectedOwner = params.owner;
    // });
  }

  ngOnInit() {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');
    this.sessionData = JSON.parse(sessionData);
    console.log(this.sessionData);

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

    this.selectedFields.month = this.selectedMonth;
    this.selectedFields.year = this.selectedYear;
    this.selectedFields.type = 'scheme';

    this.createForm();
    this.getDistributors();
    this.getProduct();

    this.delay(1000).then(any => {
      this.isDistributors();
    });

    this.delay(5000).then(any => {
      this.tempInterval = setInterval(() => this.onTempSubmit(), 5000);
    });
  }

  ngOnDestroy() {
    clearInterval(this.tempInterval);
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
      if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
        this.getUserDistStockistDivision();
      } else if (this.sessionData.type === 'stockist') {
        this.getStockistDistDivision();
      } else if (this.sessionData.type === 'distributor') {
        this.getDivisionCustomerIds();
      }

      this.getTempData();
    } else {
      this.getDistributors();

      this.delay(1000).then(any => {
        this.isDistributors();
      });
    }
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

          if (this.records && this.records.length) {
            this.selectedFields['distributor'] = this.records[0].plant;
          } else {
            this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
          }

          $('#distributor_loader').hide();
          $('#distributor').show();

          this.getStockiest();
        }
      }
    });
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

  getStockiest() {
    let stockists = [];

    const distributor = this.selectedFields.distributor;
    const stockist = this.userPlantStockists[distributor];

    if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
      stockist.forEach(element => {
        stockists.push(Number(element));
      });
    } else if (this.sessionData.type === 'stockist') {
      stockists.push(Number(stockist));
    }

    this.getDivisions();

    this.apiService.post('/api/getStockiest', stockists).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.stockiests = response.data;

          if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
            // If user has access to approve claim of the distributor (self)
            if (stockist.includes(distributor.toString())) {
              const self = {
                customerId: 1,
                organization: '-- SELF --'
              }
              this.stockiests.push(self);
            }
            // EOF If user has access to approve claim of the distributor (self)
          }

          this.delay(5).then(any => {
            if (this.records && this.records.length) {
              this.selectedFields['stockiest'] = parseInt(this.records[0].customerId);
            } else {
              this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
            }

            $('#stockiest_loader').hide();
            $('#stockiest').show();
          });
        }
      }
    });
  }

  getDivisions() {
    let divisions = [];
    this.divisions = [];

    const distributor = this.selectedFields['distributor'];
    const division = this.userPlantDivisions[distributor];

    division.forEach(element => {
      divisions.push(Number(element));
    });

    this.apiService.post('/api/getDivision', divisions).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
          /* if (this.sessionData.type === 'distributor') {
            const stockiest = $("#stockiest option:selected").text();
            const regExp = /\((.+?)\)/;
            const matches = regExp.exec(stockiest);
            if (matches[1]) {
              const result = response.data.filter(element => {
                return element.plant === Number(matches[1]);
              });
              this.divisions = result;
            }
          } else {
            this.divisions = response.data;
          } */
        }
      }
    });
  }

  getProduct() {
    this.uniqueProducts = [];
    this.apiService.fetch('/api/product/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.products = response.data;

          // Getting a unique products by name
          const map = new Map();
          for (const item of response.data) {
            if (!map.has(item.materialName)) {
              map.set(item.materialName, true);
              this.uniqueProducts.push({
                division: item.division,
                material: item.material,
                materialName: item.materialName
              });
            }
          }
          // EOF Getting a unique products by name
        }
      }
    });
  }

  getStockistDistDivision() {
    this.apiService.get('/api/user/getStockistDistDivision', this.sessionData.id).subscribe((response: any) => {
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
            this.userPlantStockists[element.plant] = element.customerId;

            // get user's division plant wise
            this.userPlantDivisions[element.plant] = element.divisions;
          });

          //this.delay(500).then(any => {
          this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
          $('#distributor_loader').hide();
          $('#distributor').show();

          this.getStockiest();
          //});
        }
      }
    });
  }

  getDivisionCustomerIds() {
    this.apiService.get('/api/user/getDivisionCustomerIds', this.sessionData.id).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data) {
          if (response.data[0].distCustomerIds.length) {
            const result = this.distributors.filter(element => {
              return element.plant === response.data[0].code;
            });
            this.userDistributors.push(result[0]);

            // get user's division plant wise
            this.userPlantDivisions[response.data[0].code] = response.data[0].divisions[0].divisions;

            //this.delay(500).then(any => {

            this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
            $('#distributor_loader').hide();
            $('#distributor').show();

            const self = {
              customerId: 1,
              organization: '-- SELF --'
            }
            this.stockiests.push(self);

            this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
            $('#stockiest_loader').hide();
            $('#stockiest').show();

            this.getDivisions();
          }
        }
      }
    });
  }

  createForm() {
    this.myform = this.fb.group({
      claims: this.fb.array([]),
    });
  }

  claims(): FormArray {
    return this.myform.get("claims") as FormArray
  }

  newClaim(): FormGroup {
    return this.fb.group({
      invoice: '',
      batch: '',
      division: '',
      divisionId: '',
      product: '',
      productId: '',
      mrp: this.defaultValue.mrp,
      pts: this.defaultValue.pts,
      billingRate: '',
      freeQuantity: '',
      saleQuantity: '',
      difference: this.defaultValue.difference,
      totalDifference: this.defaultValue.totalDifference,
      amount: this.defaultValue.amount,
      image: ''
    })
  }

  searchProduct(e, i) {
    const divisionId = e.division;
    this.ngLoader.product[i] = true;
    this.formItems.divisionId[i] = divisionId;


    this.divisionProducts[i] = this.uniqueProducts.filter(element => {
      return element.division === Number(divisionId);
    });

    this.ngLoader.product[i] = false;
  }

  searchBatch(e, i) {
    this.ngLoader.batch[i] = true;
    const materialName = e.materialName;

    const products = this.products.filter(function (d) {
      return d.materialName.toLowerCase() === materialName.toLowerCase();
    });

    const materialIds = [];
    products.forEach(element => {
      materialIds.push(element.material);
    });

    if (materialIds) {
      const reqData = { materials: materialIds };
      this.apiService.post('/api/batchByMaterials', reqData).subscribe((response: any) => {
        if (response.status === 200) {
          if (response.data.length) {
            this.batches[i] = response.data;
            this.ngLoader.batch[i] = false;
          }
        }
      });
    }
  }

  searchBatchPrice(e, i) {
    this.formItems.mrp[i] = e.mrp.toFixed(2);
    this.formItems.pts[i] = e.pts.toFixed(2);
    this.formItems.productId[i] = e.material;
  }

  changeCalculation(e, i, label) {
    const rowId = (i === -1) ? 'def' : i;
    this.formItems[label][i] = e.target.value
    this.ngLoader.freeQuantity[i] = false;

    const billingRate = this.formItems.billingRate[i];
    const freeQuantity = this.formItems.freeQuantity[i];
    const saleQuantity = this.formItems.saleQuantity[i];

    if (billingRate == 0) {
      if (freeQuantity) {
        const pts = this.formItems.pts[i];
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * 10 / 100);
        const amount = pts * freeQuantity;

        this.formItems.difference[i] = difference.toFixed(2);
        this.formItems.totalDifference[i] = totalDifference.toFixed(2);
        this.formItems.amount[i] = amount.toFixed(2);
      } else {
        this.formItems.difference[i] = Number(0).toFixed(2);
        this.formItems.totalDifference[i] = Number(0).toFixed(2);
        this.formItems.amount[i] = Number(0).toFixed(2);
      }
    } else {
      this.formItems.freeQuantity[i] = '';
      this.ngLoader.freeQuantity[i] = true;

      if (billingRate && saleQuantity) {
        const pts = this.formItems.pts[i];
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * 10 / 100);
        const amount = totalDifference * saleQuantity;

        this.formItems.difference[i] = difference.toFixed(2);
        this.formItems.totalDifference[i] = totalDifference.toFixed(2);
        this.formItems.amount[i] = amount.toFixed(2);
      }
    }

    let totalAmount = 0;
    if (this.formItems && this.formItems.amount && this.formItems.amount.length) {
      this.formItems.amount.forEach(element => {
        if (element && element > 0) totalAmount = totalAmount + parseFloat(element);
      });
    }
    this.totalAmount = totalAmount.toFixed(2);
  }

  addClaims() {
    this.claims().push(this.newClaim());
  }

  addSameInvoice(i: number) {
    $('.form-control').removeClass('invalid');
    $('.ngscustom').removeClass('invalid');

    let error = false;
    const formValue = this.myform.value;

    if (!formValue.claims[i].invoice) {
      error = true;
      $('#invoice_' + i).addClass('invalid');
    }
    if (!formValue.claims[i].division) {
      error = true;
      $('#division_' + i).addClass('invalid');
    }

    if (!error) {
      const countFormItems = this.formItems.invoice.length;

      this.formItems.invoice[countFormItems] = formValue.claims[i].invoice;
      this.formItems.division[countFormItems] = formValue.claims[i].division;
      this.formItems.divisionId[countFormItems] = formValue.claims[i].divisionId;
      this.formItems.product[countFormItems] = '';
      this.formItems.productId[countFormItems] = '';
      this.formItems.batch[countFormItems] = '';
      this.formItems.mrp[countFormItems] = '';
      this.formItems.pts[countFormItems] = '';
      this.formItems.billingRate[countFormItems] = '';
      this.formItems.freeQuantity[countFormItems] = '';
      this.formItems.saleQuantity[countFormItems] = '';
      this.formItems.difference[countFormItems] = '';
      this.formItems.totalDifference[countFormItems] = '';
      this.formItems.amount[countFormItems] = '';

      const claimData = this.fb.group({
        invoice: formValue.claims[i].invoice,
        batch: '',
        division: formValue.claims[i].division,
        divisionId: formValue.claims[i].divisionId,
        product: '',
        productId: '',
        mrp: this.defaultValue.mrp,
        pts: this.defaultValue.pts,
        billingRate: '',
        freeQuantity: '',
        saleQuantity: '',
        difference: this.defaultValue.difference,
        totalDifference: this.defaultValue.totalDifference,
        amount: this.defaultValue.amount
      });

      this.claims().push(claimData);

      if (formValue.claims[i].divisionId) {
        const totalRows = this.myform.value.claims.length;
        this.searchProduct({ division: formValue.claims[i].divisionId }, totalRows);
      }
    }
  }

  removeClaim(i: number) {
    this.claims().removeAt(i);

    this.formItems.invoice.splice(i, 1);
    this.formItems.division.splice(i, 1);
    this.formItems.divisionId.splice(i, 1);
    this.formItems.product.splice(i, 1);
    this.formItems.productId.splice(i, 1);
    this.formItems.batch.splice(i, 1);
    this.formItems.mrp.splice(i, 1);
    this.formItems.pts.splice(i, 1);
    this.formItems.billingRate.splice(i, 1);
    this.formItems.freeQuantity.splice(i, 1);
    this.formItems.saleQuantity.splice(i, 1);
    this.formItems.difference.splice(i, 1);
    this.formItems.totalDifference.splice(i, 1);
    this.formItems.amount.splice(i, 1);
  }

  onFileSelected(event, row) {
    const formData = new FormData();
    // formData.append("file", event.target.files[0]);
    for (var i = 0; i < event.target.files.length; i++) {
      formData.append("file", event.target.files[i]);
    }

    this.apiService.upload('/api/UploadClaimInvoices', formData).subscribe((response: any) => {
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

  openWebcam(event, row, content) {
    const rowId = (row === -1) ? 'def' : row;
    this.showWebcam = true;
    this.selectedwebcamrow = rowId;
    this.modalService.open(content, {
      size: 'lg'
    }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
      this.showWebcam = false;
      this.webcamImage = null;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      this.showWebcam = false;
      this.webcamImage = null;
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

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public triggerSnapshot(): void {
    this.trigger.next();

    const row = (this.selectedwebcamrow === 'def') ? -1 : this.selectedwebcamrow;
    const reqData = {};
    reqData['camimg'] = this.webcamImage.imageAsBase64;

    this.apiService.upload('/api/UploadClaimInvoicesWebcam', reqData).subscribe((response: any) => {
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

  changeType(type, target) {

  }

  validateMonth(value, targetId) {

  }

  public clearTempClaim(value, targetId) {

  }

  onTempSubmit() {
    const formValue = this.myform.value;
    const selectedStockiest = this.selectedFields.stockiest;
    const selectedYear = this.selectedFields.year;
    const selectedMonth = this.selectedFields.month;
    const distributor = this.selectedFields.distributor;
    const stockiest = this.selectedFields.stockiest;
    const claimType = this.selectedFields.type;
    const ClaimMonth = this.selectedFields.month;
    const claimYear = this.selectedFields.year;
    const header = distributor + '.::.' + stockiest + '.::.' + claimType + '.::.' + ClaimMonth + '.::.' + claimYear + '.::.' + this.sessionData.id + '.::.' + this.sessionData.type;
    formValue.header = header;

    formValue.claims.forEach((element, index) => {
      let fname = '';
      if (this.fileNames[index] && this.fileNames[index].length) {
        this.fileNames[index].forEach((element, index) => {
          fname = fname + element.filename + '.::.';
        });
      }

      formValue.claims[index].image = fname;
    });

    this.apiService.post('/api/claim/createTempClaim', formValue).subscribe((response: any) => {
      if (response.status === 200) {
        //console.log("Temp Respinse", response);
      }
    });
  }

  onSubmit() {
    let error = false;
    this.btnLoader = true;

    const formValue = this.myform.value;
    const distributor = this.selectedFields.distributor;
    const stockiest = this.selectedFields.stockiest;
    const claimType = this.selectedFields.type;
    const ClaimMonth = this.selectedFields.month;
    const claimYear = this.selectedFields.year;
    const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
    const header = distributor + '.::.' + stockiest + '.::.' + claimType + '.::.' + ClaimMonth + '.::.' + claimYear + '.::.' + this.sessionData.id + '.::.' + this.sessionData.type;
    formValue.header = header;

    $('.form-control').removeClass('invalid');
    $('.ngscustom').removeClass('invalid');

    formValue.claims.forEach((element, index) => {
      if (!element.invoice) {
        error = true;
        $('#invoice_' + index).addClass('invalid');
      }
      if (!element.division) {
        error = true;
        $('#division_' + index).addClass('invalid');
      }
      if (!element.product) {
        error = true;
        $('#product_' + index).addClass('invalid');
      }
      if (!element.batch) {
        error = true;
        $('#batch_' + index).addClass('invalid');
      }
      if (!reg.test(element.billingRate)) {
        error = true;
        $('#billingRate_' + index).addClass('invalid');
      }
      if (!reg.test(element.freeQuantity)) {
        error = true;
        $('#freeQuantity_' + index).addClass('invalid');
      }
      if (!reg.test(element.saleQuantity)) {
        error = true;
        $('#saleQuantity_' + index).addClass('invalid');
      }

      if (!element.billingRate && !element.freeQuantity && !element.saleQuantity) {
        error = true;
        $('#billingRate_' + index).addClass('invalid');
        $('#freeQuantity_' + index).addClass('invalid');
        $('#saleQuantity_' + index).addClass('invalid');
      }
      if (!element.billingRate && !element.freeQuantity && element.saleQuantity) {
        error = true;
        $('#billingRate_' + index).addClass('invalid');
      }
      if (element.billingRate && !element.freeQuantity && !element.saleQuantity) {
        error = true;
        $('#saleQuantity_' + index).addClass('invalid');
      }

      if (element.amount <= 0) {
        error = true;
        $('#amount_' + index).addClass('invalid');
      }


      let fname = '';
      if (this.fileNames[index] && this.fileNames[index].length) {
        this.fileNames[index].forEach((element, index) => {
          fname = fname + element.filename + '.::.';
        });
      }

      formValue.claims[index].image = fname;
    });

    if (error) {
      this.btnLoader = false;
      this.toast('error', 'Something went wrong, fix it from the original record or delete the row with the error.');
      return false;
    }

    this.apiService.post('/api/claim/create', formValue).subscribe((response: any) => {
      clearInterval(this.tempInterval);
      if (response.status === 200) {
        // Delete API call for TEMP records
        this.toast('success', 'Successfully saved in draft.');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    });
  }

  getTempData() {
    this.loading = this.showData = true;
    this.records = [];
    this.totalAmount = 0;

    const requestData = {
      uid: this.sessionData.id
    };

    this.apiService.post('/api/getTempClaim', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          //response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;

          let totalAmount = 0;
          this.records.forEach((element, index) => {
            if (index === 0) {
              this.selectedFields['distributor'] = element.plant;
              this.selectedFields['stockiest'] = element.customerId;
              this.selectedFields['type'] = element.claimType;
              this.selectedFields['month'] = element.claimMonth;
              this.selectedFields['year'] = element.claimYear;
            }

            if (element.divisionId) this.searchProduct({ division: element.divisionId }, index);
            if (element.materialName) this.searchBatch({ materialName: element.materialName }, index);
            if (element.amount) totalAmount = totalAmount + parseFloat(element.amount);
            if (element.billingRate) {
              this.formItems.freeQuantity[index] = '';
              this.ngLoader.freeQuantity[index] = true;
            } else {
              this.formItems.freeQuantity[index] = element.freeQuantity;
              this.ngLoader.freeQuantity[index] = false;
            }

            this.formItems.invoice[index] = element.invoice;
            this.formItems.division[index] = element.divisionName;
            this.formItems.divisionId[index] = element.divisionId;
            this.formItems.product[index] = element.materialName;
            this.formItems.productId[index] = element.material;
            this.formItems.batch[index] = element.batch;
            this.formItems.mrp[index] = element.mrp;
            this.formItems.pts[index] = element.pts;
            this.formItems.billingRate[index] = element.billingRate;
            this.formItems.saleQuantity[index] = element.saleQuantity;
            this.formItems.difference[index] = element.difference;
            this.formItems.totalDifference[index] = element.totalDifference;
            this.formItems.amount[index] = element.amount;

            this.claims().push(
              this.fb.group({
                invoice: element.invoice,
                division: element.divisionName,
                divisionId: element.divisionId,
                product: element.materialName,
                productId: element.material,
                batch: element.batch,
                mrp: element.mrp,
                pts: element.pts,
                billingRate: element.billingRate,
                freeQuantity: element.freeQuantity,
                saleQuantity: element.saleQuantity,
                difference: element.difference,
                totalDifference: element.totalDifference,
                amount: element.amount,
                image: ''
              })
            );

            if (element.files.length) {
              let oldFilename = [];
              element.files.forEach(e => {
                const file = {
                  filename: e.filename,
                  originalname: e.originalFilename
                }
                oldFilename.push(file);
              });
              this.fileNames[index] = oldFilename;
            }
          });

          this.totalAmount = totalAmount.toFixed(2)
        } else {
          this.addClaims();
          this.loading = this.showData = false;
        }
      } else {
        this.toast('error', response.message);
      }
    });
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
