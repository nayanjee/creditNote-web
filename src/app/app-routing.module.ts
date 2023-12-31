import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BaseLayoutComponent } from './Layout/base-layout/base-layout.component';
import { PagesLayoutComponent } from './Layout/pages-layout/pages-layout.component';

// Dashboards
import { AnalyticsComponent } from './DemoPages/Dashboards/analytics/analytics.component';

// Pages
import { ForgotPasswordBoxedComponent } from './DemoPages/UserPages/forgot-password-boxed/forgot-password-boxed.component';
// import { LoginBoxedComponent } from './DemoPages/UserPages/login-boxed/login-boxed.component';
import { LoginBoxedComponent } from './login/login-boxed.component';
import { RegisterBoxedComponent } from './DemoPages/UserPages/register-boxed/register-boxed.component';

// Components
import { ModalsComponent } from './DemoPages/Components/modals/modals.component';
import { TooltipsPopoversComponent } from './DemoPages/Components/tooltips-popovers/tooltips-popovers.component';

import { ChangePasswordComponent } from './change/password/change-password.component';

import { AddClaimComponent } from './Stockiest/add-claim/add-claim.component';
import { EditClaimComponent } from './Stockiest/edit-claim/edit-claim.component';
import { DraftClaimComponent } from './Stockiest/draft-claim/draft-claim.component';
import { ClaimStatusComponent } from './Stockiest/claim-status/claim-status.component';

import { StockiestClaimComponent } from './HeadOffice/stockiest-claim/stockiest-claim.component';
import { ClaimApprovalComponent } from './HeadOffice/claim-approval/claim-approval.component';
import { StatusClaimComponent } from './HeadOffice/status-claim/status-claim.component';

import { UploadHoComponent } from './Upload/sales_ho/uploads.component';
import { UploadDistComponent } from './Upload/sales_dist/uploads.component';

const routes: Routes = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', component: AnalyticsComponent, data: {extraParameter: 'dashboardsMenu'} },

      { path: 'change/password', component: ChangePasswordComponent, data: {extraParameter: 'passwordMenu'} },

      { path: 'stockiest/createClaim', component: AddClaimComponent, data: {extraParameter: 'stockiestElementsMenu'} },
      { path: 'stockiest/updateClaim/:claimId', component: EditClaimComponent, data: {extraParameter: 'stockiestElementsMenu'} },
      { path: 'stockiest/draftClaim', component: DraftClaimComponent, data: {extraParameter: 'stockiestElementsMenu'} },
      { path: 'stockiest/claimStatus', component: ClaimStatusComponent, data: {extraParameter: 'stockiestElementsMenu'} },

      { path: 'headoffice/stockiestClaim', component: StockiestClaimComponent, data: {extraParameter: 'hoElementsMenu'} },
      { path: 'headoffice/claimApproval/:month/:stockiest/:year/:type/:invoice', component: ClaimApprovalComponent, data: {extraParameter: 'hoElementsMenu'} },
      { path: 'headoffice/claimStatus', component: StatusClaimComponent, data: {extraParameter: 'hoElementsMenu'} },

      { path: 'upload/salesHo', component: UploadHoComponent, data: {extraParameter: 'uploadElementsMenu'} },
      { path: 'upload/salesDist', component: UploadDistComponent, data: {extraParameter: 'uploadElementsMenu'} },

      // Components
      { path: 'components/modals', component: ModalsComponent, data: {extraParameter: 'componentsMenu'} },
      { path: 'components/tooltips-popovers', component: TooltipsPopoversComponent, data: {extraParameter: 'componentsMenu'} },
    ]
  },
  {
    path: '',
    component: PagesLayoutComponent,
    children: [
      // User Pages
      { path: 'login', component: LoginBoxedComponent, data: {extraParameter: ''} },
      { path: 'pages/register-boxed', component: RegisterBoxedComponent, data: {extraParameter: ''} },
      { path: 'pages/forgot-password-boxed', component: ForgotPasswordBoxedComponent, data: {extraParameter: ''} },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,
    {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    relativeLinkResolution: 'legacy'
    }
  )],
  exports: [RouterModule]
})

export class AppRoutingModule {
  
}
