import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';
declare var $: any;

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  faStar = faStar;
  faPlus = faPlus;
  heading = 'Edit / Update User';
  subheading = 'Update a user who can use the CN application.';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  userForm: FormGroup;
  submitted = false;
  btnLoader = false;

  commonFields = false;
  officeFields = false;
  fieldFields = false;
  distributorField = false;
  stockistField = false;

  portalId: any;
  selectedusertype: number;
  loggedUserId: any = '';
  divisions: any = [];
  permission: any = [];
  supervisors: any = [];
  stockiestes: any = [];
  distributors: any = [];
  selectedDivision: any = [];
  accesspermissions: any = [];
  selectedStockiest: any = [];
  selectedPermission: any = [];
  selectedDistributor: any = [];
  distributorStockists: any = [];
  selectedStockiestDivision: any = [];
  StockiestDivision: any = [];
  selectedDistributor_divisions_id: any = [];
  records: any = [];
  selectedUser: any;
  userTypes = [
    { id: 'ho', name: 'Head Office' },
    { id: 'field', name: 'Field' },
    { id: 'distributor', name: 'Distributor' },
    { id: 'stockist', name: 'Stockist' },
  ];

  workTypes = [
    { id: 'hos', name: 'HOS' },
    { id: 'suh', name: 'SUH' },
    { id: 'field', name: 'Field' },
  ];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: AppServicesService) {
    this.selectedUser = this.activatedRoute.snapshot.paramMap.get('userId');

  }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.portalId = "648946064477e07c9fc1b862";

    this.createForm();
    this.getAllDivision();
    this.getAllDistributor();
    this.getAllAccessPermision();
    this.getData();


  }
  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(''), ms)).then(() => console.log("Fired"));
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

  getData() {
    this.apiService.get('/api/user', this.selectedUser).subscribe((response: any) => {
      if (response.status === 200) {

        this.records = response.data;
        console.log('this.records--', this.records[0]);
        //console.log('this.records--', this.records[0].cn_stockist_divisions[0].plant);



        this.userForm.controls['userType'].setValue(this.records[0].userType, { onlySelf: true });
        this.userForm.value.userType = this.records[0].userType;
        this.userForm.controls['email'].setValue(this.records[0].email, { onlySelf: true });
        this.userForm.value.email = this.records[0].email;
        this.selectedPermission = this.records[0].gen_permissions[0]._id;

        this.showFormFields(this.records[0].userType);
        if (this.records[0].userType == "stockist") {
          this.userForm.controls['distributor_def'].setValue(this.records[0].cn_stockist_divisions[0].plant, { onlySelf: true });
          this.userForm.value.distributor_def = this.records[0].cn_stockist_divisions[0].plant;
          this.getDistributorData(this.records[0].cn_stockist_divisions[0].plant, -1);
          this.userForm.controls['stockist_all'].setValue(this.records[0].cn_stockist_divisions[0].customerId, { onlySelf: true });
          this.userForm.value.stockist_all = this.records[0].cn_stockist_divisions[0].customerId;

          this.selectedStockiestDivision = this.records[0].cn_stockist_divisions[0]._id;
          let fdivision = this.records[0].cn_stockist_divisions[0].divisions;

          let fpermission = this.records[0].gen_permissions[0].permissions;

          fdivision.forEach((item, key) => {
            this.userForm.controls['stockist_all'].setValue(this.records[0].cn_stockist_divisions[0].customerId, { onlySelf: true });
            this.userForm.value.stockist_all = this.records[0].cn_stockist_divisions[0].customerId;
            this.delay(1000).then(any => {
              const checkBox = document.getElementById("divisionCheckbox_" + this.records[0].cn_stockist_divisions[0].plant + "_" + item);
              checkBox['checked'] = true;
            });

          });
          fpermission.forEach((item, key) => {
            this.delay(1000).then(any => {
              const checkBox = document.getElementById("permissionCheckbox_all_" + item);
              checkBox['checked'] = true;
              this.togglePermissionCheckbox(item);
            });

          });


        }

        if (this.records[0].userType == "distributor") {
          this.userForm.controls['distributor_def'].setValue(this.records[0].cn_distributor_divisions[0].plant, { onlySelf: true });
          this.userForm.value.distributor_def = this.records[0].cn_distributor_divisions[0].plant;
          let fdivision = this.records[0].cn_distributor_divisions[0].divisions;
          let fpermission = this.records[0].gen_permissions[0].permissions;
          this.selectedDistributor_divisions_id = this.records[0].cn_distributor_divisions[0]._id;

          fdivision.forEach((item, key) => {
            //this.userForm.controls['stockist_all'].setValue(this.records[0].cn_stockist_divisions[0].customerId, { onlySelf: true });
            //this.userForm.value.stockist_all = this.records[0].cn_stockist_divisions[0].customerId;
            this.delay(1000).then(any => {
              const checkBox = document.getElementById("divisionCheckbox_all" + "_" + item);
              checkBox['checked'] = true;
            });

          });
          fpermission.forEach((item, key) => {
            this.delay(1000).then(any => {
              const checkBox = document.getElementById("permissionCheckbox_all_" + item);
              checkBox['checked'] = true;
              this.togglePermissionCheckbox(item);
            });

          });


        }




      }
    });
  }


  addNewUser() {
    this.router.navigateByUrl('/users/addUser');
  }

  get f() { return this.userForm.controls; }
  createForm() {
    this.userForm = this.fb.group({
      _id: [this.selectedUser, [Validators.required]],
      userType: ['', [Validators.required]],  // HO, Field, Stockist, Distributor
      username: [''],
      email: ['', [Validators.required]],
      code: [''],    // employee=>EmpCode, stokist=>CustomerId, Distributor=>CustomerId
      workType: [''], // HO, HOS, SUH, Field 
      supervisor: [''],
      distributor_def: [''],
      division_def: [[]],
      stockist_def: [[]],
      stockist_all: [''],
      permission: ['', [Validators.required]],
      portals: this.portalId,
      loggedUserId: this.loggedUserId,
      users: this.fb.array([]),
      dist: this.fb.array([]),
    });
  }

  users(): FormArray {
    return this.userForm.get("users") as FormArray
  }

  dist(): FormArray {
    return this.userForm.get("dist") as FormArray
  }

  newDist(): FormGroup {
    return this.fb.group({
      distributor: '',
      division: '',
      stockiest: ''
    })
  }

  addMore() {
    this.dist().push(this.newDist());
  }

  removeDistributor(i: number) {
    this.dist().removeAt(i);
  }

  getAllDistributor() {
    this.apiService.fetch('/api/distributor/getDistributor9000').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          //this.distributors = response.data;

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

  getAllAccessPermision() {
    this.apiService.get('/api/access/getall', this.portalId).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.accesspermissions = response.data;
        }
      }
    });
  }

  getDistributorData(e, r) {
    const userType = $('#userTypes').val();
    if (userType === 'distributor') {

    } else {
      let plants = [];
      const currentPlant = e;
      const countDistributor = this.dist().controls.length;

      for (var i = 0; i <= countDistributor; i++) {
        const ir = i - 1;
        if (r != ir) {
          const irow = (ir === -1) ? 'def' : ir;
          const plant = $('#distributor_' + irow).val();
          plants.push(plant);
        }
      }

      if (plants.includes(currentPlant)) {
        console.log('Already added');

        const row = (r === -1) ? 'def' : r;
        $('#distributor_' + row).val('');
      } else {
        this.getDistributorDivision(e, r);
        this.getDistributorStockist(e, r, userType);
      }
    }
  }

  appendDivisions(e) {
    const source = parseInt(e);
    const row = 'all';

    var listdiv = document.querySelector("#division_data_all");
    listdiv.innerHTML = '';

    this.divisions.forEach((item, key) => {
      var div = document.createElement('div');
      div.classList.add("col-sm-4");
      div.innerHTML = '<input class="form-check-input dchkbox" style="margin: 5px 0px 0px 0px;" type="checkbox" name="dchkbox_' + row + '" id="divisionCheckbox_' + row + '_' + item.division + '" value="' + item.division + '"><label class="form-check-label" style="margin: 2px 0px 2px 4px;" for="divisionCheckbox_' + row + '_' + key + '">' + item.name + '</label>';

      listdiv.appendChild(div);
    });
  }

  getDistributorDivision(e, r) {
    const source = parseInt(e);
    const row = (r === -1) ? 'def' : r;
    const reqData = { plant: source }

    $('#division_sel_' + row).show();
    $('#division_div_' + row).hide();

    var listdiv = document.querySelector("#division_data_" + row);
    listdiv.innerHTML = '';

    this.apiService.post('/api/distributor/distributorDivison', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.StockiestDivision = response.data[0].divisions;
          console.log(this.StockiestDivision);
          response.data[0].divisions.forEach((item, key) => {
            const result = this.divisions.filter(element => {
              return element.division === Number(item);
            });

            var div = document.createElement('div');
            div.classList.add("col-sm-4");
            div.innerHTML = '<input class="form-check-input dchkbox" style="margin: 5px 0px 0px 0px;" type="checkbox" name="dchkbox_' + row + '" id="divisionCheckbox_' + source + '_' + item + '" value="' + item + '"><label class="form-check-label" style="margin: 2px 0px 2px 4px;" for="divisionCheckbox_' + source + '_' + key + '">' + result[0].name + '</label>';

            listdiv.appendChild(div);

          });

          $('#division_sel_' + row).hide();
          $('#division_div_' + row).show();

          //console.log('avinash---');
        }
      }
    });
  }

  getDistributorStockist(e, r, userType) {
    this.distributorStockists = [];
    const source = parseInt(e)
    const row = (r === -1) ? 'def' : r;
    const reqData = { plant: source };

    $('#stockist_sel_' + row).show();
    $('#stockist_div_' + row).hide();

    var listdiv = document.querySelector("#stockist_data_" + row);
    listdiv.innerHTML = '';

    if (userType === 'ho') {
      var div = document.createElement('div');
      div.classList.add("col-sm-4");
      div.innerHTML = '<input class="form-check-input" style="margin: 5px 0px 0px 0px;" type="checkbox" name="chkbox_' + row + '" id="inlineCheckbox_' + source + '_99999" value="' + source + '"><label class="form-check-label" style="margin: 2px 0px 2px 4px;" for="inlineCheckbox_' + source + '_99999">--- SELF ---</label>';
      listdiv.appendChild(div);
    }

    this.apiService.post('/api/stockiest/distributorStockiest', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.distributorStockists = response.data;
          $.each(response.data, function (key, item) {
            var div = document.createElement('div');
            div.classList.add("col-sm-4");
            div.innerHTML = '<input class="form-check-input" style="margin: 5px 0px 0px 0px;" type="checkbox" name="chkbox_' + row + '" id="inlineCheckbox_' + source + '_' + key + '" value="' + item.customerId + '"><label class="form-check-label" style="margin: 2px 0px 2px 4px;" for="inlineCheckbox_' + source + '_' + key + '">' + item.organization + '</label>';

            listdiv.appendChild(div);
          });

          $('#stockist_sel_' + row).hide();
          $('#stockist_div_' + row).show();
        }
      }
    });
  }

  toggleDivisionCheckbox(r) {
    const row = (r === -1) ? 'def' : r;
    const checkBox = document.getElementById("sddCheckbox_" + row);
    const checkboxes = document.getElementsByName('dchkbox_' + row);
    for (var i = 0, n = checkboxes.length; i < n; i++) {
      if (checkBox['checked'] == true) {
        checkboxes[i]['checked'] = true;
      } else {
        checkboxes[i]['checked'] = false;
      }
    }
  }

  toggleDivisionAllCheckbox(row) {
    const checkBox = document.getElementById("sddCheckbox_" + row);
    const checkboxes = document.getElementsByName('dchkbox_' + row);
    for (var i = 0, n = checkboxes.length; i < n; i++) {
      if (checkBox['checked'] == true) {
        checkboxes[i]['checked'] = true;
      } else {
        checkboxes[i]['checked'] = false;
      }
    }
  }

  toggleCheckbox(r) {
    const row = (r === -1) ? 'def' : r;
    const checkBox = document.getElementById("sdCheckbox_" + row);
    const checkboxes = document.getElementsByName('chkbox_' + row);
    for (var i = 0, n = checkboxes.length; i < n; i++) {
      if (checkBox['checked'] == true) {
        checkboxes[i]['checked'] = true;
      } else {
        checkboxes[i]['checked'] = false;
      }
    }
  }

  togglePermissionAllCheckbox(row) {
    const checkBox = document.getElementById("permissCheckbox_" + row);
    const checkboxes = document.getElementsByName('pchkbox_' + row);
    let j = 1;
    for (var i = 0; i < checkboxes.length; i++) {
      let childcheckbox = $('#permissionCheckbox_all_' + j).val();
      const index = this.permission.indexOf(childcheckbox);
      if (checkBox['checked'] == true) {
        checkboxes[i]['checked'] = true;
        if (index < 0) {
          this.permission.push(childcheckbox);
        }
      } else {
        checkboxes[i]['checked'] = false;
        this.permission = [];
      }
      j++;
    }
  }

  togglePermissionCheckbox(row) {
    const checkBoxall = document.getElementById("permissCheckbox_all");
    const childcheckbox = document.getElementById('permissionCheckbox_all_' + row);
    const perval = $('#permissionCheckbox_all_' + row).val();
    const index = this.permission.indexOf(perval);
    if (childcheckbox['checked'] == false) {
      checkBoxall['checked'] = false;
      if (index > -1) { // only splice array when item is found
        this.permission.splice(index, 1); // 2nd parameter means remove one item only
      }
    }
    else {
      if (index < 0) { // only splice array when item is found
        this.permission.push(perval);
      }
    }
  }

  getAllDivision() {
    this.apiService.fetch('/api/division/all').subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.divisions = response.data;
          // this.selectAllForDivisionItems(this.divisions);
        } else {
          this.divisions = [];
        }
      }
    });
  }

  selectAllForDivisionItems(items: any[]) {
    let allDivisionSelect = (items) => {
      items.forEach((element) => {
        element['selectedAllDivisionGroup'] = 'selectedAllDivisionGroup';
      });
    };

    allDivisionSelect(items);
  }

  showFormFields(e) {


    this.supervisors = [];

    this.commonFields = true;
    this.fieldFields = false;
    this.officeFields = false;
    this.stockistField = false;
    this.distributorField = false;

    $('#dvson_def').hide();
    $('#stkst_def').hide();
    $('#dvson_all').hide();

    // $('#userTypes').removeClass('is-invalid');
    //console.log('target.value--', e);
    if (e == 'ho') {
      this.getSupervisor(e);
    }

    if (e == 'ho' || e == 'field') {
      this.officeFields = true;
      this.distributorField = true;

      $('#dvson_def').show();
      $('#stkst_def').show();
    }

    if (e == 'field') {
      this.fieldFields = true;
    }

    if (e == 'distributor') {
      this.distributorField = true;

      this.appendDivisions(e);
      $('#dvson_all').show();
    }

    if (e == 'stockist') {
      this.distributorField = true;
      this.stockistField = true;

      $('#dvson_def').show();
    }

    $('#permiss_all').show();
  }

  getSupervisor(e) {
    this.supervisors = [];
    //console.log('e.target.value--', e);
    this.apiService.get('/api/userSupervisor', e).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.supervisors = response.data;
        }
      }
    });
  }

  onSubmit() {
    this.submitted = true;
    let error = false;
    const selectedDivisions = [];
    const selectedStockists = [];
    const selectedDistributor = [];
    const selectedAllDivisions = [];

    $('.form-select').removeClass('is-invalid');
    $('.form-control').removeClass('is-invalid');
    $('.container_div').css('border', '1px solid #ced4da');

    $('.text-danger').hide();

    const userType = $("#userTypes option:selected").val();
    const email = $.trim($("#email").val());
    const distributor_def = $("#distributor_def option:selected").val();

    if (!userType) {
      error = true;
      $('#userTypes').addClass('is-invalid');
      $('#err_userTypes').text('User type is required').show();
    }

    if (!email) {
      error = true;
      $('#email').addClass('is-invalid');
      $('#err_email').text('Email is required').show();
    }

    if (email) {
      const regEx = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      if (!regEx) {
        error = true;
        $('#email').addClass('is-invalid');
        $('#err_email').text('Enter Valid Email Address').show();
      }
    }

    if (!distributor_def) {
      error = true;
      $('#distributor_def').addClass('is-invalid');
      $('#err_distributor_def').text('Distributor is required').show();
    }

    if (userType === 'distributor') {
      // Get checked divisions
      //const daCheckboxes = document.getElementsByName('dchkbox_all');
      const daCheckboxes = this.divisions;
      //console.log('distributordivision===', daCheckboxes)
      for (var d = 0; d < daCheckboxes.length; d++) {
        const checkbox = $("#divisionCheckbox_all_" + daCheckboxes[d].division);
        if (checkbox.is(":checked")) {
          const value = checkbox.val();
          selectedAllDivisions.push(value);
        }
      }
      // EOF Get checked divisions

      if (selectedAllDivisions.length === 0) {
        error = true;
        $('#division_div_all').css('border', '1px solid red');
        $('#err_division_div_all').text('At least one division is required.').show();
      }
    }

    if (userType === 'stockist') {
      const stockist = $("#stockist_all option:selected").val();
      if (!stockist) {
        error = true;
        $('#stockist_all').addClass('is-invalid');
        $('#err_stockist_all').text('Stockist is required').show();
      }

      // To collect all checked division
      const countDistributor = this.dist().controls.length;
      for (var i = 0; i <= countDistributor; i++) {
        const r = i - 1;
        const row = (r === -1) ? 'def' : r;
        let plant = $('#distributor_' + row).val();

        // Get checked divisions
        //const dCheckboxes = document.getElementsByName('dchkbox_' + row);
        const dCheckboxes = this.StockiestDivision;
        //console.log('dCheckboxeslength: ' + dCheckboxes.length);
        for (var d = 0; d < dCheckboxes.length; d++) {
          const checkbox = $("#divisionCheckbox_" + plant + "_" + this.StockiestDivision[d]);
          //console.log('divisionCheckbox====: ', "#divisionCheckbox_" + plant + "_" + this.StockiestDivision[d]);
          if (checkbox.is(":checked")) {
            const value = checkbox.val();
            selectedDivisions.push(value);
          }
        }
        // EOF Get checked divisions
      }
      // EOF To collect all checked division

      if (selectedDivisions.length === 0) {
        error = true;
        $('#division_div_def').css('border', '1px solid red');
        $('#err_division_div_def').text('At least one division is required.').show();
      }
    }

    if (userType === 'ho' || userType === 'field') {
      const username = $("#username").val();
      if (!username) {
        error = true;
        $('#username').addClass('is-invalid');
        $('#err_username').text('Name is required').show();
      }

      const code = $("#code").val();
      const typeCode = /^\d+$/.test(code);
      if (!code) {
        error = true;
        $('#code').addClass('is-invalid');
        $('#err_code').text('Employee code is required').show();
      } else if (!typeCode) {
        error = true;
        $('#code').addClass('is-invalid');
        $('#err_code').text('Employee code must be a number only').show();
      } else if (String(code).length != 6) {
        error = true;
        $('#code').addClass('is-invalid');
        $('#err_code').text('Employee code must be 6 digits only').show();
      }

      const supervisor = $("#supervisor option:selected").val();
      if (!supervisor) {
        error = true;
        $('#supervisor').addClass('is-invalid');
        $('#err_supervisor').text('Supervisor is required').show();
      }

      const countDistributor = this.dist().controls.length;
      for (var i = 0; i <= countDistributor; i++) {
        const r = i - 1;
        const row = (r === -1) ? 'def' : r;
        const plant = $('#distributor_' + row + ' option:selected').val();

        if (!plant) {
          error = true;
          $('#distributor_' + row).addClass('is-invalid');
          $('#err_distributor_' + row).text('Distributor is required').show();
        } else {
          selectedDistributor[i] = plant;
        }

        // Get checked divisions
        const sDivisions = [];
        const dCheckboxes = document.getElementsByName('dchkbox_' + row);

        for (var d = 0; d < dCheckboxes.length; d++) {


          const checkbox = $("#divisionCheckbox_" + plant + "_" + d);

          if (checkbox.is(":checked")) {
            const value = checkbox.val();
            sDivisions.push(value);
          }
        }

        if (sDivisions.length === 0) {
          error = true;
          $('#division_sel_' + row).addClass('is-invalid');
          $('#division_div_' + row).css('border', '1px solid red');
          $('#err_division_div_' + row).text('At least one division is required.').show();
        } else {
          selectedDivisions[i] = sDivisions;
        }
        // EOF Get checked divisions

        // Get checked stockist
        const sStockists = [];
        const checkboxes = document.getElementsByName('chkbox_' + row);
        //console.log('checkboxes.length--', checkboxes.length);

        // if SELF checkbox checked
        const checkbox = $("#inlineCheckbox_" + plant + "_99999");
        if (checkbox.is(":checked")) {
          const value = checkbox.val();
          sStockists.push(value);
        }
        // EOF if SELF checkbox checked

        for (var s = 0; s < checkboxes.length; s++) {
          const checkbox = $("#inlineCheckbox_" + plant + "_" + s);
          if (checkbox.is(":checked")) {
            const value = checkbox.val();
            sStockists.push(value);
          }
        }

        if (sStockists.length === 0) {
          error = true;
          $('#stockist_sel_' + row).addClass('is-invalid');
          $('#stockist_div_' + row).css('border', '1px solid red');
          $('#err_stockist_div_' + row).text('At least one stockist is required.').show();
        } else {
          selectedStockists[i] = sStockists;
        }
        // EOF Get checked stockist

        //console.log('selectedDivisions--', selectedDivisions);
        //console.log('selectedStockists--', selectedStockists);
      }
    }

    if (userType === 'field') {
      const workType = $("#workType option:selected").val();
      if (!workType) {
        error = true;
        $('#workType').addClass('is-invalid');
        $('#err_workType').text('Work type is required').show();
      }
    }

    this.userForm.get("permission").setValue(this.permission);

    if (this.userForm.valid) {
      const reqData = {};
      reqData['userType'] = this.userForm.value.userType;
      reqData['email'] = this.userForm.value.email;
      reqData['portalId'] = this.portalId;
      reqData['loggedUserId'] = this.loggedUserId;
      reqData['permission'] = this.userForm.value.permission;
      reqData['_id'] = this.selectedUser;
      reqData['permission_id'] = this.selectedPermission;


      if (userType === 'distributor') {
        // To find distributor organization 
        const val = Number(this.userForm.value.distributor_def);
        const results = this.distributors.filter(function (d) {
          return d.plant === val;
        });
        // EOF To find distributor organization

        reqData['userType'] = this.userForm.value.userType;
        reqData['username'] = results[0].organization;
        reqData['email'] = this.userForm.value.email;
        reqData['code'] = this.userForm.value.distributor_def;
        reqData['divisions'] = selectedAllDivisions;
        reqData['distributor_divisions_id'] = this.selectedDistributor_divisions_id;
      }

      if (userType === 'stockist') {
        // To find stockist organization 
        const val = Number(this.userForm.value.stockist_all);
        const results = this.distributorStockists.filter(function (d) {
          return d.customerId === val;
        });
        // EOF To find stockist organization

        reqData['username'] = results[0].organization;
        reqData['plant'] = this.userForm.value.distributor_def;
        reqData['code'] = this.userForm.value.stockist_all;
        reqData['divisions'] = selectedDivisions;
        reqData['stockist_divisions_id'] = this.selectedStockiestDivision;
      }

      if (userType === 'ho' || userType === 'field') {
        reqData['username'] = this.userForm.value.username;
        reqData['code'] = this.userForm.value.code;
        reqData['supervisor'] = this.userForm.value.supervisor;
        reqData['distributors'] = selectedDistributor;
        reqData['divisions'] = selectedDivisions;
        reqData['stockists'] = selectedStockists;
      }

      if (userType === 'field') {
        reqData['workType'] = this.userForm.value.workType;
      }

      console.log('reqData--', reqData);

      this.apiService.post('/api/user/edituser', reqData).subscribe((response: any) => {
        //console.log('-----', response.status);
        if (response.status === 200) {
          this.toast('success', 'User updated successfully.');
          //this.router.navigateByUrl('/users/listUser');
        } else {
          this.toast('error', response.message);
        }
      });
    }
  }

}