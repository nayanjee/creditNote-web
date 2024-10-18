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

  claimForm: FormGroup;
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
  years: any = [];
  sessionData: any;
  currentYear: any;
  currentMonth: any;
  selectedYear: any;
  selectedMonth: any;
  batches: any = [];
  products: any = [];
  divisions: any = [];
  fileNames: any = [];
  stockiests: any = [];
  distributors: any = [];
  selectedFields: any = [];
  preselectedFields: any = [];
  userDistributors: any = [];
  userPlantStockists: any = [];
  userPlantDivisions: any = [];
  loggedUserId: any = '';
  uniqueProducts: any = [];
  alignedStockiest: any = [];
  requiredFileType: string;
  records: any = [];
  tempRecords: any = [];
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
  totalAmount: any = 0;
  tempInterval: any;
  predistributor: any
  prestockiest: any;
  preclaimType: any;
  preclaimMonth: any;
  preclaimYear: any;

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

    this.selectedFields['month'] = this.selectedMonth;
    this.selectedFields['year'] = this.selectedYear;
    this.selectedFields['type'] = 'scheme';

    this.preselectedFields['month'] = this.selectedMonth;
    this.preselectedFields['year'] = this.selectedYear;
    this.preselectedFields['type'] = 'scheme';

    this.createForm();
    this.getDistributors();
    this.getProduct();
    this.getBatch();

    this.delay(1000).then(any => {
      this.isDistributors();
    });

    WebcamUtil.getAvailableVideoInputs().then((mediaDevices: MediaDeviceInfo[]) => {
      this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
    });

    this.delay(10000).then(any => {
      this.tempInterval = setInterval(() => this.onTempSubmit(), 5000);
    });

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  ngOnDestroy() {
    clearInterval(this.tempInterval);
  }

  getTempData() {
    this.loading = this.showData = true;
    this.records = this.tempRecords = [];
    this.totalAmount = 0;

    const distributor = this.selectedFields['distributor'];
    const stockiest = this.selectedFields['stockiest'];
    const month = this.selectedFields['month'];
    const year = this.selectedFields['year'];
    const type = this.selectedFields['type'];
    const division = this.selectedFields['division'];

    const requestData = {
      plant: distributor,
      customerId: stockiest,
      month: month,
      year: year,
      uid: this.sessionData.id
    };

    this.apiService.post('/api/getTempClaim', requestData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data.sort((a, b) => a.invoice - b.invoice);
          this.records = response.data;
          this.tempRecords = response.data;

          this.claimForm.controls['def_invoice'].setValue(this.records[0].invoice, { onlySelf: true });
          this.claimForm.value.def_invoice = this.records.invoice;

          let counter = 0;
          let i = 0;
          this.tempRecords.forEach(element => {

            if (counter === 0) {
              this.selectedFields['distributor'] = element.plant;
              this.selectedFields['stockiest'] = element.customerId;
              this.selectedFields['type'] = element.claimType;
              this.selectedFields['month'] = element.claimMonth;
              this.selectedFields['year'] = element.claimYear;

              this.claimForm.controls['def_invoice'].setValue(element.invoice, { onlySelf: true });
              this.claimForm.value.def_invoice = element.invoice;

              this.claimForm.controls['def_batch'].setValue(element.batch, { onlySelf: true });
              this.claimForm.value.def_batch = element.batch;

              this.claimForm.controls['def_division'].setValue(element.divisionName, { onlySelf: true });
              this.claimForm.value.def_division = element.divisionName;

              this.claimForm.controls['def_divisionId'].setValue(element.divisionId, { onlySelf: true });
              this.claimForm.value.def_divisionId = element.divisdivisionIdionName;

              this.claimForm.controls['def_plantId'].setValue(element.plant, { onlySelf: true });
              this.claimForm.value.def_plantId = element.plant;

              this.claimForm.controls['def_product'].setValue(element.materialName, { onlySelf: true });
              this.claimForm.value.def_product = element.materialName;

              this.claimForm.controls['def_productId'].setValue(element.material, { onlySelf: true });
              this.claimForm.value.def_productId = element.material;

              this.claimForm.controls['def_particulars'].setValue(element.particulars, { onlySelf: true });
              this.claimForm.value.def_particulars = element.particulars;

              this.claimForm.controls['def_mrp'].setValue(element.mrp, { onlySelf: true });
              this.claimForm.value.def_mrp = element.mrp;
              this.claimForm.controls['def_pts'].setValue(element.pts, { onlySelf: true });
              this.claimForm.value.def_pts = element.pts;

              this.claimForm.controls['def_billingRate'].setValue(element.billingRate, { onlySelf: true });
              this.claimForm.value.def_billingRate = element.billingRate;

              this.claimForm.controls['def_margin'].setValue(element.margin, { onlySelf: true });
              this.claimForm.value.def_margin = element.margin;

              this.claimForm.controls['def_freeQuantity'].setValue(element.freeQuantity, { onlySelf: true });
              this.claimForm.value.def_freeQuantity = element.freeQuantity;

              this.claimForm.controls['def_saleQuantity'].setValue(element.saleQuantity, { onlySelf: true });
              this.claimForm.value.def_saleQuantity = element.saleQuantity;

              this.claimForm.controls['def_difference'].setValue(element.difference, { onlySelf: true });
              this.claimForm.value.def_difference = element.difference;

              this.claimForm.controls['def_totalDifference'].setValue(element.totalDifference, { onlySelf: true });
              this.claimForm.value.def_totalDifference = element.totalDifference;

              this.claimForm.controls['def_amount'].setValue(element.amount, { onlySelf: true });
              this.claimForm.value.def_amount = element.amount;

              if (element.files.length) {
                let oldFilename = [];
                element.files.forEach(e => {
                  const file = {
                    filename: e.filename,
                    originalname: e.originalFilename
                  }
                  oldFilename.push(file);
                });
                this.fileNames[-1] = oldFilename;
              }
            } else {
              this.claims().push(
                this.fb.group({
                  invoice: element.invoice,
                  batch: element.batch,
                  division: element.divisionName,
                  divisionId: element.divisionId,
                  plantId: element.plant,
                  product: element.materialName,
                  productId: element.material,
                  particulars: element.particulars,
                  mrp: element.mrp,
                  pts: element.pts,
                  billingRate: element.billingRate,
                  margin: element.margin,
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
                this.fileNames[i] = oldFilename;
              }

              i++;
            }

            counter++;
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

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
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
      def_invoice: '',
      def_batch: '',
      def_division: '',
      def_divisionId: '',
      def_plantId: '',
      def_product: '',
      def_productId: '',
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
      def_image: '',
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
      divisionId: '',
      plantId: '',
      product: '',
      productId: '',
      particulars: '',
      mrp: this.defaultValue.mrp,
      pts: this.defaultValue.pts,
      billingRate: '',
      margin: this.defaultValue.margin,
      freeQuantity: '',
      saleQuantity: '',
      difference: this.defaultValue.difference,
      totalDifference: this.defaultValue.totalDifference,
      amount: this.defaultValue.amount,
      image: ''
    })
  }

  addNewInvoice() {
    this.claims().push(this.newClaim());

    const lastRow = $(".count").last().val();
    const currentRowId = parseInt(lastRow) + 1;
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
          division: $('#division_def').val(),
          divisionId: $('#division_id_def').val(),
          plantId: $('#plant_id_def').val(),
          product: '',
          productId: '',
          particulars: '',
          mrp: this.defaultValue.mrp,
          pts: this.defaultValue.pts,
          billingRate: '',
          margin: this.defaultValue.margin,
          freeQuantity: '',
          saleQuantity: '',
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
          divisionId: '',
          plantId: '',
          product: '',
          productId: '',
          particulars: '',
          mrp: this.defaultValue.mrp,
          pts: this.defaultValue.pts,
          billingRate: '',
          margin: this.defaultValue.margin,
          freeQuantity: '',
          saleQuantity: '',
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

  isDistributors() {
    if (this.distributors[0]) {
      if (this.sessionData.type === 'ho' || this.sessionData.type === 'field') {
        this.getUserDistStockistDivision();
      } else if (this.sessionData.type === 'stockist') {
        this.getStockistDistDivision();
      } else if (this.sessionData.type === 'distributor') {
        this.getDivisionCustomerIds();
      }
    } else {
      this.getDistributors();

      this.delay(1000).then(any => {
        this.isDistributors();
      });
    }
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

            /* response.data[0].distCustomerIds.forEach(element => {
              const org = (element.company === 3300) ? 'Frimline' : 'La Renon';
              const data = {
                customerId: element.customerId,
                organization: element.customerId + ' - ' + org + ' (' + element.company + ')'
              }
              this.stockiests.push(data);
            }); */

            // get user's division plant wise
            this.userPlantDivisions[response.data[0].code] = response.data[0].divisions[0].divisions;

            //this.delay(500).then(any => {

            this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
            this.preselectedFields['distributor'] = this.selectedFields.distributor;
            $('#distributor_loader').hide();
            $('#distributor').show();

            const self = {
              customerId: 1,
              organization: '-- SELF --'
            }
            this.stockiests.push(self);

            //console.log("bdnasff", parseInt(this.stockiests[0].customerId));
            this.prestockiest = this.selectedFields.stockiest;
            this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
            //this.preselectedFields['stockiest'] = this.selectedFields.stockiest;
            $('#stockiest_loader').hide();
            $('#stockiest').show();

            this.getDivisions();
            this.delay(1000).then(any => {
              this.getTempData();
            });
            //});
          }
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

          //this.delay(500).then(any => {

          this.selectedFields['distributor'] = parseInt(this.userDistributors[0].plant);
          this.preselectedFields['distributor'] = this.selectedFields.distributor;

          $('#distributor_loader').hide();
          $('#distributor').show();

          this.getStockiest();
          //});
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
          this.preselectedFields['distributor'] = this.selectedFields.distributor;
          $('#distributor_loader').hide();
          $('#distributor').show();

          this.getStockiest();
          //});
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

  /***** Division key-up functionality *****/
  searchDivision(e, i) {
    const id = (i === -1) ? 'def' : i;
    const inputVal = e.currentTarget.value;
    console.log('e.currentTarget--', e.code);

    $('#division_id_' + id).val('');
    $('#plant_id_' + id).val('');
    $('#product_' + id).val('');
    $('#product_id_' + id).val('');
    $('#product_id_temp_' + id).val('');
    $('#batch_' + id).val('');
    $('#mrp_' + id).val(Number(0).toFixed(2));
    $('#pts_' + id).val(Number(0).toFixed(2));
    $('#billingRate_' + id).val('');

    this.changeCalculation(e, i);

    if (inputVal.length) {
      $('#division_loader_' + id).show();
      let results: any = [];
      results = this.matchDivision(inputVal, i);

      this.delay(10).then(any => {
        this.divisionSuggestions(results, inputVal, i);
      });
    } else {
      $('#division_suggestion_' + id).hide();
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

    let results = [];
    results = this.divisions.filter(function (d) {
      return d.name.toLowerCase().indexOf(e.target.innerText.toLowerCase()) > -1;
    });

    if (results.length > 1) {
      console.log('...More then one division...', results);
      $('#division_id_' + id).val('');
      $('#plant_id_' + id).val('');
    } else {
      $('#division_id_' + id).val(results[0].division);
      $('#plant_id_' + id).val(results[0].plant);
    }

    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');
    $('#division_suggestion_' + id).hide();
  }
  /***** EOF Division key-up functionality *****/

  /***** Product key-up functionality *****/
  searchProduct(e, i) {
    const id = (i === -1) ? 'def' : i;
    const inputVal = e.currentTarget.value;

    $('#product_id_' + id).val('');
    $('#product_id_temp_' + id).val('');
    $('#batch_' + id).val('');
    $('#mrp_' + id).val(Number(0).toFixed(2));
    $('#pts_' + id).val(Number(0).toFixed(2));
    $('#billingRate_' + id).val('');

    this.changeCalculation(e, i);

    if (inputVal.length) {
      $('#product_loader_' + id).show();

      let results: any = [];
      results = this.matchProduct(inputVal, i);

      this.delay(10).then(any => {
        this.productSuggestions(results, inputVal, i);
      });
    } else {
      $('#product_suggestion_' + id).hide();
    }
  }

  matchProduct(str, i) {
    const id = (i === -1) ? 'def' : i;
    const val = str.toLowerCase();
    const plantId = $('#plant_id_' + id).val();
    const divisionId = $('#division_id_' + id).val();

    let results = [];
    results = this.uniqueProducts.filter(element => {
      return element.materialName.toLowerCase().indexOf(val) > -1 &&
        element.division === Number(divisionId); /*  && 
              element.plant === Number(plantId); */
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
    let results = [];
    const id = (row === -1) ? 'def' : row;

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

    const suggestions = document.querySelector('#product_suggestion_' + id + ' ul');
    suggestions.innerHTML = '';
    suggestions.classList.remove('has-suggestions');

    $('#product_' + id).val(e.target.innerText);
    $('#product_id_temp_' + id).val(material);

    /* if (results.length > 1) {
      console.log('...More then one product...', results);
      $('#product_' + id).val('');
      $('#product_id_' + id).val('');
    } else { 
      const suggestions = document.querySelector('#product_suggestion_' + id + ' ul');
      suggestions.innerHTML = '';
      suggestions.classList.remove('has-suggestions');
  
      $('#product_' + id).val(e.target.innerText);
      $('#product_id_' + id).val(results[0].material);
    } */

    $('#product_suggestion_' + id).hide();
  }
  /***** EOF Product key-up functionality *****/

  /***** Batch key-up functionality *****/
  searchBatch(e, i) {
    const id = (i === -1) ? 'def' : i;
    const inputVal = e.currentTarget.value;

    $('#mrp_' + id).val(Number(0).toFixed(2));
    $('#pts_' + id).val(Number(0).toFixed(2));
    $('#billingRate_' + id).val('');

    this.changeCalculation(e, i);

    if (inputVal.length) {
      $('#batch_loader_' + id).show();
      let results: any = [];
      results = this.matchBatch(inputVal, i);

      this.delay(10).then(any => {
        this.batchSuggestions(results, inputVal, i);
      });
    } else {
      $('#batch_suggestion_' + id).hide();
    }
  }

  matchBatch(str, i) {
    const id = (i === -1) ? 'def' : i;
    const val = str.toLowerCase();
    const divisionId = $('#division_id_' + id).val();
    const productId = $('#product_id_temp_' + id).val();
    const plantId = $('#plant_id_' + id).val();
    const explodeProductId = productId.split(",");


    let results = [];
    explodeProductId.forEach(element => {
      let result = [];
      result = this.batches.filter(element2 => {
        return element2.material === Number(element) &&
          element2.division === Number(divisionId) &&
          element2.batch.toLowerCase().indexOf(val) > -1;
      });

      if (result.length) {
        results.push(result);
      }
    });

    return results;
  }

  batchSuggestions(results, inputVal, row) {
    const id = (row === -1) ? 'def' : row;

    const suggestions = document.querySelector('#batch_suggestion_' + id + ' ul');
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
    const material = (filtered.length) ? filtered[0].material : '';

    $('#product_id_' + rowId).val(material);
    $('#mrp_' + rowId).val(mrp.toFixed(2));
    $('#pts_' + rowId).val(pts.toFixed(2));
    $('#ptr_' + rowId).val(ptr.toFixed(2));
    $('#ptd_' + rowId).val(ptd.toFixed(2));
  }
  /***** EOF Batch key-up functionality *****/

  changeCalculation(e, row) {
    const rowId = (row === -1) ? 'def' : row;

    $('#freeQuantity_' + rowId).attr('readonly', false);

    $('#billingRate_' + rowId).removeClass('grf-invalid');
    $('#freeQuantity_' + rowId).removeClass('grf-invalid');
    $('#saleQuantity_' + rowId).removeClass('grf-invalid');

    const billingRate = $('#billingRate_' + rowId).val();
    const freeQuantity = $('#freeQuantity_' + rowId).val();
    const saleQuantity = $('#saleQuantity_' + rowId).val();

    const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
    if (!reg.test(billingRate)) $('#billingRate_' + rowId).addClass('grf-invalid');
    if (!reg.test(freeQuantity)) $('#freeQuantity_' + rowId).addClass('grf-invalid');
    if (!reg.test(saleQuantity)) $('#saleQuantity_' + rowId).addClass('grf-invalid');

    if (billingRate == 0) {
      if (freeQuantity) {
        const pts = $('#pts_' + rowId).val();
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * 10 / 100);
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
      $('#freeQuantity_' + rowId).val('');
      $('#freeQuantity_' + rowId).attr('readonly', true);

      if (billingRate && saleQuantity) {
        const pts = $('#pts_' + rowId).val();
        const difference = pts - billingRate;
        const totalDifference = difference + (billingRate * 10 / 100);
        const amount = totalDifference * saleQuantity;

        $('#difference_' + rowId).val(difference.toFixed(2));
        $('#totalDifference_' + rowId).val(totalDifference.toFixed(2));
        $('#amount_' + rowId).val(amount.toFixed(2));
      }
    }

    let totalRows = $(".count").last().val();
    if (totalRows == undefined) totalRows = -1;
    let totalAmount = 0;
    for (let row = -1; row <= totalRows; row++) {
      const rId = (row === -1) ? 'def' : row;
      const amount = $('#amount_' + rId).val();
      totalAmount = totalAmount + parseFloat(amount);
      //console.log('totalAmount--', totalAmount.toFixed(2));
    }
    this.totalAmount = totalAmount.toFixed(2);
  }

  validateMonth(value, targetId) {
    $('#err_month').hide();

    const selectedYear = this.selectedFields.year;
    const selectedMonth = this.selectedFields.month;

    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      $('#err_month').text('You can\'t claim for this month.').show();
    }

    this.clearTempClaim(value, targetId);
  }

  getStockiest() {
    let stockists = [];

    const distributor = this.selectedFields['distributor'];
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

            this.selectedFields['stockiest'] = parseInt(this.stockiests[0].customerId);
            this.preselectedFields['stockiest'] = this.selectedFields.stockiest;
            //this.clearTempClaim(this.selectedFields.stockiest, 'stockiest');
            $('#stockiest_loader').hide();
            $('#stockiest').show();

            this.getTempData();
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

  getBatch() {
    this.apiService.fetch('/api/batch/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.batches = response.data;
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
          $('#product_' + rowId).val(response.data.materialName);
        }
      }
    });
  }

  onSubmit() {
    $('.grf-def').removeClass('grf-invalid');
    $('.grf-am').removeClass('grf-invalid');

    this.btnLoader = true;
    let error = false;
    let totalRows = $(".count").last().val();
    if (totalRows == undefined) totalRows = -1;

    // Stockiest validation
    $('#err_stockiest').hide();
    $('#stockiest').removeClass('grf-invalid');

    const selectedStockiest = this.selectedFields.stockiest;
    if (!selectedStockiest) {
      error = true;
      $('#stockiest').addClass('grf-invalid');
      $('#err_stockiest').text('Stockiest is required..').show();
    }
    // EOF Stockiest validation


    // Month validation
    $('#err_month').hide();
    $('#month').removeClass('grf-invalid');
    const selectedYear = this.selectedFields.year;
    const selectedMonth = this.selectedFields.month;
    if ((selectedMonth > this.currentMonth) && (selectedYear >= this.currentYear)) {
      error = true;
      $('#month').addClass('grf-invalid');
      $('#err_month').text('You can\'t claim for this month.').show();
    }
    // EOF Month validation

    const distributor = this.selectedFields.distributor;
    const stockiest = this.selectedFields.stockiest;
    const claimType = this.selectedFields.type;
    const ClaimMonth = this.selectedFields.month;
    const claimYear = this.selectedFields.year;

    for (let row = -1; row <= totalRows; row++) {
      const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
      const rowId = (row === -1) ? 'def' : row;

      let header = '';
      // if (this.sessionData.type === 'distributor') {
      //   header = distributor + '.::.' + distributor + '.::.' + claimType + '.::.' + ClaimMonth + '.::.' + claimYear + '.::.' + this.sessionData.id + '.::.' + this.sessionData.type;
      // } else {
      header = distributor + '.::.' + stockiest + '.::.' + claimType + '.::.' + ClaimMonth + '.::.' + claimYear + '.::.' + this.sessionData.id + '.::.' + this.sessionData.type;
      //}
      const invoice = $('#invoice_' + rowId).val();
      const batch = $('#batch_' + rowId).val();
      const division = $('#division_' + rowId).val();
      const divisionId = $('#division_id_' + rowId).val();
      const product = $('#product_' + rowId).val();
      const productId = $('#product_id_' + rowId).val();
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

      if (!invoice) {
        error = true;
        $('#invoice_' + rowId).addClass('grf-invalid');
      }
      if (!division) {
        error = true;
        $('#division_' + rowId).addClass('grf-invalid');
      }
      if (!product) {
        error = true;
        $('#product_' + rowId).addClass('grf-invalid');
      }
      if (!batch) {
        error = true;
        $('#batch_' + rowId).addClass('grf-invalid');
      }

      /* if (!billingRate) {
        error = true;
        $('#billingRate_' + rowId).addClass('grf-invalid');
      } */

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

      if (!billingRate && !freeQuantity && !saleQuantity) {
        error = true;
        $('#billingRate_' + rowId).addClass('grf-invalid');
        $('#freeQuantity_' + rowId).addClass('grf-invalid');
        $('#saleQuantity_' + rowId).addClass('grf-invalid');
      }
      if (!billingRate && !freeQuantity && saleQuantity) {
        error = true;
        $('#billingRate_' + rowId).addClass('grf-invalid');
      }
      if (billingRate && !freeQuantity && !saleQuantity) {
        error = true;
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
      }

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
        this.claimForm.value.def_divisionId = divisionId;
        this.claimForm.value.def_product = product;
        this.claimForm.value.def_productId = productId;
        this.claimForm.value.def_mrp = mrp;
        this.claimForm.value.def_pts = pts;
        this.claimForm.value.def_ptr = ptr;
        this.claimForm.value.def_ptd = ptd;
        this.claimForm.value.def_billingRate = billingRate;
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
        this.claimForm.value.claims[row].divisionId = divisionId;
        this.claimForm.value.claims[row].product = product;
        this.claimForm.value.claims[row].productId = productId;
        this.claimForm.value.claims[row].mrp = mrp;
        this.claimForm.value.claims[row].pts = pts;
        this.claimForm.value.claims[row].ptr = ptr;
        this.claimForm.value.claims[row].ptd = ptd;
        this.claimForm.value.claims[row].billingRate = billingRate;
        this.claimForm.value.claims[row].freeQuantity = freeQuantity;
        this.claimForm.value.claims[row].saleQuantity = saleQuantity;
        this.claimForm.value.claims[row].difference = difference;
        this.claimForm.value.claims[row].totalDifference = totalDifference;
        this.claimForm.value.claims[row].amount = amount;
        this.claimForm.value.claims[row].header = header;
      }
    }

    this.apiService.post('/api/claim/create', this.claimForm.value).subscribe((response: any) => {
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

  onTempSubmit() {
    let totalRows = $(".count").last().val();
    if (totalRows == undefined) totalRows = -1;

    const selectedStockiest = this.selectedFields.stockiest;
    const selectedYear = this.selectedFields.year;
    const selectedMonth = this.selectedFields.month;
    const distributor = this.selectedFields.distributor;
    const stockiest = this.selectedFields.stockiest;
    const claimType = this.selectedFields.type;
    const ClaimMonth = this.selectedFields.month;
    const claimYear = this.selectedFields.year;

    for (let row = -1; row <= totalRows; row++) {
      const reg = /^\d*\.?\d*$/;    // RegEx for number and decimal value
      const rowId = (row === -1) ? 'def' : row;

      let header = distributor + '.::.' + stockiest + '.::.' + claimType + '.::.' + ClaimMonth + '.::.' + claimYear + '.::.' + this.sessionData.id + '.::.' + this.sessionData.type;
      
      const invoice = $('#invoice_' + rowId).val();
      const batch = $('#batch_' + rowId).val();
      const division = $('#division_' + rowId).val();
      const divisionId = $('#division_id_' + rowId).val();
      const product = $('#product_' + rowId).val();
      const productId = $('#product_id_' + rowId).val();
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
          this.claimForm.value.def_divisionId = divisionId;
          this.claimForm.value.def_product = product;
          this.claimForm.value.def_productId = productId;
          this.claimForm.value.def_mrp = mrp;
          this.claimForm.value.def_pts = pts;
          this.claimForm.value.def_ptr = ptr;
          this.claimForm.value.def_ptd = ptd;
          this.claimForm.value.def_billingRate = billingRate;
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
          this.claimForm.value.claims[row].divisionId = divisionId;
          this.claimForm.value.claims[row].product = product;
          this.claimForm.value.claims[row].productId = productId;
          this.claimForm.value.claims[row].mrp = mrp;
          this.claimForm.value.claims[row].pts = pts;
          this.claimForm.value.claims[row].ptr = ptr;
          this.claimForm.value.claims[row].ptd = ptd;
          this.claimForm.value.claims[row].billingRate = billingRate;
          this.claimForm.value.claims[row].freeQuantity = freeQuantity;
          this.claimForm.value.claims[row].saleQuantity = saleQuantity;
          this.claimForm.value.claims[row].difference = difference;
          this.claimForm.value.claims[row].totalDifference = totalDifference;
          this.claimForm.value.claims[row].amount = amount;
          this.claimForm.value.claims[row].header = header;
        }
    }

    this.apiService.post('/api/claim/createTempClaim', this.claimForm.value).subscribe((response: any) => {
      if (response.status === 200) {
        //console.log("Temp Respinse", response);
      }
    });
  }

  changeType(type, target) {
    if (type === 'special') {
      $('.claim-frm').hide();
      $('.special-frm').show();
    } else {
      $('.claim-frm').show();
      $('.special-frm').hide();
    }
    this.clearTempClaim(type, target);
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

  // openWebcam(event, row, content) {
  //   const rowId = (row === -1) ? 'def' : row;
  //   this.showWebcam = true;
  //   this.modalService.open(content, {
  //     size: 'lg'
  //   });
  // }

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

  public clearTempClaim(value, targetId) {
    this.predistributor = this.preselectedFields.distributor;
    this.prestockiest = this.preselectedFields.stockiest;
    this.preclaimType = this.preselectedFields.type;
    this.preclaimMonth = this.preselectedFields.month;
    this.preclaimYear = this.preselectedFields.year;

    if (targetId == "stockiest") {
      this.prestockiest = this.preselectedFields.stockiest;
      this.preselectedFields.stockiest = value;
    }

    if (targetId == "type") {
      this.preclaimType = this.preselectedFields.type;
      this.preselectedFields.type = value;
    }
    if (targetId == "month") {
      this.preclaimMonth = this.preselectedFields.month;
      this.preselectedFields.month = value;
    }
    if (targetId == "year") {
      this.preclaimYear = this.preselectedFields.year;
      this.preselectedFields.year = value;
    }

    let reqData = {
      distributors: this.predistributor,
      stockiest: this.prestockiest,
      claimType: this.preclaimType,
      month: this.preclaimMonth,
      year: this.preclaimYear,
      uid: this.sessionData.id
    };
    
    this.apiService.post('/api/claim/clearTempClaim', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        //console.log("Temp Respinse", response);
      }
    });
  }

}
