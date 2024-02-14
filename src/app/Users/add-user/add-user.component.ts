import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { faStar, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { AppServicesService } from './../../shared/service/app-services.service';

declare var $: any;

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  faStar = faStar;
  faPlus = faPlus;
  heading = 'Add / Create User';
  subheading = 'Create a user / stockist';
  icon = 'pe-7s-network icon-gradient bg-premium-dark';
  userForm: FormGroup;
  submitted = false;
  btnLoader = false;

  commonFields = false;
  officeFields = false;
  fieldFields = false;
  distributorField = false;
  stockistField = false;

  loggedUserId: any = '';

  selectedDivision: any = [];
  selectedStockiest: any = [];
  selectedDistributor: any = [];
  selectedPermission: any = [];
  selectedusertype: number;
  distributors: any = [];
  divisions: any = [];
  stockiestes: any = [];
  accesspermissions: any = [];
  permission: any = [];
  portalId: number;
  distributorStockists: any = [];
  supervisors: any = [];

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
    private apiService: AppServicesService) { }

  ngOnInit(): void {
    const sessionData = sessionStorage.getItem("laUser");
    if (!sessionData) this.router.navigateByUrl('/login');

    // Logged-in user id
    this.loggedUserId = JSON.parse(sessionData).id;
    this.portalId = JSON.parse(sessionData).portal;

    this.createForm();
    this.getAllDivision();
    this.getAllDistributor();
    this.getAllAccessPermision();
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

  addNewUser() {
    this.router.navigateByUrl('/users/addUser');
  }

  get f() { return this.userForm.controls; }

  createForm() {
    this.userForm = this.fb.group({
      userType: ['', [Validators.required]],  // HO, Field, Stockist, Distributor

      username: ['', [Validators.required]],
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
          //console.log(this.stockiestes);
        }
      }
    });
  }

  getDistributorData(e, r) {
    const userType = $('#userTypes').val();
    if (userType === 'distributor') {

    } else {
      let plants = [];
      const currentPlant = e.target.value;
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
        this.getDistributorStockist(e, r);
      }
    }
  }

  appendDivisions(e) {
    const source = parseInt(e.target.value);
    const row = 'all';

    var listdiv = document.querySelector("#division_data_all");
    listdiv.innerHTML = '';

    this.divisions.forEach((item, key) => {
      var div = document.createElement('div');
      div.classList.add("col-sm-4");
      div.innerHTML = '<input class="form-check-input dchkbox" style="margin: 5px 0px 0px 0px;" type="checkbox" name="dchkbox_' + row + '" id="divisionCheckbox_' + row + '_' + key + '" value="' + item.division + '"><label class="form-check-label" style="margin: 2px 0px 2px 4px;" for="divisionCheckbox_' + row + '_' + key + '">' + item.name + '</label>';

      listdiv.appendChild(div);
    });
  }

  getDistributorDivision(e, r) {
    const source = parseInt(e.target.value);
    const row = (r === -1) ? 'def' : r;
    const reqData = { plant: source }

    $('#division_sel_' + row).show();
    $('#division_div_' + row).hide();

    var listdiv = document.querySelector("#division_data_" + row);
    listdiv.innerHTML = '';

    this.apiService.post('/api/distributor/distributorDivison', reqData).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          response.data[0].divisions.forEach((item, key) => {
            const result = this.divisions.filter(element => {
              return element.division === Number(item);
            });

            var div = document.createElement('div');
            div.classList.add("col-sm-4");
            div.innerHTML = '<input class="form-check-input dchkbox" style="margin: 5px 0px 0px 0px;" type="checkbox" name="dchkbox_' + row + '" id="divisionCheckbox_' + source + '_' + key + '" value="' + item + '"><label class="form-check-label" style="margin: 2px 0px 2px 4px;" for="divisionCheckbox_' + source + '_' + key + '">' + result[0].name + '</label>';

            listdiv.appendChild(div);
          });

          $('#division_sel_' + row).hide();
          $('#division_div_' + row).show();
        }
      }
    });
  }

  getDistributorStockist(e, r) {
    this.distributorStockists = [];
    const source = parseInt(e.target.value)
    const row = (r === -1) ? 'def' : r;
    const reqData = { plant: source };

    $('#stockist_sel_' + row).show();
    $('#stockist_div_' + row).hide();

    var listdiv = document.querySelector("#stockist_data_" + row);
    listdiv.innerHTML = '';

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
    console.log('All permission====>', this.permission);
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
    console.log('All permission single====>', this.permission);

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
    this.officeFields = false;
    this.fieldFields = false;
    this.stockistField = false;
    this.distributorField = false;

    $('#dvson_def').hide();
    $('#stkst_def').hide();
    $('#dvson_all').hide();

    // $('#userTypes').removeClass('is-invalid');
    if (e.target.value == 'ho') {
      this.getSupervisor(e);
    }

    if (e.target.value == 'ho' || e.target.value == 'field') {
      this.officeFields = true;
      this.distributorField = true;

      $('#dvson_def').show();
      $('#stkst_def').show();
    }

    if (e.target.value == 'field') {
      this.fieldFields = true;
    }

    if (e.target.value == 'distributor') {
      this.distributorField = true;

      this.appendDivisions(e);
      $('#dvson_all').show();
    }

    if (e.target.value == 'stockist') {
      this.distributorField = true;
      this.stockistField = true;

      $('#dvson_def').show();
    }
    $('#permiss_all').show();
  }

  getSupervisor(e) {
    this.supervisors = [];
    this.apiService.get('/api/userSupervisor', e.target.value).subscribe((response: any) => {
      if (response.status === 200) {
        if (response.data.length) {
          this.supervisors = response.data;
        }
      }
    });
  }

  onSubmit() {


    

    console.log('count---', this.dist().controls.length);
    this.submitted = true;
    let error = false;
    const selectedDivisions = [];
    const selectedStockists = [];
    const selectedAllDivisions = [];

    $('.form-select').removeClass('is-invalid');
    $('.form-control').removeClass('is-invalid');
    $('.container_div').css('border', '1px solid #ced4da');

    $('.text-danger').hide();

    const userType = $("#userTypes option:selected").val();
    const email = $("#email").val();
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

    if (!distributor_def) {
      error = true;
      $('#distributor_def').addClass('is-invalid');
      $('#err_distributor_def').text('Distributor is required').show();
    }

    if (userType === 'distributor') {
      // Get checked divisions
      const daCheckboxes = document.getElementsByName('dchkbox_all');
      for (var d = 0; d < daCheckboxes.length; d++) {
        const checkbox = $("#divisionCheckbox_all_" + d);
        if (checkbox.is(":checked")) {
          const value = checkbox.val();
          selectedAllDivisions.push(value);
        }
      }
      // EOF Get checked divisions

      if (selectedAllDivisions.length === 0) {
        $('#division_div_all').css('border', '1px solid red');
        $('#err_division_div_all').text('At least one division is required.').show();
      }
    }

    if (userType === 'ho') {
      const countDistributor = this.dist().controls.length;
      for (var i = 0; i <= countDistributor; i++) {
        const r = i - 1;
        const row = (r === -1) ? 'def' : r;

        let plant = $('#distributor_' + row).val();

        // Get checked divisions
        const dCheckboxes = document.getElementsByName('dchkbox_' + row);
        for (var d = 0; d < dCheckboxes.length; d++) {
          const checkbox = $("#divisionCheckbox_" + plant + "_" + d);
          if (checkbox.is(":checked")) {
            const value = checkbox.val();
            selectedDivisions.push(value);
          }
        }
        // EOF Get checked divisions

        // Get checked stockist
        const checkboxes = document.getElementsByName('chkbox_' + row);
        for (var s = 0; s < checkboxes.length; s++) {
          const checkbox = $("#inlineCheckbox_" + plant + "_" + s);
          if (checkbox.is(":checked")) {
            const value = checkbox.val();
            selectedStockists.push(value);
          }
        }
        // EOF Get checked stockist

        console.log('selectedDivisions--', selectedDivisions);
        console.log('selectedStockists--', selectedStockists);
      }
    }

    this.userForm.get("permission").setValue(this.permission);
    console.log(this.userForm.value);
    if (this.userForm.valid) {
      const reqData = {};
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
        reqData['portalId'] = this.portalId;
        reqData['loggedUserId'] = this.loggedUserId;
        reqData['divisions'] = selectedAllDivisions;

      }

      this.apiService.post('/api/user/createuser', reqData).subscribe((response: any) => {
        if (response.status === 200) {
          this.toast('success', 'Record has been successfully updated.');
          this.router.navigateByUrl('/users/listUser');
        }
        else {
          this.toast('error', 'Something went wrong, Please try again after some time');
        }
      });
    }
  }



}
